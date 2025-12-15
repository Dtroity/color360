import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PopularDevice } from './entities/popular-device.entity';

@ApiTags('Popular Devices')
@Controller('popular-devices')
export class PopularDevicesController {
  constructor(
    @InjectRepository(PopularDevice)
    private readonly popularDeviceRepo: Repository<PopularDevice>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить список популярных устройств', description: 'Возвращает все активные популярные устройства' })
  @ApiResponse({ status: 200, description: 'Список популярных устройств успешно получен' })
  async findAll() {
    const devices = await this.popularDeviceRepo.find({
      where: { isActive: true },
      relations: ['product'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return devices;
  }
}

