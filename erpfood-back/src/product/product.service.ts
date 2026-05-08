import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { In, Repository } from 'typeorm';
import { ProductGroup } from 'src/product-group/entities/product-group.entity';
import { Additional } from 'src/additional/entities/additional.entity';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductGroup) private readonly productGroupRepository: Repository<ProductGroup>,
    @InjectRepository(Additional) private readonly additionalRepository: Repository<Additional>,
    private readonly storageService: StorageService,
  ) {}

  async create(createProductDto: CreateProductDto, tenantId: number) {
    const { grupoId, grupoIds, additionalIds, ...payload } = createProductDto;
    const resolvedGrupoIds = Array.from(new Set([...(grupoIds ?? []), ...(grupoId !== undefined ? [grupoId] : [])]));
    if (!resolvedGrupoIds.length) {
      throw new BadRequestException('Informe ao menos um grupo.');
    }

    if (payload.preco) {
      payload.preco = this.normalizePreco(payload.preco);
    }

    const groups = await this.productGroupRepository.findBy({
      id: In(resolvedGrupoIds),
      tenantId,
    });
    if (groups.length !== resolvedGrupoIds.length) {
      throw new BadRequestException('Algum grupo informado nao existe.');
    }

    const product = this.productRepository.create({ ...payload, tenantId, grupos: groups });

    if (additionalIds?.length) {
      product.additionals = await this.additionalRepository.findBy({
        id: In(additionalIds),
        tenantId,
      });
      if (product.additionals.length !== additionalIds.length) {
        throw new BadRequestException('Algum adicional informado nao existe.');
      }
    }

    const saved = await this.productRepository.save(product);
    return this.enrichProductMedia(saved);
  }

  async findAll(tenantId?: number) {
    const where = tenantId ? { tenantId } : {};
    const products = await this.productRepository.find({
      where,
      relations: ['grupos', 'additionals'],
    });
    return Promise.all(products.map((product) => this.enrichProductMedia(product)));
  }

  async findOne(id: number, tenantId?: number) {
    const where = tenantId ? { id, tenantId } : { id };
    const product = await this.productRepository.findOne({ where, relations: ['grupos', 'additionals'] });
    if (!product) {
      return null;
    }
    return this.enrichProductMedia(product);
  }

  async update(id: number, updateProductDto: UpdateProductDto, tenantId: number) {
    const { grupoId, grupoIds, additionalIds, ...payload } = updateProductDto;
    const product = await this.productRepository.findOne({
      where: { id, tenantId },
      relations: ['grupos', 'additionals'],
    });

    if (!product) {
      return null;
    }

    if (payload.preco) {
      payload.preco = this.normalizePreco(payload.preco);
    }

    Object.assign(product, payload);

    if (grupoId !== undefined || grupoIds !== undefined) {
      const resolvedGrupoIds = Array.from(
        new Set([...(grupoIds ?? []), ...(grupoId !== undefined ? [grupoId] : [])]),
      );
      if (!resolvedGrupoIds.length) {
        product.grupos = [];
      } else {
        const groups = await this.productGroupRepository.findBy({
          id: In(resolvedGrupoIds),
          tenantId,
        });
        if (groups.length !== resolvedGrupoIds.length) {
          throw new BadRequestException('Algum grupo informado nao existe.');
        }
        product.grupos = groups;
      }
    }

    if (additionalIds !== undefined) {
      product.additionals = additionalIds.length
        ? await this.additionalRepository.findBy({ id: In(additionalIds), tenantId })
        : [];
      if (additionalIds.length && product.additionals.length !== additionalIds.length) {
        throw new BadRequestException('Algum adicional informado nao existe.');
      }
    }

    const saved = await this.productRepository.save(product);
    return this.enrichProductMedia(saved);
  }

  private normalizePreco(preco: string) {
    return preco.replace(',', '.');
  }

  private async enrichProductMedia(product: Product) {
    if (!product.imagemUrl || !product.imagemUrl.startsWith('s3://')) {
      return product;
    }

    const [bucket, ...keyParts] = product.imagemUrl.replace('s3://', '').split('/');
    const objectKey = keyParts.join('/');
    if (!bucket || !objectKey) {
      return product;
    }

    const imagemUrl = this.storageService.isPublicReadEnabled()
      ? this.storageService.getPublicUrl(bucket, objectKey)
      : await this.storageService.getPresignedUrl(bucket, objectKey);

    return {
      ...product,
      imagemUrl,
    };
  }
}
