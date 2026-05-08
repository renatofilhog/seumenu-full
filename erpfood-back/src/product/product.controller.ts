import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { OptionalFileInterceptor } from 'src/common/interceptors/optional-file.interceptor';
import { ApiBody, ApiConsumes, ApiOkResponse } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductService } from './product.service';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { RequestTenant } from 'src/tenant/types/request-tenant.type';
import { StorageService } from 'src/storage/storage.service';

type ProductRequest = Request & {
  user?: JwtPayload;
  tenant?: RequestTenant;
};

const maxFileSize = Number(process.env.STORAGE_MAX_FILE_SIZE_MB ?? '10') * 1024 * 1024;

@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @UseInterceptors(
    OptionalFileInterceptor('imagem', {
      storage: memoryStorage(),
      limits: { fileSize: maxFileSize },
    }),
  )
  @Permissions('product.create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nome: { type: 'string' },
        descricao: { type: 'string' },
        preco: { type: 'string' },
        ativo: { type: 'boolean' },
        destaque: { type: 'boolean' },
        imagemUrl: { type: 'string' },
        imagem: { type: 'string', format: 'binary' },
        ordem: { type: 'number' },
        grupoId: { type: 'number' },
        grupoIds: { type: 'array', items: { type: 'number' } },
        additionalIds: { type: 'array', items: { type: 'number' } },
      },
    },
  })
  @ApiOkResponse({ type: Product })
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() imagem?: Express.Multer.File,
    @Req() req?: ProductRequest,
  ) {
    const normalizedDto = this.normalizeMultipartDto(createProductDto);
    const tenantId = this.resolveTenantId(req);
    const imagemUrl = await this.resolveImagemUrl(normalizedDto.imagemUrl, imagem, 'products', tenantId);
    return this.productService.create({ ...normalizedDto, imagemUrl }, tenantId);
  }

  @Get()
  @ApiOkResponse({ type: Product, isArray: true })
  findAll(@Req() req?: ProductRequest) {
    return this.productService.findAll(this.resolveTenantId(req));
  }

  @Get(':id')
  @ApiOkResponse({ type: Product })
  findOne(@Param('id') id: string, @Req() req?: ProductRequest) {
    return this.productService.findOne(+id, this.resolveTenantId(req));
  }

  @UseInterceptors(
    OptionalFileInterceptor('imagem', {
      storage: memoryStorage(),
      limits: { fileSize: maxFileSize },
    }),
  )
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nome: { type: 'string' },
        descricao: { type: 'string' },
        preco: { type: 'string' },
        ativo: { type: 'boolean' },
        destaque: { type: 'boolean' },
        imagemUrl: { type: 'string' },
        imagem: { type: 'string', format: 'binary' },
        ordem: { type: 'number' },
        grupoId: { type: 'number' },
        grupoIds: { type: 'array', items: { type: 'number' } },
        additionalIds: { type: 'array', items: { type: 'number' } },
      },
    },
  })
  @ApiOkResponse({ type: Product })
  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('product.update')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() imagem?: Express.Multer.File,
    @Req() req?: ProductRequest,
  ) {
    const normalizedDto = this.normalizeMultipartDto(updateProductDto);
    const tenantId = this.resolveTenantId(req);
    const imagemUrl = await this.resolveImagemUrl(normalizedDto.imagemUrl, imagem, 'products', tenantId, true);
    if (imagemUrl === undefined) {
      return this.productService.update(+id, normalizedDto, tenantId);
    }

    return this.productService.update(+id, { ...normalizedDto, imagemUrl }, tenantId);
  }

  private async resolveImagemUrl(
    imagemUrl: string | undefined,
    imagem: Express.Multer.File | undefined,
    entityPath?: string,
    tenantId?: number,
    isUpdate = false,
  ): Promise<string | undefined> {
    if (imagem) {
      if (!imagem.mimetype.startsWith('image/')) {
        throw new BadRequestException('Apenas arquivos de imagem sao permitidos.');
      }

      const extension = extname(imagem.originalname);
      const objectKey = `tenant/${tenantId ?? 'global'}/${entityPath ?? 'products'}/${randomUUID()}${extension}`;
      const bucket = this.storageService.getDefaultBucket();
      await this.storageService.uploadObject({
        bucket,
        key: objectKey,
        body: imagem.buffer,
        contentType: imagem.mimetype,
      });

      return `s3://${bucket}/${objectKey}`;
    }

    if (imagemUrl) {
      return imagemUrl;
    }

    if (!isUpdate) {
      throw new BadRequestException(
        'Informe imagemUrl ou envie uma imagem no campo "imagem".',
      );
    }

    return undefined;
  }

  private normalizeMultipartDto<T extends Record<string, any>>(dto: T): T {
    const payload: any = { ...dto };
    const grupoIdsFromBracket = payload['grupoIds[]'];
    const additionalIdsFromBracket = payload['additionalIds[]'];

    if (payload.grupoId !== undefined && typeof payload.grupoId === 'string') {
      payload.grupoId = Number(payload.grupoId);
    }

    if (payload.ordem !== undefined && typeof payload.ordem === 'string') {
      payload.ordem = Number(payload.ordem);
    }

    if (payload.ativo !== undefined && typeof payload.ativo === 'string') {
      payload.ativo = payload.ativo === 'true' || payload.ativo === '1';
    }

    if (payload.destaque !== undefined && typeof payload.destaque === 'string') {
      payload.destaque = payload.destaque === 'true' || payload.destaque === '1';
    }

    if (payload.grupoIds === undefined && grupoIdsFromBracket !== undefined) {
      payload.grupoIds = Array.isArray(grupoIdsFromBracket)
        ? grupoIdsFromBracket.map((value) => Number(value))
        : [Number(grupoIdsFromBracket)];
      delete payload['grupoIds[]'];
    } else if (typeof payload.grupoIds === 'string') {
      payload.grupoIds = [Number(payload.grupoIds)];
    }

    if (payload.additionalIds === undefined && additionalIdsFromBracket !== undefined) {
      payload.additionalIds = Array.isArray(additionalIdsFromBracket)
        ? additionalIdsFromBracket.map((value) => Number(value))
        : [Number(additionalIdsFromBracket)];
      delete payload['additionalIds[]'];
    } else if (typeof payload.additionalIds === 'string') {
      payload.additionalIds = [Number(payload.additionalIds)];
    }

    return payload;
  }

  private resolveTenantId(req?: ProductRequest): number;
  private resolveTenantId(req: ProductRequest | undefined, required: false): number | undefined;
  private resolveTenantId(req?: ProductRequest, required = true): number | undefined {
    const tenantId = req?.user?.tenantId ?? req?.tenant?.id;
    if (!tenantId && required) {
      throw new BadRequestException('Tenant nao resolvido para esta requisicao');
    }
    return tenantId;
  }
}
