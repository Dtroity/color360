import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Product } from '../modules/catalog/products/entities/product.entity';
import { Category } from '../modules/catalog/categories/entities/category.entity';
import { ProductImage } from '../modules/catalog/products/entities/product-image.entity';
import { Manufacturer } from '../modules/catalog/manufacturers/entities/manufacturer.entity';

interface ExtractedProduct {
  name: string;
  slug: string;
  sku?: string;
  price?: number;
  oldPrice?: number;
  description?: string;
  shortDescription?: string;
  categoryName?: string;
  imageUrl?: string;
  specifications?: Record<string, string>;
}

interface ExtractedCategory {
  name: string;
  slug: string;
  description?: string;
}

// Создаём DataSource с явной кодировкой UTF-8
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: +(process.env.DATABASE_PORT || 5432),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'video_shop',
  entities: [Product, Category, ProductImage, Manufacturer],
  synchronize: false,
  logging: true,
  extra: {
    charset: 'utf8',
    client_encoding: 'UTF8',
  },
});

// Функция задержки для batch операций
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Главная функция
async function main() {
  console.log('🔌 Подключение к базе данных...');
  
  try {
    await AppDataSource.initialize();
    console.log('✅ Подключение установлено\n');
  } catch (error) {
    console.error('❌ Ошибка подключения к БД:', error);
    process.exit(1);
  }

  const productsJsonPath = path.join(process.cwd(), 'data', 'extracted', 'products.json');
  const categoriesJsonPath = path.join(process.cwd(), 'data', 'extracted', 'categories.json');

  // Читаем JSON файлы
  console.log('📖 Чтение JSON файлов...');
  
  if (!fs.existsSync(productsJsonPath)) {
    console.error('❌ Файл products.json не найден!');
    await AppDataSource.destroy();
    process.exit(1);
  }

  const products: ExtractedProduct[] = JSON.parse(
    fs.readFileSync(productsJsonPath, 'utf-8')
  );

  const categories: ExtractedCategory[] = fs.existsSync(categoriesJsonPath)
    ? JSON.parse(fs.readFileSync(categoriesJsonPath, 'utf-8'))
    : [];

  console.log(`✅ Загружено ${products.length} товаров и ${categories.length} категорий\n`);

  const categoryRepo = AppDataSource.getRepository(Category);
  const productRepo = AppDataSource.getRepository(Product);
  const imageRepo = AppDataSource.getRepository(ProductImage);

  // Шаг 1: Создание категорий
  console.log('📁 Создание категорий...');
  const categoryMap = new Map<string, Category>();
  let categoriesCreated = 0;
  let categoriesSkipped = 0;

  for (const catData of categories) {
    try {
      // Проверяем существование
      let category = await categoryRepo.findOne({
        where: { slug: catData.slug },
      });

      if (!category) {
        category = categoryRepo.create({
          name: catData.name,
          slug: catData.slug,
          description: catData.description || null,
          isActive: true,
        });
        category = await categoryRepo.save(category);
        categoriesCreated++;
        console.log(`  ✅ Создана категория: ${category.name}`);
      } else {
        categoriesSkipped++;
        console.log(`  ⏭️  Пропущена (существует): ${category.name}`);
      }

      categoryMap.set(catData.slug, category);
    } catch (error) {
      console.error(`  ❌ Ошибка при создании категории ${catData.name}:`, error);
    }
  }

  console.log(`\n📊 Категории: создано ${categoriesCreated}, пропущено ${categoriesSkipped}\n`);

  // Шаг 2: Создание товаров
  console.log('📦 Создание товаров...');
  let productsCreated = 0;
  let productsSkipped = 0;
  let productsError = 0;

  // Используем транзакцию для batch операций
  const batchSize = 10;
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const progress = `[${i + 1}-${Math.min(i + batchSize, products.length)}/${products.length}]`;

    await AppDataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const imageRepo = manager.getRepository(ProductImage);

      for (const productData of batch) {
        try {
          // Валидация обязательных полей
          if (!productData.name || !productData.slug) {
            console.log(`${progress} ⚠️  Пропущен (нет названия или slug): ${productData.name || 'N/A'}`);
            productsSkipped++;
            continue;
          }

          // Проверяем существование
          const existing = await productRepo.findOne({
            where: { slug: productData.slug },
          });

          if (existing) {
            console.log(`${progress} ⏭️  Пропущен (существует): ${productData.name}`);
            productsSkipped++;
            continue;
          }

          // Находим категорию
          let category: Category | null = null;
          if (productData.categoryName) {
            // Ищем категорию по имени или slug
            const categorySlug = productData.categoryName
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '');
            
            category = categoryMap.get(categorySlug) || null;
            
            // Если не нашли, пробуем найти в БД
            if (!category) {
              category = await manager.getRepository(Category).findOne({
                where: [
                  { slug: categorySlug },
                  { name: productData.categoryName },
                ],
              });
            }
          }

          // Создаём товар
          const product = productRepo.create({
            name: productData.name,
            slug: productData.slug,
            sku: productData.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            price: productData.price || 0,
            oldPrice: productData.oldPrice || null,
            description: productData.description || null,
            shortDescription: productData.shortDescription || null,
            stock: 0, // По умолчанию
            isActive: true,
            availability: 'in_stock',
            currency: 'RUB',
            category: category,
            attributes: productData.specifications || null,
          });

          const savedProduct = await productRepo.save(product);

          // Создаём изображение если есть
          if (productData.imageUrl) {
            const image = imageRepo.create({
              url: productData.imageUrl,
              alt: productData.name,
              sortOrder: 0,
              product: savedProduct,
            });
            await imageRepo.save(image);
          }

          productsCreated++;
          console.log(`${progress} ✅ ${savedProduct.name}`);
        } catch (error) {
          productsError++;
          console.error(`${progress} ❌ Ошибка: ${productData.name}`, error);
        }
      }
    });

    // Задержка между batch'ами
    if (i + batchSize < products.length) {
      await delay(100);
    }
  }

  console.log('\n📊 Статистика импорта:');
  console.log(`✅ Товаров создано: ${productsCreated}`);
  console.log(`⏭️  Товаров пропущено: ${productsSkipped}`);
  console.log(`❌ Ошибок: ${productsError}`);

  // Финальная статистика
  const totalProducts = await productRepo.count();
  const totalCategories = await categoryRepo.count();

  console.log(`\n📈 Итого в базе данных:`);
  console.log(`   Товаров: ${totalProducts}`);
  console.log(`   Категорий: ${totalCategories}`);

  await AppDataSource.destroy();
  console.log('\n✅ Импорт завершён!');
}

// Запуск
main().catch(async (error) => {
  console.error('❌ Критическая ошибка:', error);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});

