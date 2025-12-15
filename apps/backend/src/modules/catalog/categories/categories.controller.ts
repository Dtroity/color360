import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить список категорий', description: 'Возвращает все активные категории с иерархией' })
  @ApiResponse({ status: 200, description: 'Список категорий успешно получен' })
  async findAll() {
    const categories = await this.categoryRepo.find({
      where: { isActive: true },
      relations: ['parent', 'children'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return categories;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить категорию по ID', description: 'Возвращает информацию о категории' })
  @ApiParam({ name: 'id', type: Number, description: 'ID категории' })
  @ApiResponse({ status: 200, description: 'Категория найдена' })
  @ApiResponse({ status: 404, description: 'Категория не найдена' })
  async findOne(@Param('id') id: number) {
    const category = await this.categoryRepo.findOne({
      where: { id, isActive: true },
      relations: ['parent', 'children', 'products'],
    });
    if (!category) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }
    return category;
  }
}

