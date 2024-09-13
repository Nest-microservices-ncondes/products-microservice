import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common/dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connection established');
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const totalRecords = await this.product.count({
      where: { available: true },
    });
    const lastPage = Math.ceil(totalRecords / limit);

    const products = await this.product.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: { available: true },
    });

    return {
      data: products,
      meta: {
        totalRecords,
        page,
        lastPage,
      },
    };
  }

  async findOne(id: number) {
    const product = await this.product.findUnique({
      where: { id, available: true },
    });

    if (!product) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: 'Product not found',
        timestamp: new Date().toISOString(),
      });
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...data } = updateProductDto;
    await this.findOne(id);

    const updatedProduct = await this.product.update({
      where: { id },
      data,
    });

    return updatedProduct;
  }

  async remove(id: number) {
    await this.findOne(id);

    const softDeletedProduct = await this.product.update({
      where: { id },
      data: { available: false },
    });

    return softDeletedProduct;
  }

  async validateProducts(ids: number[]) {
    const uniqueIds = [...new Set(ids)];

    const products = await this.product.findMany({
      where: { id: { in: uniqueIds } },
    });

    if (products.length !== uniqueIds.length) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Some products not found',
        timestamp: new Date().toISOString(),
      });
    }

    return products;
  }
}
