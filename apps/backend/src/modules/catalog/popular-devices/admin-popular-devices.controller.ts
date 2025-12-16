import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PopularDevice } from './entities/popular-device.entity';
import { Product } from '../products/entities/product.entity';

@ApiTags('Admin Popular Devices')
@Controller('admin/popular-devices')
export class AdminPopularDevicesController {
  constructor(
    @InjectRepository(PopularDevice)
    private readonly popularDeviceRepo: Repository<PopularDevice>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить все популярные устройства', description: 'Возвращает все популярные устройства' })
  async findAll() {
    return this.popularDeviceRepo.find({
      relations: ['product'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Создать популярное устройство', description: 'Создаёт новое популярное устройство' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        productId: { type: 'number', nullable: true },
        image: { type: 'string', nullable: true },
        sortOrder: { type: 'number', default: 0 },
        isActive: { type: 'boolean', default: true },
      },
      required: ['name'],
    },
  })
  async create(@Body() dto: any) {
    if (!dto.name) {
      throw new BadRequestException('Название устройства обязательно');
    }

    const device = this.popularDeviceRepo.create({
      name: dto.name,
      productId: dto.productId || null,
      image: dto.image || null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    if (dto.productId) {
      const product = await this.productRepo.findOne({ where: { id: dto.productId } });
      if (!product) {
        throw new NotFoundException(`Товар с id ${dto.productId} не найден`);
      }
      device.product = product;
    }

    return this.popularDeviceRepo.save(device);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить популярное устройство', description: 'Обновляет информацию о популярном устройстве' })
  @ApiParam({ name: 'id', type: Number })
  async update(@Param('id') id: number, @Body() dto: any) {
    const device = await this.popularDeviceRepo.findOne({ where: { id }, relations: ['product'] });
    if (!device) {
      throw new NotFoundException(`Популярное устройство с id ${id} не найдено`);
    }

    if (dto.name !== undefined) device.name = dto.name;
    if (dto.image !== undefined) device.image = dto.image || null;
    if (dto.sortOrder !== undefined) device.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) device.isActive = dto.isActive;

    if (dto.productId !== undefined) {
      if (dto.productId === null || dto.productId === '') {
        device.product = null;
        device.productId = null;
      } else {
        const product = await this.productRepo.findOne({ where: { id: dto.productId } });
        if (!product) {
          throw new NotFoundException(`Товар с id ${dto.productId} не найден`);
        }
        device.product = product;
        device.productId = dto.productId;
      }
    }

    return this.popularDeviceRepo.save(device);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить популярное устройство', description: 'Удаляет популярное устройство' })
  @ApiParam({ name: 'id', type: Number })
  async delete(@Param('id') id: number) {
    const device = await this.popularDeviceRepo.findOne({ where: { id } });
    if (!device) {
      throw new NotFoundException(`Популярное устройство с id ${id} не найдено`);
    }

    await this.popularDeviceRepo.remove(device);
    return { message: 'Популярное устройство успешно удалено' };
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Обновить порядок устройств', description: 'Обновляет порядок сортировки для списка устройств (для drag&drop)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              sortOrder: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async reorder(@Body() dto: { items: Array<{ id: number; sortOrder: number }> }) {
    if (!dto.items || !Array.isArray(dto.items)) {
      throw new BadRequestException('Неверный формат данных');
    }

    // Обновляем порядок для каждого устройства
    const updates = dto.items.map(item => 
      this.popularDeviceRepo.update(item.id, { sortOrder: item.sortOrder })
    );

    await Promise.all(updates);
    return { message: 'Порядок успешно обновлен' };
  }
}

