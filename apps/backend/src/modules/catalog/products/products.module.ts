import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { AdminProductsController } from './admin-products.controller';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { Manufacturer } from '../manufacturers/entities/manufacturer.entity';
import { Category } from '../categories/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductImage, Manufacturer, Category])],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}

