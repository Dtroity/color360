import { config as dotenvConfig } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import { DataSource } from 'typeorm';

// Загрузить .env
dotenvConfig({
  path: process.env.DOTENV_PATH || path.join(__dirname, '../.env'),
});

// Импорты entities
import { Product } from '../apps/backend/src/modules/catalog/products/entities/product.entity';
import { ProductImage } from '../apps/backend/src/modules/catalog/products/entities/product-image.entity';
import { Category } from '../apps/backend/src/modules/catalog/categories/entities/category.entity';
import { Manufacturer } from '../apps/backend/src/modules/catalog/manufacturers/entities/manufacturer.entity';

// Импортируем ВСЕ сущности, которые могут быть связаны с Product
import { User } from '../apps/backend/src/modules/users/entities/user.entity';
import { Order } from '../apps/backend/src/modules/orders/entities/order.entity';
import { OrderItem } from '../apps/backend/src/modules/orders/entities/order-item.entity';
// Добавьте другие сущности, если они есть (Review, Cart, CartItem и т.д.)

import { dataSourceConfig } from '../apps/backend/src/config/database.config';

// Создать DataSource
const AppDataSource = new DataSource({
  ...dataSourceConfig,
  entities: [
    Product, 
    ProductImage, 
    Category, 
    Manufacturer,
    User,
    Order,
    OrderItem,
    // Добавьте все остальные сущности из вашего проекта
  ],
  synchronize: false,
  logging: false,
});

const CSV_PATH = path.join(__dirname, '../../extracted_products.csv');
const IMAGES_DIR = path.join(__dirname, '../apps/frontend/public/uploads/products');

// Транслитерация для slug
const translitMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
  'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
};

const toSlug = (text: string): string => {
  return text
    .toLowerCase()
    .split('')
    .map((char) => translitMap[char] || char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
};

const parsePrice = (priceStr: string): number => {
  const cleaned = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const generateSku = (title: string, index: number): string => {
  const base = title
    .substring(0, 15)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base}-${index}`;
};

async function importFromCSV() {
  console.log('🔌 Подключение к базе данных...');
  
  try {
    await AppDataSource.initialize();
    console.log('✅ База данных подключена\n');

    // Читаем CSV
    console.log(`📄 Чтение CSV: ${CSV_PATH}`);
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`📦 Найдено записей в CSV: ${records.length}\n`);

    const productRepo = AppDataSource.getRepository(Product);
    const productImageRepo = AppDataSource.getRepository(ProductImage);
    const categoryRepo = AppDataSource.getRepository(Category);
    const manufacturerRepo = AppDataSource.getRepository(Manufacturer);

    // Получить или создать дефолтную категорию
    let defaultCategory = await categoryRepo.findOne({ where: { slug: 'bez-kategorii' } });
    if (!defaultCategory) {
      defaultCategory = categoryRepo.create({
        name: 'Без категории',
        slug: 'bez-kategorii',
        isActive: true,
      });
      defaultCategory = await categoryRepo.save(defaultCategory);
      console.log('✅ Создана категория "Без категории"\n');
    }

    // Получить или создать дефолтного производителя
    let defaultManufacturer = await manufacturerRepo.findOne({ where: { slug: 'hiwatch' } });
    if (!defaultManufacturer) {
      defaultManufacturer = manufacturerRepo.create({
        name: 'HiWatch',
        slug: 'hiwatch',
        isActive: true,
      });
      defaultManufacturer = await manufacturerRepo.save(defaultManufacturer);
      console.log('✅ Создан производитель "HiWatch"\n');
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        const title = record.Title || record.title;
        const description = record.Description || record.description;
        const priceStr = record.Price || record.price;
        const imagesStr = record.Images || record.images;

        if (!title) {
          skipped++;
          continue;
        }

        const price = parsePrice(priceStr);
        const slug = toSlug(title);
        const sku = generateSku(title, i + 1);
        const imageFiles = imagesStr ? imagesStr.split(';').filter(Boolean) : [];

        // Проверить существование товара
        let existing = await productRepo.findOne({ 
          where: { slug },
          relations: ['images'],
        });

        let product: Product;
        
        if (existing) {
          // Обновить существующий
          existing.name = title;
          existing.description = description || null;
          existing.price = price;
          product = await productRepo.save(existing);
          
          // Удалить старые изображения
          if (existing.images?.length) {
            await productImageRepo.remove(existing.images);
          }
        } else {
          // Создать новый
          product = productRepo.create({
            name: title,
            slug,
            sku,
            price,
            currency: 'RUB',
            description: description || null,
            category: defaultCategory,
            manufacturer: defaultManufacturer,
            stock: 10,
            isActive: true,
          });
          product = await productRepo.save(product);
        }

        // Добавить изображения
        for (let idx = 0; idx < imageFiles.length; idx++) {
          const imageFile = imageFiles[idx].trim();
          const sourcePath = path.join(IMAGES_DIR, imageFile);
          
          // Проверить существование файла
          if (fs.existsSync(sourcePath)) {
            const destPath = `/uploads/products/${imageFile}`;
            
            const image = productImageRepo.create({
              url: destPath,
              alt: title,
              sortOrder: idx,
              product,
            });
            await productImageRepo.save(image);
          }
        }

        imported++;
        
        const progress = ((i + 1) / records.length * 100).toFixed(1);
        process.stdout.write(`\r✅ Импорт: ${i + 1}/${records.length} (${progress}%) - ${title.substring(0, 50)}`);
      } catch (error: any) {
        errors++;
        console.error(`\n❌ Ошибка импорта товара ${i + 1}: ${error.message}`);
      }
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('📊 ОТЧЕТ ОБ ИМПОРТЕ');
    console.log('='.repeat(60));
    console.log(`✅ Импортировано: ${imported}`);
    console.log(`⏭️  Пропущено: ${skipped}`);
    console.log(`❌ Ошибок: ${errors}`);
    console.log('='.repeat(60) + '\n');

  } catch (error: any) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('🔌 Соединение закрыто');
  }
}

importFromCSV();