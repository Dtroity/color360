import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { Manufacturer } from '../manufacturers/entities/manufacturer.entity';
import { Category } from '../categories/entities/category.entity';
import { CsvRow, ImportResult, ImportDetail } from './dto/import-csv.dto';
import { UpdateProductDto } from './dto/update-product.dto';

function transliterateRuToSlug(input: string): string {
  const map: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'c',
    ч: 'ch',
    ш: 'sh',
    щ: 'sch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
  };
  const lower = input.toLowerCase();
  const out = lower
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9\-\s]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return out;
}

export enum ProductSort {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  POPULAR = 'popular',
  NEW = 'new',
}

export interface ProductFilterDto {
  manufacturers?: number[];
  categories?: number[];
  priceFrom?: number;
  priceTo?: number;
  inStock?: boolean;
  search?: string;
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imagesRepo: Repository<ProductImage>,
    @InjectRepository(Manufacturer)
    private readonly manufacturerRepo: Repository<Manufacturer>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  private getProductUploadDir(productId: string | number) {
    return path.join(
      process.cwd(),
      'apps',
      'backend',
      'uploads',
      'products',
      String(productId),
    );
  }

  // Guard: AdminGuard should be applied at controller level
  async create(
    createProductDto: any,
    files?: Express.Multer.File[],
  ): Promise<Product> {
    const slugBase =
      (createProductDto.seo?.slug as string) ||
      (createProductDto.name as string) ||
      '';
    const slug = transliterateRuToSlug(slugBase);

    const product = this.productRepo.create({
      ...createProductDto,
      slug,
    });
    const saved = await this.productRepo.save(product);
    // Ensure saved is single Product (not array)
    const savedProduct = Array.isArray(saved) ? saved[0] : saved;

    // обработка файлов
    if (files && files.length > 0) {
      const uploadDir = this.getProductUploadDir(savedProduct.id);
      fs.mkdirSync(uploadDir, { recursive: true });

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const filename = `${Date.now()}_${i}.webp`;
        const filePath = path.join(uploadDir, filename);

        await sharp(f.buffer).toFormat('webp').toFile(filePath);

        const thumbName = `${Date.now()}_${i}_thumb.webp`;
        const thumbPath = path.join(uploadDir, thumbName);
        await sharp(f.buffer)
          .resize(400, 400, { fit: 'inside' })
          .toFormat('webp')
          .toFile(thumbPath);

        const img = this.imagesRepo.create({
          product: savedProduct,
          url: `/uploads/products/${savedProduct.id}/${filename}`,
          alt: '',
          sortOrder: i,
        });
        await this.imagesRepo.save(img);
      }
    }

