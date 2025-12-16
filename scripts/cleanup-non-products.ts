/**
 * Скрипт для очистки не-товаров из базы данных
 * 
 * Удаляет товары, которые:
 * 1. Имеют нулевую или отсутствующую цену (price IS NULL OR price <= 0)
 * 2. Не имеют названия (name отсутствует или пустое)
 * 3. Не имеют изображений (отсутствуют изображения или только логотипы)
 * 4. Являются статьями, новостями, политикой конфиденциальности и т.д.
 * 5. Не имеют достаточного количества признаков товара (менее 3 из 5)
 * 
 * Инструкция по запуску:
 * 1. Убедитесь, что файл .env настроен с правильными параметрами БД
 * 2. Запустите: pnpm run cleanup:non-products
 *    или: ts-node --files --project scripts/tsconfig.json scripts/cleanup-non-products.ts
 * 
 * ВАЖНО: Скрипт работает безопасно - один проход, один результат.
 * Перед удалением выводится список товаров, которые будут удалены.
 */

import { config as dotenvConfig } from 'dotenv';
import * as path from 'path';

// Загрузить .env ПЕРВЫМ
dotenvConfig({
  path: process.env.DOTENV_PATH || path.join(__dirname, '../.env'),
});

process.env.TYPEORM_USE_EXPLICIT_ENTITIES = 'true';

// Импорт зависимостей ПОСЛЕ загрузки .env
import { DataSource, Repository } from 'typeorm';

// Импорты entities - в правильном порядке: сначала базовые, потом зависимые
// ВАЖНО: Используем обычный import, не import type
import { Manufacturer } from '../apps/backend/src/modules/catalog/manufacturers/entities/manufacturer.entity';
import { Category } from '../apps/backend/src/modules/catalog/categories/entities/category.entity';
import { Product } from '../apps/backend/src/modules/catalog/products/entities/product.entity';
import { ProductImage } from '../apps/backend/src/modules/catalog/products/entities/product-image.entity';
import { User } from '../apps/backend/src/modules/users/entities/user.entity';
import { Order } from '../apps/backend/src/modules/orders/entities/order.entity';
import { OrderItem } from '../apps/backend/src/modules/orders/entities/order-item.entity';
import { dataSourceConfig } from '../apps/backend/src/config/database.config';

// ВАЖНО: User, Order и OrderItem включены для полной цепочки зависимостей:
// Product -> OrderItem -> Order -> User
const cleanupEntities = [
  Manufacturer,   // Базовые без зависимостей
  Category,       // Базовые без зависимостей
  User,           // Базовые без зависимостей (нужен для Order#user)
  Product,        // Зависит от Category, Manufacturer, OrderItem
  ProductImage,   // Зависит от Product
  Order,          // Зависит от User (нужен для OrderItem#order)
  OrderItem,      // Зависит от Product и Order (нужен для связи Product#orderItems)
];

const AppDataSource = new DataSource({
  ...dataSourceConfig,
  entities: cleanupEntities,
  synchronize: false,
  logging: false,
});

const excludedKeywords = [
  'статья', 'article', 'новость', 'news', 'блог', 'blog',
  'политика', 'policy', 'privacy', 'конфиденциальность',
  'доставка', 'delivery', 'контакты', 'contacts', 'about',
  'о-нас', 'about-us', 'условия', 'terms', 'правила', 'rules',
  'гарантия', 'warranty', 'возврат', 'return', 'обмен', 'exchange',
  'как-выбрать', 'как-подключить', 'инструкция', 'instruction',
  'sitemap', 'карта-сайта', 'login', 'вход', 'регистрация', 'register',
];

