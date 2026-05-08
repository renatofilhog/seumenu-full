import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store } from './entities/store.entity';
import { StoreService } from './store.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { RequestTenant } from 'src/tenant/types/request-tenant.type';
import { StorageService } from 'src/storage/storage.service';
import { NoCacheInterceptor } from 'src/common/interceptors/no-cache.interceptor';

type StoreRequest = Request & {
  user?: JwtPayload;
  tenant?: RequestTenant;
};

const maxFileSize = Number(process.env.STORAGE_MAX_FILE_SIZE_MB ?? '10') * 1024 * 1024;

@ApiTags('store')
@ApiBearerAuth()
@Controller(['store', 'stores'])
@UseInterceptors(NoCacheInterceptor)
export class StoreController {
  constructor(
    private readonly storeService: StoreService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'banner', maxCount: 1 },
        { name: 'logo', maxCount: 1 },
      ],
      { storage: memoryStorage(), limits: { fileSize: maxFileSize } },
    ),
  )
  @Permissions('store.create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nome: { type: 'string' },
        cnpj: { type: 'string' },
        resumo: { type: 'string' },
        bannerUrl: { type: 'string' },
        logoUrl: { type: 'string' },
        banner: { type: 'string', format: 'binary' },
        logo: { type: 'string', format: 'binary' },
        horarioFuncionamento: { type: 'string' },
        localizacao: { type: 'string' },
        corFundo: { type: 'string' },
        habilitaVerificacaoMesa: { type: 'boolean' },
      },
    },
  })
  @ApiOkResponse({ type: Store })
  async create(
    @Body() createStoreDto: CreateStoreDto,
    @UploadedFiles()
    files?: {
      banner?: Express.Multer.File[];
      logo?: Express.Multer.File[];
    },
    @Req() req?: StoreRequest,
  ) {
    const tenantId = this.resolveTenantId(req);
    const bannerUrl = await this.resolveImageUrl(
      createStoreDto.bannerUrl,
      files?.banner?.[0],
      'banner',
      tenantId,
    );
    const logoUrl = await this.resolveImageUrl(
      createStoreDto.logoUrl,
      files?.logo?.[0],
      'logo',
      tenantId,
    );

    return this.storeService.create({
      ...createStoreDto,
      bannerUrl,
      logoUrl,
    }, tenantId);
  }

  @Get()
  @ApiOkResponse({ type: Store, isArray: true })
  findAll(@Req() req?: StoreRequest) {
    const tenantId = req?.user?.tenantId ?? req?.tenant?.id;
    return this.storeService.findAll(tenantId);
  }

  @Get('media/:kind')
  async getMedia(
    @Param('kind') kind: string,
    @Req() req: StoreRequest,
    @Res() res: any,
  ) {
    if (kind !== 'banner' && kind !== 'logo') {
      throw new NotFoundException('Midia da loja nao encontrada');
    }

    const tenantId = req?.user?.tenantId ?? req?.tenant?.id;
    const object = await this.storeService.getMediaStream(kind, tenantId);
    if (!object) {
      throw new NotFoundException('Midia da loja nao encontrada');
    }

    if (object.contentType) {
      res.setHeader('Content-Type', object.contentType);
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    object.stream.pipe(res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('store.read')
  @ApiOkResponse({ type: Store })
  findMe(@Req() req?: StoreRequest) {
    return this.storeService.findMe(this.resolveTenantId(req));
  }

  @Put('me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'banner', maxCount: 1 },
        { name: 'logo', maxCount: 1 },
      ],
      { storage: memoryStorage(), limits: { fileSize: maxFileSize } },
    ),
  )
  @Permissions('store.update')
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nome: { type: 'string' },
        cnpj: { type: 'string' },
        resumo: { type: 'string' },
        bannerUrl: { type: 'string' },
        logoUrl: { type: 'string' },
        banner: { type: 'string', format: 'binary' },
        logo: { type: 'string', format: 'binary' },
        horarioFuncionamento: { type: 'string' },
        localizacao: { type: 'string' },
        corFundo: { type: 'string' },
        habilitaVerificacaoMesa: { type: 'boolean' },
      },
    },
  })
  @ApiOkResponse({ type: Store })
  async upsertMe(
    @Body() payload: CreateStoreDto,
    @UploadedFiles()
    files?: {
      banner?: Express.Multer.File[];
      logo?: Express.Multer.File[];
    },
    @Req() req?: StoreRequest,
  ) {
    const tenantId = this.resolveTenantId(req);
    const current = await this.storeService.findMe(tenantId);

    const bannerUrl = await this.resolveImageUrl(
      payload.bannerUrl,
      files?.banner?.[0],
      'banner',
      tenantId,
      Boolean(current),
    );
    const logoUrl = await this.resolveImageUrl(
      payload.logoUrl,
      files?.logo?.[0],
      'logo',
      tenantId,
      Boolean(current),
    );

    return this.storeService.upsertMe(
      {
        ...payload,
        bannerUrl: bannerUrl ?? current?.bannerUrl,
        logoUrl: logoUrl ?? current?.logoUrl,
      },
      tenantId,
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: Store })
  findOne(@Param('id') id: string, @Req() req?: StoreRequest) {
    const tenantId = req?.user?.tenantId ?? req?.tenant?.id;
    return this.storeService.findOne(+id, tenantId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'banner', maxCount: 1 },
        { name: 'logo', maxCount: 1 },
      ],
      { storage: memoryStorage(), limits: { fileSize: maxFileSize } },
    ),
  )
  @Permissions('store.update')
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nome: { type: 'string' },
        cnpj: { type: 'string' },
        resumo: { type: 'string' },
        bannerUrl: { type: 'string' },
        logoUrl: { type: 'string' },
        banner: { type: 'string', format: 'binary' },
        logo: { type: 'string', format: 'binary' },
        horarioFuncionamento: { type: 'string' },
        localizacao: { type: 'string' },
        corFundo: { type: 'string' },
        habilitaVerificacaoMesa: { type: 'boolean' },
      },
    },
  })
  @ApiOkResponse({ type: Store })
  async update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
    @UploadedFiles()
    files?: {
      banner?: Express.Multer.File[];
      logo?: Express.Multer.File[];
    },
    @Req() req?: StoreRequest,
  ) {
    const tenantId = this.resolveTenantId(req);
    const bannerUrl = await this.resolveImageUrl(
      updateStoreDto.bannerUrl,
      files?.banner?.[0],
      'banner',
      tenantId,
      true,
    );
    const logoUrl = await this.resolveImageUrl(
      updateStoreDto.logoUrl,
      files?.logo?.[0],
      'logo',
      tenantId,
      true,
    );

    const payload = { ...updateStoreDto };
    if (bannerUrl !== undefined) {
      payload.bannerUrl = bannerUrl;
    }
    if (logoUrl !== undefined) {
      payload.logoUrl = logoUrl;
    }

    return this.storeService.update(+id, payload, tenantId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('store.delete')
  remove(@Param('id') id: string, @Req() req?: StoreRequest) {
    return this.storeService.remove(+id, this.resolveTenantId(req));
  }

  private resolveTenantId(req?: StoreRequest) {
    const tenantId = req?.user?.tenantId ?? req?.tenant?.id;
    if (!tenantId) {
      throw new BadRequestException('Tenant nao resolvido para esta requisicao');
    }
    return tenantId;
  }

  private async resolveImageUrl(
    url: string | undefined,
    file: Express.Multer.File | undefined,
    label: string,
    tenantId?: number,
    isUpdate = false,
  ): Promise<string | undefined> {
    if (file) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('Apenas arquivos de imagem sao permitidos.');
      }

      const extension = extname(file.originalname);
      const objectKey = `tenant/${tenantId ?? 'global'}/stores/${label}/${randomUUID()}${extension}`;
      const bucket = this.storageService.getDefaultBucket();
      await this.storageService.uploadObject({
        bucket,
        key: objectKey,
        body: file.buffer,
        contentType: file.mimetype,
      });

      return `s3://${bucket}/${objectKey}`;
    }

    if (url) {
      return url;
    }

    if (!isUpdate) {
      throw new BadRequestException(
        `Informe ${label}Url ou envie uma imagem no campo "${label}".`,
      );
    }

    return undefined;
  }
}
