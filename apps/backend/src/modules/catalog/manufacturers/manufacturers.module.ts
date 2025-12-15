import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManufacturersController } from './manufacturers.controller';
import { Manufacturer } from './entities/manufacturer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Manufacturer])],
  controllers: [ManufacturersController],
  exports: [TypeOrmModule],
})
export class ManufacturersModule {}