async function cleanupNonProducts() {
  console.log('🧹 Очистка не-товаров из базы данных...\n');
  
  await AppDataSource.initialize();
  const productRepo = AppDataSource.getRepository(Product);
  const productImageRepo = AppDataSource.getRepository(ProductImage);
  
  try {
    // Получаем все товары с категориями и изображениями
    const allProducts = await productRepo.find({
      relations: ['images', 'category'],
    });
    
    console.log(`📦 Найдено товаров: ${allProducts.length}\n`);
    
    const productsToDelete: Product[] = [];
    
    for (const product of allProducts) {
      const nameLower = product.name.toLowerCase();
      const slugLower = product.slug.toLowerCase();
      const descriptionLower = (product.description || '').toLowerCase();
      const shortDescriptionLower = (product.shortDescription || '').toLowerCase();
      
      // Проверяем название и slug на наличие исключающих ключевых слов
      const isExcluded = excludedKeywords.some(keyword => 
        nameLower.includes(keyword) || 
        slugLower.includes(keyword) ||
        descriptionLower.includes(keyword) ||
        shortDescriptionLower.includes(keyword)
      );
      
      // Проверяем, что товар имеет цену > 0 или SKU
      const hasPrice = product.price > 0;
      const hasSku = product.sku && product.sku.trim().length > 0;
      
      // #region agent log
      const logPath = require('path').join(__dirname, '..', '.cursor', 'debug.log');
      try {
        require('fs').appendFileSync(logPath, JSON.stringify({
          location: 'cleanup-non-products.ts:93',
          message: 'Product price check',
          data: { productId: product.id, name: product.name, price: product.price, hasPrice, hasSku },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A'
        }) + '\n', 'utf8');
      } catch (e) {}
      // #endregion
      
      // ЯВНАЯ ПРОВЕРКА 1: Товары с нулевой или отсутствующей ценой должны быть удалены
      if (product.price === null || product.price === undefined || product.price <= 0) {
        productsToDelete.push(product);
        console.log(`   ❌ ${product.name || 'Без названия'} (ID: ${product.id}) - будет удален [нулевая/отсутствующая цена: ${product.price}]`);
        continue;
      }

      // ЯВНАЯ ПРОВЕРКА 2: Товары без названия должны быть удалены
      if (!product.name || product.name.trim().length === 0) {
        productsToDelete.push(product);
        console.log(`   ❌ Товар без названия (ID: ${product.id}) - будет удален [отсутствует name]`);
        continue;
      }

      // ЯВНАЯ ПРОВЕРКА 3: Товары без изображений должны быть удалены
      const hasRealImages = product.images && product.images.length > 0 && product.images.some((img: any) => {
        const url = (img.url || '').toLowerCase();
        return !url.includes('logo') && 
               !url.includes('logotip') && 
               !url.includes('catalog/hiwatch') &&
               !url.includes('brand');
      });
      
      if (!hasRealImages) {
        productsToDelete.push(product);
        console.log(`   ❌ ${product.name} (ID: ${product.id}) - будет удален [отсутствуют изображения]`);
        continue;
      }
      
      // Проверяем наличие описания (товары обычно имеют описание)
      const hasDescription = (product.description && product.description.trim().length > 50) ||
                            (product.shortDescription && product.shortDescription.trim().length > 20);
      
      // Проверяем наличие категории (товары должны быть в категории)
      const hasCategory = !!product.category;
      
      // Проверяем наличие изображений (товары обычно имеют изображения)
      const hasImages = product.images && product.images.length > 0;
      
      // Дополнительные признаки не-товара:
      // - Очень длинное название без структуры товара
      // - Название содержит "как", "что такое", "инструкция"
      // - Название содержит только логотип или бренд
      const isArticleLike = 
        nameLower.includes('как ') ||
        nameLower.includes('что такое') ||
        nameLower.includes('инструкция') ||
        nameLower.includes('руководство') ||
        nameLower.startsWith('10 ') ||
        nameLower.startsWith('5 ') ||
        nameLower.includes('выбор ') ||
        nameLower.includes('подключение ') ||
        (nameLower.length > 100 && !hasPrice && !hasSku);
      
      // Проверка на "только бренд" (название содержит только название бренда без описания товара)
      const isBrandOnly = 
        (nameLower === 'hiwatch' || nameLower === 'hikvision' || nameLower === 'dahua') &&
        !hasDescription &&
        !hasSku;
      
      // Проверка на дубликаты по названию (очень похожие названия)
      const nameWords = nameLower.split(/\s+/).filter(w => w.length > 2);
      const isTooGeneric = nameWords.length <= 2 && !hasPrice && !hasSku;
      
      // Если товар исключен, похож на статью, только бренд или слишком общий - всегда удаляем
      if (isExcluded || isArticleLike || isBrandOnly || isTooGeneric) {
        productsToDelete.push(product);
        const reasons = [];
        if (isExcluded) reasons.push('ключевые слова');
        if (isArticleLike) reasons.push('похож на статью');
        if (isBrandOnly) reasons.push('только бренд');
        if (isTooGeneric) reasons.push('слишком общее название');
        console.log(`   ❌ ${product.name} (ID: ${product.id}) - будет удален [${reasons.join(', ')}]`);
        continue;
      }
      
      // Дополнительные проверки для товаров, которые прошли базовые проверки
      // Проверка на изображения - если все изображения это логотипы, считаем что изображений нет
      // (эта проверка уже выполнена выше, но оставляем для совместимости)
      
      // Если товар не имеет основных признаков товара - помечаем на удаление
      // Товар должен иметь хотя бы 3 из 5 признаков: цена, SKU, описание, категория, нормальное название
      // (изображения уже проверены выше)
      const productSigns = [
        hasPrice, 
        hasSku, 
        hasDescription, 
        hasCategory, 
        nameWords.length >= 3 // Нормальное название товара должно содержать минимум 3 слова
      ].filter(Boolean).length;
      
      if (productSigns < 3) {
        productsToDelete.push(product);
        const reasons = [];
        if (!hasPrice && !hasSku) reasons.push('нет цены/SKU');
        if (!hasDescription) reasons.push('нет описания');
        if (!hasCategory) reasons.push('нет категории');
        if (nameWords.length < 3) reasons.push('слишком короткое название');
        console.log(`   ❌ ${product.name} (ID: ${product.id}) - будет удален [признаков товара: ${productSigns}/5, ${reasons.join(', ')}]`);
      }
    }
    
    console.log(`\n🗑️  Товаров к удалению: ${productsToDelete.length}\n`);
    
    if (productsToDelete.length === 0) {
      console.log('✅ Не-товары не найдены. База данных чиста.\n');
      return;
    }
    
    // Удаляем изображения товаров
    for (const product of productsToDelete) {
      if (product.images && product.images.length > 0) {
        await productImageRepo.remove(product.images);
        console.log(`   🖼️  Удалено изображений для товара ${product.id}: ${product.images.length}`);
      }
    }
    
    // Удаляем товары
    await productRepo.remove(productsToDelete);
    
    console.log(`\n✅ Успешно удалено товаров: ${productsToDelete.length}\n`);
    
  } catch (error: any) {
    console.error('❌ Ошибка при очистке:', error.message);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

cleanupNonProducts()
  .then(() => {
    console.log('✅ Очистка завершена успешно');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  });