    const withImages = await this.productRepo.findOne({
      where: { id: savedProduct.id },
      relations: ['images'],
    });
    return withImages || savedProduct;
  }

  async findAll(filterDto: ProductFilterDto) {
    const {
      manufacturers,
      categories,
      priceFrom,
      priceTo,
      inStock,
      search,
      sort,
      page,
      limit,
    } = filterDto;

    // Безопасные значения пагинации
    // По умолчанию возвращаем все товары (очень большой лимит)
    // Если limit не указан, возвращаем все товары
    const safeLimit = limit ? Math.max(1, Math.min(limit, 10000)) : 10000;
    const safePage = Math.max(1, page ?? 1);

    // Определяем, нужен ли GROUP BY (для сортировки POPULAR)
    // При GROUP BY нельзя использовать leftJoinAndSelect для images, так как это вызывает SQL ошибку
    const needsGroupBy = sort === ProductSort.POPULAR;

    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.manufacturer', 'manufacturer')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isActive = :isActive', { isActive: true });
    
    // Добавляем images только если не нужен GROUP BY
    // При GROUP BY загрузим images отдельно после получения продуктов
    if (!needsGroupBy) {
      qb.leftJoinAndSelect('product.images', 'images');
    }

    // Filters
    if (manufacturers && manufacturers.length) {
      qb.andWhere('manufacturer.id IN (:...manufacturerIds)', {
        manufacturerIds: manufacturers,
      });
    }

    if (categories && categories.length) {
      qb.andWhere('category.id IN (:...categoryIds)', {
        categoryIds: categories,
      });
    }

    if (typeof priceFrom === 'number') {
      qb.andWhere('product.price >= :priceFrom', { priceFrom });
    }

    if (typeof priceTo === 'number') {
      qb.andWhere('product.price <= :priceTo', { priceTo });
    }

    if (typeof inStock === 'boolean') {
      if (inStock) qb.andWhere('product.stock > 0');
      else qb.andWhere('product.stock = 0');
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      // Postgres ILIKE for case-insensitive search
      qb.andWhere(
        '(LOWER(product.name) LIKE :term OR LOWER(product.sku) LIKE :term)',
        { term },
      );
    }

    // Sorting
    // Всегда сначала сортируем по категории (sortOrder), чтобы товары группировались по категориям
    // Это соответствует поведению сайта-донора hiwatch.net
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products.service.ts:221',message:'Sorting products',data:{sort,hasCategories:!!categories,categoriesCount:categories?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Сортировка по категориям
    // Используем addSelect с COALESCE для обработки NULL значений - товары без категории пойдут в конец
    // TypeORM требует сначала добавить поле через addSelect, затем сортировать по нему
    qb.addSelect('COALESCE(category.sortOrder, 9999)', 'category_sort_order');
    
    switch (sort) {
      case ProductSort.PRICE_ASC:
        // Сначала по категории (sortOrder), потом по цене
        qb.orderBy('category_sort_order', 'ASC')
          .addOrderBy('product.price', 'ASC');
        break;
      case ProductSort.PRICE_DESC:
        // Сначала по категории (sortOrder), потом по цене
        qb.orderBy('category_sort_order', 'ASC')
          .addOrderBy('product.price', 'DESC');
        break;
      case ProductSort.NEW:
        // Сначала по категории (sortOrder), потом по дате создания
        qb.orderBy('category_sort_order', 'ASC')
          .addOrderBy('product.createdAt', 'DESC');
        break;
      case ProductSort.POPULAR:
        // Popular by number of order items, но сначала по категории
        // ВАЖНО: При использовании GROUP BY нужно либо убрать images из SELECT, либо добавить images.id в GROUP BY
        // Но images - это массив, поэтому лучше использовать подзапрос или убрать leftJoinAndSelect для images в этом случае
        // Временно убираем images из запроса при сортировке POPULAR, загрузим их отдельно
        qb.leftJoin('product.orderItems', 'orderItem')
          .addSelect('COUNT(orderItem.id)', 'order_count')
          .groupBy('product.id')
          .addGroupBy('manufacturer.id')
          .addGroupBy('category.id')
          .addGroupBy('category.sortOrder')
          .orderBy('category_sort_order', 'ASC')
          .addOrderBy('order_count', 'DESC');
        // Убираем images из SELECT при GROUP BY, загрузим их отдельно после получения продуктов
        // Это временное решение - лучше использовать подзапрос или window functions
        break;
      default:
        // Дефолтная сортировка: сначала по категории (sortOrder), потом по дате создания
        qb.orderBy('category_sort_order', 'ASC')
          .addOrderBy('product.createdAt', 'DESC');
        break;
    }

    // Pagination
    const offset = (safePage - 1) * safeLimit;
    qb.skip(offset).take(safeLimit);

    console.log('[ProductsService] Query params:', {
      limit: safeLimit,
      page: safePage,
      offset,
      filters: {
        manufacturers: manufacturers?.length || 0,
        categories: categories?.length || 0,
        priceFrom,
        priceTo,
        inStock,
        search,
        sort,
      },
    });

    let data: Product[];
    let total: number;
    
    try {
      // #region agent log
      const sql = qb.getSql();
      fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products.service.ts:284',message:'Executing query',data:{sql:sql.substring(0,200),needsGroupBy},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      [data, total] = await qb.getManyAndCount();
      
      // Если использовали GROUP BY, нужно загрузить images отдельно
      if (needsGroupBy && data.length > 0) {
        const productIds = data.map(p => p.id);
        const productsWithImages = await this.productRepo.find({
          where: { id: In(productIds) },
          relations: ['images'],
        });
        // Создаем мапу для быстрого поиска
        const imagesMap = new Map(productsWithImages.map(p => [p.id, p.images || []]));
        // Добавляем images к каждому продукту
        data = data.map(product => ({
          ...product,
          images: imagesMap.get(product.id) || [],
        }));
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products.service.ts:290',message:'Query executed successfully',data:{returned:data.length,total,firstProductId:data[0]?.id,firstProductName:data[0]?.name,hasImages:!!data[0]?.images?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products.service.ts:293',message:'Query error',data:{error:error.message,stack:error.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('[ProductsService] Query error:', error);
      throw error;
    }
    
    console.log('[ProductsService] Query result:', {
      returned: data.length,
      total,
      page: safePage,
      limit: safeLimit,
    });

    // Установить primaryImage для каждого товара
    // Сортируем изображения по sortOrder для получения главного (первого)
    const products = data.map((product) => {
      const sortedImages = product.images?.sort((a, b) => a.sortOrder - b.sortOrder) || [];
      return {
        ...product,
        primaryImage: sortedImages[0]?.url || null,
      };
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products.service.ts:305',message:'Products query result',data:{total,returned:products.length,firstProductCategory:products[0]?.category?.name,firstProductCategorySortOrder:products[0]?.category?.sortOrder,productIds:products.slice(0,5).map(p=>p.id),imageUrls:products.slice(0,3).map(p=>p.primaryImage)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    return {
      data: products,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
    };
  }

  async findById(id: number): Promise<Product & { primaryImage: string | null }> {
    console.log('ProductsService.findById:', id);
    const product = await this.productRepo.findOne({
      where: { id, isActive: true },
      relations: ['manufacturer', 'category', 'images'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    // Сортируем изображения по sortOrder для получения главного (первого)
    const sortedImages = product.images?.sort((a, b) => a.sortOrder - b.sortOrder) || [];

    return {
      ...product,
      primaryImage: sortedImages[0]?.url || null,
    } as Product & { primaryImage: string | null };
  }

  async findBySlug(slug: string): Promise<Product & { primaryImage: string | null }> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products.service.ts:313',message:'findBySlug called',data:{slug},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.log('ProductsService.findBySlug:', slug);
    const product = await this.productRepo.findOne({
      where: { slug, isActive: true },
      relations: ['manufacturer', 'category', 'images'],
    });

    if (!product) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products.service.ts:320',message:'Product not found',data:{slug},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    // Сортируем изображения по sortOrder для получения главного (первого)
    const sortedImages = product.images?.sort((a, b) => a.sortOrder - b.sortOrder) || [];
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products.service.ts:327',message:'Product found',data:{id:product.id,name:product.name,hasDescription:!!product.description,hasAttributes:!!product.attributes,imagesCount:sortedImages.length,imageUrls:sortedImages.map(img=>img.url)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    return {
      ...product,
      primaryImage: sortedImages[0]?.url || null,
    } as Product & { primaryImage: string | null };
  }

  async addImages(
    productId: number,
    files: Express.Multer.File[],
  ): Promise<ProductImage[]> {
    if (!files || files.length === 0) return [];

    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const uploadDir = this.getProductUploadDir(productId);
    fs.mkdirSync(uploadDir, { recursive: true });

    const existing = await this.imagesRepo.find({
      where: { product: { id: productId } },
      order: { sortOrder: 'ASC' },
    });
    const startIndex =
      existing.length > 0
        ? Math.max(...existing.map((img) => img.sortOrder ?? 0)) + 1
        : 0;

    const created: ProductImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const sortOrder = startIndex + i;
      const filename = `${sortOrder}.webp`;
      const filePath = path.join(uploadDir, filename);

      await sharp(f.buffer).toFormat('webp').toFile(filePath);

      const img = this.imagesRepo.create({
        product,
        url: `/uploads/products/${productId}/${filename}`,
        alt: product.name || '',
        sortOrder,
      });
      created.push(await this.imagesRepo.save(img));
    }

    return created;
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    // 1. Найти продукт с связями
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['category', 'manufacturer', 'images'],
    });

    // 2. Проверка существования
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // 3. Обновление категории
    if (dto.categoryId !== undefined) {
      if (dto.categoryId === null) {
        product.category = null;
      } else {
        const category = await this.categoryRepo.findOne({
          where: { id: dto.categoryId },
        });
        if (!category) {
          throw new BadRequestException(
            `Category with ID ${dto.categoryId} not found`,
          );
        }
        product.category = category;
      }
    }

    // 4. Обновление производителя
    if (dto.manufacturerId !== undefined) {
      if (dto.manufacturerId === null) {
        product.manufacturer = null;
      } else {
        const manufacturer = await this.manufacturerRepo.findOne({
          where: { id: dto.manufacturerId },
        });
        if (!manufacturer) {
          throw new BadRequestException(
            `Manufacturer with ID ${dto.manufacturerId} not found`,
          );
        }
        product.manufacturer = manufacturer;
      }
    }

    // 5. Обновление изображений (если переданы)
    if (dto.images !== undefined) {
      // Удалить старые изображения
      if (product.images && product.images.length > 0) {
        await this.imagesRepo.remove(product.images);
      }

      // Создать новые изображения из ImageDto[]
      if (dto.images.length > 0) {
        const newImages = dto.images.map((img, index) =>
          this.imagesRepo.create({
            url: img.url || '',
            alt: img.alt || product.name || '',
            sortOrder: img.sortOrder ?? index,
            product: product,
          }),
        );

        product.images = await this.imagesRepo.save(newImages);
      } else {
        // Если передан пустой массив - удалить все изображения
        product.images = [];
      }
    }

    // 6. Построить Partial<Product> из DTO для обновления остальных полей
    const updateData: Partial<Product> = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.slug !== undefined) updateData.slug = dto.slug;
    if (dto.sku !== undefined) updateData.sku = dto.sku;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.shortDescription !== undefined) updateData.shortDescription = dto.shortDescription;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.oldPrice !== undefined) updateData.oldPrice = dto.oldPrice;
    if (dto.stock !== undefined) updateData.stock = dto.stock;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.availability !== undefined) updateData.availability = dto.availability;
    if (dto.currency !== undefined) updateData.currency = dto.currency;

    // 7. Применить обновления к продукту
    Object.assign(product, updateData);

    // 8. Сохранение
    return await this.productRepo.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['images'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Удаление изображений (каскадное удаление должно сработать, но на всякий случай)
    if (product.images && product.images.length > 0) {
      await this.imagesRepo.remove(product.images);
    }

    await this.productRepo.remove(product);
  }

  async importFromCsv(
    rows: CsvRow[],
    mode: 'create' | 'update' | 'upsert' = 'upsert',
    skipDuplicates: boolean = false,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      errors: 0,
      skipped: 0,
      details: [],
    };

    // Получаем все существующие SKU для проверки
    const existingSkus = await this.productRepo.find({
      select: ['sku'],
    });
    const existingSkuSet = new Set(existingSkus.map((p) => p.sku));

    // Получаем все категории и производители для маппинга
    const categories = await this.categoryRepo.find();
    const manufacturers = await this.manufacturerRepo.find();
    const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c]));
    const manufacturerMap = new Map(manufacturers.map((m) => [m.name.toLowerCase(), m]));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const detail: ImportDetail = {
        row: i + 2, // +2 потому что строка 1 - заголовки, нумерация с 1
        sku: row.sku || '',
        status: 'error',
        message: '',
      };

      try {
        // Валидация обязательных полей
        if (!row.name || !row.sku) {
          detail.message = 'Отсутствуют обязательные поля: name или sku';
          result.errors++;
          result.details.push(detail);
          continue;
        }

        if (!row.price || isNaN(Number(row.price)) || Number(row.price) < 0) {
          detail.message = 'Неверная цена';
          result.errors++;
          result.details.push(detail);
          continue;
        }

        if (row.stock === undefined || isNaN(Number(row.stock)) || Number(row.stock) < 0) {
          detail.message = 'Неверный остаток';
          result.errors++;
          result.details.push(detail);
          continue;
        }

        // Проверка дубликатов
        const exists = existingSkuSet.has(row.sku);
        if (exists && mode === 'create') {
          if (skipDuplicates) {
            detail.status = 'skipped';
            detail.message = 'Товар с таким SKU уже существует, пропущен';
            result.skipped++;
            result.details.push(detail);
            continue;
          } else {
            detail.message = 'Товар с таким SKU уже существует';
            result.errors++;
            result.details.push(detail);
            continue;
          }
        }

        if (!exists && mode === 'update') {
          detail.message = 'Товар с таким SKU не найден для обновления';
          result.errors++;
          result.details.push(detail);
          continue;
        }

        // Поиск или создание категории
        let category: Category | null = null;
        if (row.category) {
          const categoryName = row.category.trim().toLowerCase();
          category = categoryMap.get(categoryName) || null;
          if (!category) {
            // Создаём новую категорию
            const slug = transliterateRuToSlug(row.category);
            category = this.categoryRepo.create({
              name: row.category,
              slug,
              isActive: true,
              sortOrder: 0,
            });
            category = await this.categoryRepo.save(category);
            categoryMap.set(categoryName, category);
          }
        }

        // Поиск или создание производителя
        let manufacturer: Manufacturer | null = null;
        if (row.brand) {
          const brandName = row.brand.trim().toLowerCase();
          manufacturer = manufacturerMap.get(brandName) || null;
          if (!manufacturer) {
            // Создаём нового производителя
            const slug = transliterateRuToSlug(row.brand);
            manufacturer = this.manufacturerRepo.create({
              name: row.brand,
              slug,
              isActive: true,
            });
            manufacturer = await this.manufacturerRepo.save(manufacturer);
            manufacturerMap.set(brandName, manufacturer);
          }
        }

        // Создание или обновление товара
        const slug = transliterateRuToSlug(row.name);
        const productData: Partial<Product> = {
          name: row.name,
          sku: row.sku,
          slug,
          price: Number(row.price),
          stock: Number(row.stock),
          shortDescription: row.shortDescription || row.description || null,
          description: row.description || null,
          oldPrice: row.oldPrice ? Number(row.oldPrice) : null,
          currency: row.currency || 'RUB',
          isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
          category,
          manufacturer,
        };

        let product: Product;
        if (exists && (mode === 'update' || mode === 'upsert')) {
          // Обновление существующего
          const existing = await this.productRepo.findOne({
            where: { sku: row.sku },
            relations: ['images'],
          });
          if (existing) {
            Object.assign(existing, productData);
            product = await this.productRepo.save(existing);
          } else {
            product = this.productRepo.create(productData);
            product = await this.productRepo.save(product);
          }
        } else {
          // Создание нового
          product = this.productRepo.create(productData);
          product = await this.productRepo.save(product);
        }

        // Обработка изображения
        if (row.image_url) {
          try {
            // Проверяем, есть ли уже изображение
            const existingImages = await this.imagesRepo.find({
              where: { product: { id: product.id } },
            });

            if (existingImages.length === 0) {
              // Создаём изображение из URL
              const img = this.imagesRepo.create({
                product,
                url: row.image_url,
                alt: row.name,
                sortOrder: 0,
              });
              await this.imagesRepo.save(img);
            }
          } catch (imgError) {
            // Игнорируем ошибки загрузки изображений
            console.warn(`Failed to process image for product ${product.sku}:`, imgError);
          }
        }

        detail.status = 'success';
        detail.message = exists ? 'Товар обновлён' : 'Товар создан';
        result.success++;
        result.details.push(detail);
      } catch (error) {
        detail.message = error instanceof Error ? error.message : 'Неизвестная ошибка';
        result.errors++;
        result.details.push(detail);
      }
    }

    return result;
  }

  async exportToCsv(productIds?: number[]): Promise<string> {
    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.manufacturer', 'manufacturer')
      .leftJoinAndSelect('product.images', 'images');

    if (productIds && productIds.length > 0) {
      queryBuilder.where('product.id IN (:...ids)', { ids: productIds });
    }

    const products = await queryBuilder.getMany();

    // Заголовки CSV
    const headers = [
      'name',
      'sku',
      'price',
      'stock',
      'category',
      'brand',
      'description',
      'image_url',
      'shortDescription',
      'oldPrice',
      'currency',
      'isActive',
    ];

    // Строки CSV
    const rows = products.map((product) => {
      const mainImage = product.images?.sort((a, b) => a.sortOrder - b.sortOrder)[0];
      return [
        `"${(product.name || '').replace(/"/g, '""')}"`,
        `"${(product.sku || '').replace(/"/g, '""')}"`,
        product.price || 0,
        product.stock || 0,
        `"${(product.category?.name || '').replace(/"/g, '""')}"`,
        `"${(product.manufacturer?.name || '').replace(/"/g, '""')}"`,
        `"${(product.description || '').replace(/"/g, '""')}"`,
        `"${(mainImage?.url || '').replace(/"/g, '""')}"`,
        `"${(product.shortDescription || '').replace(/"/g, '""')}"`,
        product.oldPrice || '',
        product.currency || 'RUB',
        product.isActive ? 'true' : 'false',
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}
