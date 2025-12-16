import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstallationService, PriceType } from './entities/installation-service.entity';

@ApiTags('Admin Services')
@Controller('admin/services')
export class AdminServicesController {
  constructor(
    @InjectRepository(InstallationService)
    private readonly serviceRepo: Repository<InstallationService>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить все услуги' })
  async findAll() {
    return this.serviceRepo.find({
      order: { sortOrder: 'ASC', title: 'ASC' },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Создать услугу' })
  async create(@Body() dto: any) {
    if (!dto.title || dto.title.trim().length === 0) {
      throw new BadRequestException('Название услуги обязательно');
    }

    if (!dto.basePrice || dto.basePrice <= 0) {
      throw new BadRequestException('Цена должна быть больше 0');
    }

    if (!dto.priceType || !Object.values(PriceType).includes(dto.priceType)) {
      throw new BadRequestException('Тип цены обязателен и должен быть fixed или per_unit');
    }

    const service = this.serviceRepo.create({
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      basePrice: Number(dto.basePrice),
      priceType: dto.priceType as PriceType,
      unitName: dto.unitName?.trim() || null,
      minQuantity: dto.minQuantity ? Number(dto.minQuantity) : 1,
      isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
      sortOrder: dto.sortOrder ? Number(dto.sortOrder) : 0,
    });

    return this.serviceRepo.save(service);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить услугу' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    const service = await this.serviceRepo.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Услуга с id ${id} не найдена`);
    }

    if (dto.title !== undefined) {
      if (!dto.title || dto.title.trim().length === 0) {
        throw new BadRequestException('Название услуги не может быть пустым');
      }
      service.title = dto.title.trim();
    }

    if (dto.description !== undefined) {
      service.description = dto.description?.trim() || null;
    }

    if (dto.basePrice !== undefined) {
      if (dto.basePrice <= 0) {
        throw new BadRequestException('Цена должна быть больше 0');
      }
      service.basePrice = Number(dto.basePrice);
    }

    if (dto.priceType !== undefined) {
      if (!Object.values(PriceType).includes(dto.priceType)) {
        throw new BadRequestException('Тип цены должен быть fixed или per_unit');
      }
      service.priceType = dto.priceType as PriceType;
    }

    if (dto.unitName !== undefined) {
      service.unitName = dto.unitName?.trim() || null;
    }

    if (dto.minQuantity !== undefined) {
      service.minQuantity = dto.minQuantity ? Number(dto.minQuantity) : 1;
    }

    if (dto.isActive !== undefined) {
      service.isActive = Boolean(dto.isActive);
    }

    if (dto.sortOrder !== undefined) {
      service.sortOrder = Number(dto.sortOrder);
    }

    return this.serviceRepo.save(service);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить услугу' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    const service = await this.serviceRepo.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Услуга с id ${id} не найдена`);
    }

    await this.serviceRepo.remove(service);
    return { message: 'Услуга успешно удалена' };
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Обновить порядок услуг', description: 'Обновляет порядок сортировки для списка услуг (для drag&drop)' })
  async reorder(@Body() dto: { items: Array<{ id: number; sortOrder: number }> }) {
    if (!dto.items || !Array.isArray(dto.items)) {
      throw new BadRequestException('Неверный формат данных');
    }

    // Обновляем порядок для каждой услуги
    const updates = dto.items.map(item => 
      this.serviceRepo.update(item.id, { sortOrder: item.sortOrder })
    );

    await Promise.all(updates);
    return { message: 'Порядок успешно обновлен' };
  }
}

