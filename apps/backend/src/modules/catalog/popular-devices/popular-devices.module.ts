import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PopularDevicesController } from './popular-devices.controller';
import { AdminPopularDevicesController } from './admin-popular-devices.controller';
import { PopularDevice } from './entities/popular-device.entity';
import { Product } from '../products/entities/product.entity';
import { SiteSetting } from '../../settings/entities/site-setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PopularDevice, Product, SiteSetting])],
  controllers: [PopularDevicesController, AdminPopularDevicesController],
  exports: [TypeOrmModule],
})
export class PopularDevicesModule {}

