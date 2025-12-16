import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesController } from './services.controller';
import { AdminServicesController } from './admin-services.controller';
import { ServicesService } from './services.service';
import { InstallationService } from './entities/installation-service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InstallationService])],
  controllers: [ServicesController, AdminServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}

