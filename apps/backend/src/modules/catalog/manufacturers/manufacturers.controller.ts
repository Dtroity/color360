import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Manufacturer } from './entities/manufacturer.entity';

@ApiTags('Manufacturers')
@Controller('manufacturers')
export class ManufacturersController {
  constructor(
    @InjectRepository(Manufacturer)
    private readonly manufacturerRepo: Repository<Manufacturer>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить список производителей', description: 'Возвращает все активные производители' })
  @ApiResponse({ status: 200, description: 'Список производителей успешно получен' })
  async findAll() {
    const manufacturers = await this.manufacturerRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    return manufacturers;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить производителя по ID', description: 'Возвращает информацию о производителе' })
  @ApiParam({ name: 'id', type: Number, description: 'ID производителя' })
  @ApiResponse({ status: 200, description: 'Производитель найден' })
  @ApiResponse({ status: 404, description: 'Производитель не найден' })
  async findOne(@Param('id') id: number) {
    const manufacturer = await this.manufacturerRepo.findOne({
      where: { id, isActive: true },
      relations: ['products'],
    });
    if (!manufacturer) {
      throw new NotFoundException(`Manufacturer with id "${id}" not found`);
    }
    return manufacturer;
  }
}

