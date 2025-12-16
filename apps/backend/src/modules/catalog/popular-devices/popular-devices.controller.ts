import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { PopularDevice } from './entities/popular-device.entity';
import { Product } from '../products/entities/product.entity';
import { SiteSetting } from '../../settings/entities/site-setting.entity';

@ApiTags('Popular Products')
@Controller('popular-products')
export class PopularDevicesController {
  constructor(
    @InjectRepository(PopularDevice)
    private readonly popularDeviceRepo: Repository<PopularDevice>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(SiteSetting)
    private readonly settingsRepo: Repository<SiteSetting>,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Получить список популярных товаров', 
    description: 'Возвращает популярные товары. Поддерживает автоматический и ручной режимы.' 
  })
  @ApiQuery({ 
    name: 'mode', 
    required: false, 
    enum: ['auto', 'manual'], 
    description: 'Режим работы: auto - автоматический выбор товаров, manual - ручной выбор из админки. Если не указан, используется настройка из БД.' 
  })
  @ApiResponse({ status: 200, description: 'Список популярных товаров успешно получен' })
  async findAll(@Query('mode') mode?: string) {
    // Определяем режим: если не указан в query, берем из настроек
    let actualMode = mode;
    if (!actualMode) {
      const setting = await this.settingsRepo.findOne({
        where: { key: 'popular_products_mode' },
      });
      actualMode = setting?.value || 'manual';
    }

    // Ручной режим: возвращаем товары из популярных устройств
    if (actualMode === 'manual') {
      const devices = await this.popularDeviceRepo.find({
        where: { isActive: true },
        relations: ['product', 'product.images', 'product.manufacturer'],
        order: { sortOrder: 'ASC', name: 'ASC' },
      });
      
      // Фильтруем только те, у которых есть связанный товар
      const products = devices
        .filter(device => device.product !== null && device.product.isActive)
        .map(device => ({
          id: device.product!.id,
          name: device.product!.name,
          slug: device.product!.slug,
          price: Number(device.product!.price),
          oldPrice: device.product!.oldPrice ? Number(device.product!.oldPrice) : null,
          currency: device.product!.currency,
          stock: device.product!.stock,
          images: device.product!.images || [],
          manufacturer: device.product!.manufacturer,
          sortOrder: device.sortOrder,
        }));

      return products;
    }

    // Автоматический режим: выбираем товары по алгоритму
    // Приоритет: isFeatured > viewsCount > stock > createdAt
    const featuredProducts = await this.productRepo.find({
      where: { 
        isActive: true,
        isFeatured: true,
        stock: MoreThan(0),
      },
      relations: ['images', 'manufacturer'],
      order: { viewsCount: 'DESC', createdAt: 'DESC' },
      take: 8,
    });

    // Если недостаточно товаров с isFeatured, дополняем товарами с максимальными просмотрами
    if (featuredProducts.length < 8) {
      const excludeIds = featuredProducts.map(p => p.id);
      const topViewedProducts = await this.productRepo
        .createQueryBuilder('product')
        .where('product.isActive = :isActive', { isActive: true })
        .andWhere('product.stock > :stock', { stock: 0 })
        .andWhere(excludeIds.length > 0 ? 'product.id NOT IN (:...ids)' : '1=1', { ids: excludeIds })
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.manufacturer', 'manufacturer')
        .orderBy('product.viewsCount', 'DESC')
        .addOrderBy('product.createdAt', 'DESC')
        .take(8 - featuredProducts.length)
        .getMany();

      featuredProducts.push(...topViewedProducts);
    }

    // Если все еще недостаточно, дополняем последними товарами с наличием
    if (featuredProducts.length < 8) {
      const excludeIds = featuredProducts.map(p => p.id);
      const recentProducts = await this.productRepo
        .createQueryBuilder('product')
        .where('product.isActive = :isActive', { isActive: true })
        .andWhere('product.stock > :stock', { stock: 0 })
        .andWhere(excludeIds.length > 0 ? 'product.id NOT IN (:...ids)' : '1=1', { ids: excludeIds })
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.manufacturer', 'manufacturer')
        .orderBy('product.createdAt', 'DESC')
        .take(8 - featuredProducts.length)
        .getMany();

      featuredProducts.push(...recentProducts);
    }

    return featuredProducts.slice(0, 8).map((product, index) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
      currency: product.currency,
      stock: product.stock,
      images: product.images || [],
      manufacturer: product.manufacturer,
      sortOrder: index,
    }));
  }
}

