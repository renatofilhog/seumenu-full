import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { RequestTenant } from 'src/tenant/types/request-tenant.type';
import { StorageService } from 'src/storage/storage.service';
import { FileObject } from './entities/file-object.entity';

type FileAuthContext = {
  user?: JwtPayload;
  tenant?: RequestTenant;
};

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileObject)
    private readonly fileRepository: Repository<FileObject>,
    private readonly storageService: StorageService,
  ) {}

  async upload(file: Express.Multer.File, context: FileAuthContext) {
    const tenantId = this.resolveTenantId(context);
    const bucket = this.storageService.getDefaultBucket();
    const objectKey = this.buildObjectKey({
      tenantId,
      entity: 'files',
      extension: extname(file.originalname),
    });

    const uploadResult = await this.storageService.uploadObject({
      bucket,
      key: objectKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    const row = await this.fileRepository.save(
      this.fileRepository.create({
        tenantId,
        provider: 's3',
        bucket: uploadResult.bucket,
        objectKey: uploadResult.key,
        originalFilename: file.originalname,
        contentType: file.mimetype,
        size: String(file.size),
        etag: uploadResult.etag,
      }),
    );

    return this.enrichWithUrl(row);
  }

  async findById(id: number, context: FileAuthContext) {
    const row = await this.fileRepository.findOne({
      where: { id },
    });
    if (!row || row.deletedAt) {
      throw new NotFoundException('Arquivo nao encontrado');
    }
    this.ensureTenantAccess(row, context);
    return this.enrichWithUrl(row);
  }

  async deleteById(id: number, context: FileAuthContext) {
    const row = await this.fileRepository.findOne({
      where: { id },
    });
    if (!row || row.deletedAt) {
      throw new NotFoundException('Arquivo nao encontrado');
    }
    this.ensureTenantAccess(row, context);

    await this.storageService.deleteObject(row.bucket, row.objectKey);
    row.deletedAt = new Date();
    await this.fileRepository.save(row);

    return { id: row.id, deleted: true };
  }

  async getDownloadData(id: number, context: FileAuthContext) {
    const row = await this.fileRepository.findOne({ where: { id } });
    if (!row || row.deletedAt) {
      throw new NotFoundException('Arquivo nao encontrado');
    }
    this.ensureTenantAccess(row, context);

    const object = await this.storageService.getObject(row.bucket, row.objectKey);
    return {
      file: row,
      object,
    };
  }

  private async enrichWithUrl(row: FileObject) {
    const accessUrl = this.storageService.isPublicReadEnabled()
      ? this.storageService.getPublicUrl(row.bucket, row.objectKey)
      : await this.storageService.getPresignedUrl(row.bucket, row.objectKey);

    return {
      id: row.id,
      tenantId: row.tenantId,
      bucket: row.bucket,
      objectKey: row.objectKey,
      originalFilename: row.originalFilename,
      contentType: row.contentType,
      size: Number(row.size),
      etag: row.etag,
      createdAt: row.createdAt,
      url: accessUrl,
    };
  }

  private resolveTenantId(context: FileAuthContext) {
    return context.user?.tenantId ?? context.tenant?.id;
  }

  private ensureTenantAccess(row: FileObject, context: FileAuthContext) {
    const principalType = context.user?.principalType;
    if (principalType === 'saas_management_user') {
      return;
    }

    const tenantId = this.resolveTenantId(context);
    if (row.tenantId && tenantId && row.tenantId !== tenantId) {
      throw new UnauthorizedException('Arquivo nao pertence ao tenant atual');
    }
  }

  private buildObjectKey(params: { tenantId?: number; entity: string; extension?: string }) {
    const tenantSegment = params.tenantId ? String(params.tenantId) : 'global';
    const normalizedExt = (params.extension || '').replace(/[^a-zA-Z0-9.]/g, '');
    return `tenant/${tenantSegment}/${params.entity}/${randomUUID()}${normalizedExt}`;
  }
}
