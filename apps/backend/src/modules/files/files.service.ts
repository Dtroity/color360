import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { diskStorage, StorageEngine } from 'multer';
import { randomBytes } from 'crypto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadRoot: string;
  private readonly productsDir: string;

  constructor(private readonly configService: ConfigService) {
    // Единый путь для файлов: apps/backend/uploads
    this.uploadRoot = path.join(process.cwd(), 'apps', 'backend', 'uploads');
    this.productsDir = path.join(this.uploadRoot, 'products');
    this.ensureDir(this.productsDir);
  }

  /**
   * Конфигурация multer storage для загрузки изображений продуктов
   */
  getProductImagesStorage(): StorageEngine {
    return diskStorage({
      destination: (_req, _file, cb) => {
        this.ensureDir(this.productsDir);
        cb(null, this.productsDir);
      },
      filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const rand = randomBytes(6).toString('hex');
        const ext = this.getExtension(file.originalname);
        const filename = `${timestamp}-${rand}.${ext}`;
        cb(null, filename);
      },
    });
  }

  /**
   * Загрузка и обработка изображений продукта
   * @param files Массив загруженных файлов (Express.Multer.File[])
   * @param productId Идентификатор продукта (для логирования / будущего расширения)
   * @returns Массив путей созданных файлов (оригинал webp + превью)
   */
  async uploadProductImages(
    files: Express.Multer.File[],
    productId: string | number,
  ): Promise<string[]> {
    if (!files || files.length === 0) return [];

    const createdPaths: string[] = [];

    for (const file of files) {
      try {
        const originalFullPath = file.path; // путь сохраненного исходного файла (оригинальное расширение)

        // Базовое имя без расширения для webp версий
        const baseName = path.parse(originalFullPath).name; // timestamp-random

        // Путь для оригинала в webp
        const originalWebpName = `${baseName}.webp`;
        const originalWebpPath = path.join(this.productsDir, originalWebpName);

        // Генерация webp оригинала (без изменения размеров)
        await sharp(originalFullPath).toFormat('webp').toFile(originalWebpPath);
        createdPaths.push(this.toPublicPath(originalWebpPath));

        // Миниатюры
        const thumb200Name = `${baseName}-200x200.webp`;
        const thumb800Name = `${baseName}-800x800.webp`;
        const thumb200Path = path.join(this.productsDir, thumb200Name);
        const thumb800Path = path.join(this.productsDir, thumb800Name);

        // 200x200 cover
        await sharp(originalFullPath)
          .resize(200, 200, { fit: 'cover' })
          .toFormat('webp')
          .toFile(thumb200Path);
        createdPaths.push(this.toPublicPath(thumb200Path));

        // 800x800 contain (чтобы не обрезать сильно) — можно cover если требуется
        await sharp(originalFullPath)
          .resize(800, 800, { fit: 'inside' })
          .toFormat('webp')
          .toFile(thumb800Path);
        createdPaths.push(this.toPublicPath(thumb800Path));

        this.logger.log(
          `Processed image for product ${productId}: ${originalWebpName}, thumbs generated`,
        );
      } catch (err) {
        this.logger.error('Failed to process image', err as Error);
      }
    }

    return createdPaths;
  }

  /**
   * Утилита: убедиться что директория существует
   */
  private ensureDir(dir: string) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Получить расширение из оригинального имени файла
   */
  private getExtension(originalName: string): string {
    const ext = path.extname(originalName).replace('.', '').toLowerCase();
    return ext || 'dat';
  }

  /**
   * Преобразовать абсолютный путь в публичный (POSIX) /uploads/products/...
   */
  private toPublicPath(fullPath: string): string {
    const relative = path.relative(this.uploadRoot, fullPath); // products/...
    return `/uploads/${relative.replace(/\\/g, '/')}`; // нормализуем для Windows
  }
}
