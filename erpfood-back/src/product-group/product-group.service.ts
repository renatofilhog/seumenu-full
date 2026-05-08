import { Injectable } from '@nestjs/common';
import { CreateProductGroupDto } from './dto/create-product-group.dto';
import { UpdateProductGroupDto } from './dto/update-product-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductGroup } from './entities/product-group.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductGroupService {
  constructor(
    @InjectRepository(ProductGroup)
    private readonly productGroupRepository: Repository<ProductGroup>,
  ) {}

  create(createProductGroupDto: CreateProductGroupDto, tenantId: number) {
    return this.productGroupRepository.save({ ...createProductGroupDto, tenantId });
  }

  findAll(tenantId: number) {
    return this.productGroupRepository.find({ where: { tenantId } });
  }

  findOne(id: number, tenantId: number) {
    return this.productGroupRepository.findOneBy({ id, tenantId });
  }

  update(id: number, updateProductGroupDto: UpdateProductGroupDto, tenantId: number) {
    return this.productGroupRepository.update({ id, tenantId }, updateProductGroupDto);
  }

  remove(id: number, tenantId: number) {
    return this.productGroupRepository.delete({ id, tenantId });
  }
}
