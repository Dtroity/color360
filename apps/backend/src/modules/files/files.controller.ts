import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { memoryStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Загрузить файл', description: 'Загружает файл и возвращает URL' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }

    // Проверка типа файла (только изображения)
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Разрешена загрузка только изображений');
    }

    // Создаем папку для общих загрузок
    const uploadDir = path.join(process.cwd(), 'apps', 'backend', 'uploads', 'general');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}-${randomStr}.webp`;
    const filePath = path.join(uploadDir, filename);

    // Конвертируем в webp
    try {
      await sharp(file.buffer)
        .toFormat('webp')
        .toFile(filePath);

      const url = `/uploads/general/${filename}`;
      return {
        url,
        path: url,
        filename,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      throw new BadRequestException('Ошибка обработки изображения: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  }
}

