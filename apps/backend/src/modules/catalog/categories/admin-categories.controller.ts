import {
  Controller,
  Get,
  Post,
  Put,
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
import { Category } from './entities/category.entity';

function transliterateRuToSlug(input: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e',
    ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
    н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
    ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  const lower = input.toLowerCase();
  return lower
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9\-\s]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

@ApiTags('Admin Categories')
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить все категории', description: 'Возвращает все категории с иерархией' })
  async findAll() {
    return this.categoryRepo.find({
      relations: ['parent', 'children'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Создать категорию', description: 'Создаёт новую категорию' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string', nullable: true },
        parentId: { type: 'number', nullable: true },
        sortOrder: { type: 'number', default: 0 },
        isActive: { type: 'boolean', default: true },
      },
      required: ['name'],
    },
  })
  async create(@Body() dto: any) {
    if (!dto.name) {
      throw new BadRequestException('Название категории обязательно');
    }

    const slug = transliterateRuToSlug(dto.name);
    
    // Проверка уникальности slug
    const existing = await this.categoryRepo.findOne({ where: { slug } });
    if (existing) {
      throw new BadRequestException('Категория с таким названием уже существует');
    }

    const category = this.categoryRepo.create({
      name: dto.name,
      slug,
      description: dto.description || null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    if (dto.parentId) {
      const parent = await this.categoryRepo.findOne({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException(`Родительская категория с id ${dto.parentId} не найдена`);
      }
      category.parent = parent;
    }

    return this.categoryRepo.save(category);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить категорию', description: 'Обновляет информацию о категории' })
  @ApiParam({ name: 'id', type: Number })
  async update(@Param('id') id: number, @Body() dto: any) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Категория с id ${id} не найдена`);
    }

    if (dto.name && dto.name !== category.name) {
      const slug = transliterateRuToSlug(dto.name);
      const existing = await this.categoryRepo.findOne({ where: { slug } });
      if (existing && existing.id !== id) {
        throw new BadRequestException('Категория с таким названием уже существует');
      }
      category.name = dto.name;
      category.slug = slug;
    }

    if (dto.description !== undefined) category.description = dto.description || null;
    if (dto.sortOrder !== undefined) category.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;

    if (dto.parentId !== undefined) {
      if (dto.parentId === null || dto.parentId === '') {
        category.parent = null;
      } else {
        const parent = await this.categoryRepo.findOne({ where: { id: dto.parentId } });
        if (!parent) {
          throw new NotFoundException(`Родительская категория с id ${dto.parentId} не найдена`);
        }
        if (parent.id === id) {
          throw new BadRequestException('Категория не может быть родителем самой себя');
        }
        category.parent = parent;
      }
    }

    return this.categoryRepo.save(category);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Частично обновить категорию', description: 'Обновляет отдельные поля категории' })
  @ApiParam({ name: 'id', type: Number })
  async patch(@Param('id') id: number, @Body() dto: any) {
    return this.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить категорию', description: 'Удаляет категорию' })
  @ApiParam({ name: 'id', type: Number })
  async delete(@Param('id') id: number) {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['children', 'products'],
    });

    if (!category) {
      throw new NotFoundException(`Категория с id ${id} не найдена`);
    }

    if (category.children && category.children.length > 0) {
      throw new BadRequestException('Нельзя удалить категорию с дочерними категориями');
    }

    // Устанавливаем parent = null для дочерних категорий (если есть)
    await this.categoryRepo.update({ parent: { id } }, { parent: null });

    await this.categoryRepo.remove(category);
    return { message: 'Категория успешно удалена' };
  }
}

