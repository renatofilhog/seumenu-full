import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from 'src/product/entities/product.entity';
import { Additional } from './entities/additional.entity';
import { CreateAdditionalDto } from './dto/create-additional.dto';
import { UpdateAdditionalDto } from './dto/update-additional.dto';

@Injectable()
export class AdditionalService {
  constructor(
    @InjectRepository(Additional)
    private readonly additionalRepository: Repository<Additional>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createAdditionalDto: CreateAdditionalDto, tenantId: number) {
    const { productIds, ...payload } = createAdditionalDto;
    const additional = this.additionalRepository.create({ ...payload, tenantId });

    if (productIds?.length) {
      additional.products = await this.productRepository.findBy({ id: In(productIds), tenantId });
      if (additional.products.length !== productIds.length) {
        throw new BadRequestException('Produtos informados nao existem.');
      }
    }

    return this.additionalRepository.save(additional);
  }

  findAll(tenantId: number) {
    return this.additionalRepository.find({ where: { tenantId }, relations: ['products'] });
  }

  findOne(id: number, tenantId: number) {
    return this.additionalRepository.findOne({ where: { id, tenantId }, relations: ['products'] });
  }

  async update(id: number, updateAdditionalDto: UpdateAdditionalDto, tenantId: number) {
    const { productIds, ...payload } = updateAdditionalDto;
    const additional = await this.additionalRepository.findOne({
      where: { id, tenantId },
      relations: ['products'],
    });

    if (!additional) {
      return null;
    }

    Object.assign(additional, payload);

    if (productIds !== undefined) {
      additional.products = productIds.length
        ? await this.productRepository.findBy({ id: In(productIds), tenantId })
        : [];

      if (productIds.length && additional.products.length !== productIds.length) {
        throw new BadRequestException('Produtos informados nao existem.');
      }
    }

    return this.additionalRepository.save(additional);
  }
}
