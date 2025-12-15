import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Param,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { ProductsService } from './products.service';
import { ImportCsvDto, CsvRow } from './dto/import-csv.dto';

@ApiTags('Admin Products')
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('import/csv')
  @ApiOperation({ summary: 'Импорт товаров из CSV', description: 'Импортирует товары из CSV файла' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        mode: {
          type: 'string',
          enum: ['create', 'update', 'upsert'],
          default: 'upsert',
        },
        skipDuplicates: {
          type: 'boolean',
          default: false,
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportCsvDto,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }

    if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('Файл должен быть в формате CSV');
    }

    // Простой парсинг CSV (можно заменить на papaparse)
    const text = file.buffer.toString('utf-8');
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    
    if (lines.length < 2) {
      throw new BadRequestException('CSV файл должен содержать заголовки и хотя бы одну строку данных');
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows: CsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Простой парсинг CSV с учётом кавычек
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') {
            current += '"';
            j++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row: any = {};
      headers.forEach((header, index) => {
        const value = values[index]?.replace(/^"|"$/g, '') || '';
        row[header] = value;
      });

      // Преобразование типов
      if (row.price) row.price = Number(row.price);
      if (row.stock) row.stock = Number(row.stock);
      if (row.oldPrice) row.oldPrice = Number(row.oldPrice);
      if (row.isActive !== undefined) {
        row.isActive = row.isActive === 'true' || row.isActive === '1' || row.isActive === true;
      }

      rows.push(row as CsvRow);
    }

    const result = await this.productsService.importFromCsv(
      rows,
      dto.mode || 'upsert',
      dto.skipDuplicates || false,
    );

    return result;
  }

  @Get('import/template')
  @ApiOperation({ summary: 'Скачать шаблон CSV', description: 'Возвращает шаблон CSV файла для импорта' })
  @ApiResponse({ status: 200, description: 'Шаблон CSV файла' })
  async getTemplate(@Res() res: Response) {
    const template = `name,sku,price,stock,category,brand,description,image_url,shortDescription,oldPrice,currency,isActive
"Камера видеонаблюдения HiWatch DS-I250L","CAM001",15990,10,"Камеры","HiWatch","Полноценная камера видеонаблюдения с высоким разрешением","https://example.com/image.jpg","Краткое описание",19990,"RUB",true
"Камера видеонаблюдения HiWatch DS-I250M","CAM002",17990,5,"Камеры","HiWatch","Камера с улучшенными характеристиками","https://example.com/image2.jpg","Краткое описание 2",21990,"RUB",true`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="products-template.csv"');
    res.send(template);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Экспорт товаров в CSV', description: 'Экспортирует товары в CSV файл' })
  @ApiResponse({ status: 200, description: 'CSV файл с товарами' })
  async exportCsv(@Query('ids') ids?: string, @Res() res?: Response) {
    const productIds = ids ? ids.split(',').map((id) => Number(id)).filter((id) => !isNaN(id)) : undefined;
    const csv = await this.productsService.exportToCsv(productIds);

    if (res) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="products-export-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      return csv;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить товар по id (admin)' })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить товар (admin)' })
  async updateOne(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.productsService.update(id, dto);
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Загрузить изображения товара (admin)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: memoryStorage(),
    }),
  )
  async uploadImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Файлы не загружены');
    }
    return this.productsService.addImages(id, files);
  }
}

