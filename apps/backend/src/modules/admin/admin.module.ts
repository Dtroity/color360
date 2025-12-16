import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminProfileController } from './admin-profile.controller';
import { UsersModule } from '../users/users.module';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../catalog/products/entities/product.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Product, User]),
    UsersModule,
  ],
  controllers: [AdminController, AdminProfileController],
})
export class AdminModule {}

