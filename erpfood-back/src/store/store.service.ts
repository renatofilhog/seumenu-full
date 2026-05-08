import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store } from './entities/store.entity';
import { StorageService } from 'src/storage/storage.service';
import { GetObjectResult } from 'src/storage/storage.types';

export type StoreMediaKind = 'banner' | 'logo';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    private readonly storageService: StorageService,
  ) {}

  async create(createStoreDto: CreateStoreDto, tenantId?: number) {
    if (!tenantId) {
      throw new BadRequestException('Tenant nao resolvido para criacao de loja');
    }

    const existing = await this.storeRepository.findOne({
      where: { tenantId },
      select: ['id'],
    });
    if (existing) {
      throw new BadRequestException('Este tenant ja possui loja cadastrada.');
    }

    const saved = await this.storeRepository.save({
      ...createStoreDto,
      tenantId,
      ativo: true,
    });
    return this.enrichStoreMedia(saved);
  }

  async findAll(tenantId?: number) {
    if (!tenantId) {
      return [];
    }

    const stores = await this.storeRepository.find({
      where: { tenantId, ativo: true },
      order: { id: 'ASC' },
    });
    return Promise.all(stores.map((store) => this.enrichStoreMedia(store)));
  }

  async findOne(id: number, tenantId?: number) {
    const store = await this.storeRepository.findOneBy({ id, tenantId });
    if (!store) {
      return null;
    }
    return this.enrichStoreMedia(store);
  }

  async update(id: number, updateStoreDto: UpdateStoreDto, tenantId?: number) {
    await this.storeRepository.update({ id, tenantId }, updateStoreDto);
    const store = await this.storeRepository.findOneBy({ id, tenantId });
    if (!store) {
      return null;
    }
    return this.enrichStoreMedia(store);
  }

  remove(id: number, tenantId?: number) {
    return this.storeRepository.delete({ id, tenantId });
  }

  async findMe(tenantId?: number) {
    if (!tenantId) {
      return null;
    }

    const store = await this.storeRepository.findOne({
      where: { tenantId, ativo: true },
      order: { id: 'DESC' },
    });
    if (!store) {
      return null;
    }
    return this.enrichStoreMedia(store);
  }

  async upsertMe(payload: CreateStoreDto, tenantId?: number) {
    if (!tenantId) {
      throw new BadRequestException('Tenant nao resolvido para salvar loja');
    }

    const existing = await this.storeRepository.findOne({
      where: { tenantId },
      order: { id: 'DESC' },
    });

    if (!existing) {
      return this.create(payload, tenantId);
    }

    await this.storeRepository.update({ id: existing.id, tenantId }, payload);
    const updated = await this.storeRepository.findOneBy({ id: existing.id, tenantId });
    return updated ? this.enrichStoreMedia(updated) : null;
  }

  async getMediaStream(kind: StoreMediaKind, tenantId?: number): Promise<GetObjectResult | null> {
    if (!tenantId) {
      return null;
    }

    const store = await this.findActiveStoreEntity(tenantId);
    if (!store) {
      return null;
    }

    const source = kind === 'banner' ? store.bannerUrl : store.logoUrl;
    const objectRef = this.parseS3Url(source);
    if (!objectRef) {
      return null;
    }

    return this.storageService.getObject(objectRef.bucket, objectRef.objectKey);
  }

  private async enrichStoreMedia(store: Store) {
    const bannerUrl = this.resolveMediaUrl(store.bannerUrl, 'banner');
    const logoUrl = this.resolveMediaUrl(store.logoUrl, 'logo');
    return {
      ...store,
      bannerUrl,
      logoUrl,
    };
  }

  private resolveMediaUrl(value: string | undefined, kind: StoreMediaKind) {
    if (!value) {
      return value;
    }

    const objectRef = this.parseS3Url(value);
    if (!objectRef) {
      return value;
    }

    return this.storageService.isPublicReadEnabled()
      ? this.storageService.getPublicUrl(objectRef.bucket, objectRef.objectKey)
      : `/store/media/${kind}`;
  }

  private async findActiveStoreEntity(tenantId: number) {
    return this.storeRepository.findOne({
      where: { tenantId, ativo: true },
      order: { id: 'DESC' },
    });
  }

  private parseS3Url(value?: string) {
    if (!value || !value.startsWith('s3://')) {
      return null;
    }

    const [bucket, ...keyParts] = value.replace('s3://', '').split('/');
    const objectKey = keyParts.join('/');
    if (!bucket || !objectKey) {
      return null;
    }

    return { bucket, objectKey };
  }
}
