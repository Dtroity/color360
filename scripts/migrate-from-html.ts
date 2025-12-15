import { config as dotenvConfig } from 'dotenv';
import * as path from 'path';

// Загрузить .env ПЕРВЫМ - ДО всех импортов
dotenvConfig({
  path: process.env.DOTENV_PATH || path.join(__dirname, '../.env'),
});

// Устанавливаем флаг для использования явных entities ДО импорта TypeORM
process.env.TYPEORM_USE_EXPLICIT_ENTITIES = 'true';

// Импорт зависимостей ПОСЛЕ загрузки .env
import * as cheerio from 'cheerio';
import fg from 'fast-glob';
import * as fs from 'fs';
import sharp from 'sharp';
import { Repository, DataSource } from 'typeorm';

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

// ДИАГНОСТИКА: Явное логирование всех импортированных сущностей
console.log('🔍 ФИНАЛЬНАЯ ПРОВЕРКА ИМПОРТА СУЩНОСТЕЙ ДЛЯ МИГРАЦИИ:');
console.log('   Manufacturer:', typeof Manufacturer, Manufacturer ? '✅' : '❌', Manufacturer?.name || 'N/A');
console.log('   Category:', typeof Category, Category ? '✅' : '❌', Category?.name || 'N/A');
console.log('   Product:', typeof Product, Product ? '✅' : '❌', Product?.name || 'N/A');
console.log('   ProductImage:', typeof ProductImage, ProductImage ? '✅' : '❌', ProductImage?.name || 'N/A');
console.log('   User:', typeof User, User ? '✅' : '❌', User?.name || 'N/A');
console.log('   Order:', typeof Order, Order ? '✅' : '❌', Order?.name || 'N/A');
console.log('   OrderItem:', typeof OrderItem, OrderItem ? '✅' : '❌', OrderItem?.name || 'N/A');
console.log('');

// Проверка, что все entities импортированы корректно
// ВАЖНО: User, Order и OrderItem включены для полной цепочки зависимостей:
// Product -> OrderItem -> Order -> User
const migrationEntities = [
  Manufacturer,   // Базовые без зависимостей
  Category,       // Базовые без зависимостей
  User,           // Базовые без зависимостей (нужен для Order#user)
  Product,        // Зависит от Category, Manufacturer, OrderItem
  ProductImage,   // Зависит от Product
  Order,          // Зависит от User (нужен для OrderItem#order)
  OrderItem,      // Зависит от Product и Order (нужен для связи Product#orderItems)
];

const migrationEntityNames = ['Manufacturer', 'Category', 'User', 'Product', 'ProductImage', 'Order', 'OrderItem'];

// Детальное логирование для диагностики
console.log('🔍 Детальная проверка импорта сущностей...');
const entityChecks = migrationEntities.map((entity, index) => {
  const name = migrationEntityNames[index];
  const isUndefined = entity === undefined || entity === null;
  const type = typeof entity;
  const isFunction = typeof entity === 'function';
  const hasConstructor = entity && typeof entity === 'function' && entity.prototype;
  
  if (isUndefined) {
    console.error(`   ❌ ${name}: ${entity === undefined ? 'undefined' : 'null'}`);
  } else {
    console.log(`   ✅ ${name}: ${type}${isFunction ? ' (function)' : ''}${hasConstructor ? ' [has constructor]' : ''}`);
  }
  
  return { entity, name, isUndefined, type, isFunction, hasConstructor };
});

const undefinedMigrationEntities = entityChecks.filter(({ isUndefined }) => isUndefined);

if (undefinedMigrationEntities.length > 0) {
  console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА: Некоторые сущности не импортированы!');
  console.error('   Это может быть вызвано:');
  console.error('   1. Неправильным путем импорта');
  console.error('   2. Проблемой с обработкой декораторов TypeScript');
  console.error('   3. Circular dependency');
  console.error('   4. Проблемой с TSX/TypeScript компиляцией');
  console.error('\n   Детальная информация:');
  undefinedMigrationEntities.forEach(({ name, type }) => {
    console.error(`   - ${name}: type=${type}`);
  });
  console.error('\n   Проверьте импорты в файлах сущностей.\n');
  process.exit(1);
}

console.log('✅ Все сущности для миграции импортированы корректно\n');

// Создать DataSource
const AppDataSource = new DataSource({
  ...dataSourceConfig,
  entities: migrationEntities,
  synchronize: false,
  logging: false,
});

// Путь к hiwatch_site_copy - находится на уровень выше video-shop-monorepo
// __dirname в скрипте = video-shop-monorepo/scripts
// Нужно подняться на 2 уровня: scripts -> video-shop-monorepo -> hiwatch_site -> hiwatch_site_copy
const possibleSourceDirs = [
  process.env.HTML_SOURCE_DIR,
  path.resolve(__dirname, '..', '..', 'hiwatch_site_copy'),
  'C:\\Users\\Detroyti\\Documents\\GitHub\\hiwatch_site\\hiwatch_site_copy',
].filter(Boolean);

const SOURCE_DIR = possibleSourceDirs.find(dir => dir && fs.existsSync(dir)) || possibleSourceDirs[0] || '';
const UPLOADS_DIR = path.resolve(
  __dirname,
  '..',
  'apps',
  'frontend',
  'public',
  'uploads',
);
const PRODUCTS_UPLOADS_DIR = path.join(UPLOADS_DIR, 'products');
const ERROR_LOG_FILE = path.join(__dirname, 'migration-errors.log');
const CATEGORY_ROOTS = [
  'ip-oborudovanie',
  'hd-tvi-oborudovanie',
  'videonablyudenye',
  'aksessuary',
  'domofoniya',
  'ohranno-pozharnaya-signalizaciya',
];

type MigrationStats = {
  manufacturersCreated: number;
  manufacturersUpdated: number;
  categoriesCreated: number;
  categoriesUpdated: number;
  productsCreated: number;
  productsUpdated: number;
  productsSkipped: number;
  productImagesCopied: number;
  productImagesFailed: number;
  productsWithoutImages: number;
  productsWithoutDescription: number;
  errors: number;
  errorDetails: Array<{ file: string; error: string; timestamp: string }>;
};

const stats: MigrationStats = {
  manufacturersCreated: 0,
  manufacturersUpdated: 0,
  categoriesCreated: 0,
  categoriesUpdated: 0,
  productsCreated: 0,
  productsUpdated: 0,
  productsSkipped: 0,
  productImagesCopied: 0,
  productImagesFailed: 0,
  productsWithoutImages: 0,
  productsWithoutDescription: 0,
  errors: 0,
  errorDetails: [],
};

// Функция для записи ошибок в лог-файл
const logError = (file: string, error: string) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${file}: ${error}\n`;
  fs.appendFileSync(ERROR_LOG_FILE, logEntry, 'utf-8');
  stats.errorDetails.push({ file, error, timestamp });
};

// Очистить лог-файл при старте
if (fs.existsSync(ERROR_LOG_FILE)) {
  fs.writeFileSync(ERROR_LOG_FILE, `=== Migration Log Started: ${new Date().toISOString()} ===\n\n`, 'utf-8');
}

const translitMap: Record<string, string> = {
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

const toSlug = (value: string, suffix = ''): string => {
  const normalized = value
    .toLowerCase()
    .split('')
    .map((char) => translitMap[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${normalized}${suffix ? `-${suffix}` : ''}`;
};

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const parsePrice = (value?: string | null): number | null => {
  if (!value) return null;
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const readHtml = (filePath: string): string => {
  try {
    return fs.readFileSync(filePath, { encoding: 'utf-8' });
  } catch (error: any) {
    throw new Error(`Не удалось прочитать файл: ${error.message}`);
  }
};

const cleanText = (text: string) => text.replace(/\s+/g, ' ').trim();

const upsertBySlug = async <T extends { slug: string }>(
  repo: Repository<T>,
  slug: string,
  payload: Partial<T>,
) => {
  try {
    const existing = await repo.findOne({
      where: { slug } as never,
    });
    if (existing) {
      repo.merge(existing as never, payload as never);
      await repo.save(existing as never);
      return { entity: existing, created: false };
    }
    const created = repo.create(payload as never);
    const saved = await repo.save(created as never);
    return { entity: saved, created: true };
  } catch (error: any) {
    throw new Error(`Ошибка upsert для slug "${slug}": ${error.message}`);
  }
};

const migrateManufacturers = async () => {
  console.log('\n🏭 Миграция производителей...');
  const repo = AppDataSource.getRepository(Manufacturer);
  
  try {
    const brandFiles = await fg('brand_*.html', {
      cwd: SOURCE_DIR,
      onlyFiles: true,
    });

    if (brandFiles.length === 0) {
      console.log('⚠️  Файлы производителей не найдены');
      return;
    }

    console.log(`   Найдено файлов: ${brandFiles.length}`);
    let processed = 0;
    
    for (let i = 0; i < brandFiles.length; i++) {
      const file = brandFiles[i];
      const filePath = path.join(SOURCE_DIR, file);
      
      try {
        const html = readHtml(filePath);
        const $ = cheerio.load(html);
        const headingText =
          $('h1').first().text().trim() ||
          $('.heading span').first().text().trim() ||
          file.replace('brand_', '').replace('.html', '');
        const slug = toSlug(
          file.replace('brand_', '').replace('.html', '') || headingText,
        );
        const description = cleanText($('.description').text());
        const logo =
          $('img[src*="image/catalog"]').first().attr('src')?.replace(/^\//, '') ||
          null;

        const data = {
          name: headingText,
          slug,
          description,
          logo,
          isActive: true,
        };
        const { created } = await upsertBySlug(repo, slug, data);
        if (created) {
          stats.manufacturersCreated += 1;
        } else {
          stats.manufacturersUpdated += 1;
        }
        processed += 1;
        
        const progress = ((i + 1) / brandFiles.length) * 100;
        process.stdout.write(`\r   Обработка: ${i + 1}/${brandFiles.length} (${progress.toFixed(1)}%)`);
      } catch (error: any) {
        stats.errors += 1;
        const errorMsg = error.message || String(error);
        logError(file, errorMsg);
        console.error(`\n   ❌ Ошибка обработки ${file}: ${errorMsg}`);
      }
    }
    
    console.log(`\n   ✅ Обработано производителей: ${processed}`);
  } catch (error: any) {
    const errorMsg = `Критическая ошибка миграции производителей: ${error.message}`;
    logError('migrateManufacturers', errorMsg);
    throw new Error(errorMsg);
  }
};

const categoryIndexByPath = new Map<string, Category>();
const categoryIndexBySlug = new Map<string, Category>();

// Маппинг транслитерации на русские названия категорий
const categoryNameMap: Record<string, string> = {
  'ip-oborudovanie': 'IP-оборудование',
  'ip-kamery': 'IP-камеры',
  'ip-videoregistratory': 'IP-видеорегистраторы',
  'hd-tvi-oborudovanie': 'HD-TVI оборудование',
  'hd-tvi-kamery': 'HD-TVI камеры',
  'hd-tvi-videoregistratory': 'HD-TVI видеорегистраторы',
  'videonablyudenye': 'Видеонаблюдение',
  'kamery': 'Камеры',
  'videoregistratory': 'Видеорегистраторы',
  'aksessuary': 'Аксессуары',
  'kabeli': 'Кабели',
  'bloki-pitaniya': 'Блоки питания',
  'domofoniya': 'Домофония',
  'ohranno-pozharnaya-signalizaciya': 'Охранно-пожарная сигнализация',
  'signalizaciya': 'Сигнализация',
};

const toCategoryName = (segment: string): string => {
  // Сначала проверяем точное совпадение в маппинге
  const normalized = segment.toLowerCase().replace(/[-_]/g, '-');
  if (categoryNameMap[normalized]) {
    return categoryNameMap[normalized];
  }
  
  // Проверяем частичные совпадения (для вложенных категорий)
  for (const [key, value] of Object.entries(categoryNameMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  // Если не найдено в маппинге, используем старую логику с улучшениями
  const words = segment
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(Boolean);
  
  // Специальная обработка известных слов
  const wordMap: Record<string, string> = {
    'kamery': 'Камеры',
    'kamera': 'Камера',
    'videoregistratory': 'Видеорегистраторы',
    'videoregistrator': 'Видеорегистратор',
    'kabeli': 'Кабели',
    'kabel': 'Кабель',
    'aksessuary': 'Аксессуары',
    'aksessuar': 'Аксессуар',
    'ip': 'IP',
    'hd': 'HD',
    'tvi': 'TVI',
  };
  
  return words
    .map((word) => {
      const lower = word.toLowerCase();
      return wordMap[lower] || (word.charAt(0).toUpperCase() + word.slice(1));
    })
    .join(' ');
};

const migrateCategoryTree = async (
  relativeDir: string,
  parent?: Category,
) => {
  const fullPath = path.join(SOURCE_DIR, relativeDir);
  if (!fs.existsSync(fullPath)) return;

  try {
    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dirName = entry.name;
      const normalizedRelative = path
        .join(relativeDir, dirName)
        .replace(/\\/g, '/');
      const name = toCategoryName(dirName);
      const slug = toSlug(normalizedRelative);
      const repo = AppDataSource.getRepository(Category);

      const payload = {
        name,
        slug,
        parent,
        isActive: true,
      };
      const { entity, created } = await upsertBySlug(repo, slug, payload);
      if (created) {
        stats.categoriesCreated += 1;
      } else {
        stats.categoriesUpdated += 1;
      }
      categoryIndexByPath.set(normalizedRelative, entity);
      categoryIndexBySlug.set(slug, entity);

      await migrateCategoryTree(normalizedRelative, entity);
    }
  } catch (error: any) {
    const errorMsg = `Ошибка обработки категории ${relativeDir}: ${error.message}`;
    logError(relativeDir, errorMsg);
    throw new Error(errorMsg);
  }
};

const migrateCategories = async () => {
  console.log('\n📂 Миграция категорий...');
  const repo = AppDataSource.getRepository(Category);
  
  try {
    for (const root of CATEGORY_ROOTS) {
      const fullRootPath = path.join(SOURCE_DIR, root);
      if (!fs.existsSync(fullRootPath)) {
        console.log(`   ⚠️  Папка не найдена: ${root}`);
        continue;
      }
      
      try {
        const rootSlug = toSlug(root);
        const rootPayload = {
          name: toCategoryName(root),
          slug: rootSlug,
          isActive: true,
        };
        const { entity } = await upsertBySlug(repo, rootSlug, rootPayload);
        categoryIndexByPath.set(root, entity);
        categoryIndexBySlug.set(rootSlug, entity);
        await migrateCategoryTree(root, entity);
      } catch (error: any) {
        const errorMsg = `Ошибка обработки корневой категории ${root}: ${error.message}`;
        logError(root, errorMsg);
        console.error(`   ❌ ${errorMsg}`);
      }
    }
    console.log(`   ✅ Проиндексировано категорий: ${categoryIndexByPath.size}`);
  } catch (error: any) {
    const errorMsg = `Критическая ошибка миграции категорий: ${error.message}`;
    logError('migrateCategories', errorMsg);
    throw new Error(errorMsg);
  }
};

/**
 * Копирует и оптимизирует изображение товара
 * Сохраняет в структуру: /uploads/products/{productId}/{index}.webp
 */
const copyAndOptimizeImage = async (
  src: string,
  productId: number,
  index: number,
): Promise<string | null> => {
  try {
    // Нормализация пути к исходному файлу
    let normalizedSrc = src.replace(/^https?:\/\/[^/]+\//, '').replace(/^\//, '');
    
    // Убираем относительные пути (../)
    normalizedSrc = normalizedSrc.replace(/^(\.\.\/)+/, '');
    
    // Пробуем несколько возможных путей
    const possiblePaths = [
      path.join(SOURCE_DIR, normalizedSrc), // Прямой путь
      path.join(SOURCE_DIR, 'image', 'catalog', normalizedSrc.replace(/^image\/catalog\//, '')), // image/catalog/...
      path.join(SOURCE_DIR, 'image', 'cache', 'catalog', 'products', path.basename(normalizedSrc)), // image/cache/catalog/products/...
      path.join(SOURCE_DIR, normalizedSrc.replace(/^image\/catalog\//, '')), // Без префикса image/catalog
    ];
    
    let originalPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        originalPath = possiblePath;
        break;
      }
    }

    if (!originalPath) {
      stats.productImagesFailed += 1;
      return null;
    }

    // Создать папку для товара
    const productUploadDir = path.join(PRODUCTS_UPLOADS_DIR, productId.toString());
    ensureDir(productUploadDir);

    // Путь к оптимизированному файлу
    const destPath = path.join(productUploadDir, `${index}.webp`);

    // Если файл уже существует, пропускаем
    if (fs.existsSync(destPath)) {
      stats.productImagesCopied += 1;
      return `/uploads/products/${productId}/${index}.webp`;
    }

    // Оптимизация и конвертация в WebP
    await sharp(originalPath)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toFile(destPath);

    stats.productImagesCopied += 1;
    return `/uploads/products/${productId}/${index}.webp`;
  } catch (error: any) {
    stats.productImagesFailed += 1;
    logError(`Image: ${src}`, `Ошибка копирования: ${error.message}`);
    return null;
  }
};

/**
 * Определяет категорию товара по пути файла и названию товара
 */
const resolveCategoryForProduct = (
  relativeFile: string,
  productName?: string,
): Category | undefined => {
  // Сначала пробуем определить по пути файла
  const dir = path.posix.dirname(relativeFile.replace(/\\/g, '/'));
  if (dir && dir !== '.') {
    const segments = dir.split('/');
    for (let i = segments.length; i > 0; i -= 1) {
      const candidate = segments.slice(0, i).join('/');
      const category = categoryIndexByPath.get(candidate);
      if (category) return category;
    }
  }
  
  // Если не нашли по пути, пробуем определить по названию товара
  if (productName) {
    const nameLower = productName.toLowerCase();
    
    // IP-камеры
    if (
      nameLower.includes('ip-камера') ||
      nameLower.includes('ip камера') ||
      nameLower.includes('ip camera') ||
      nameLower.includes('ds-i') ||
      nameLower.includes('hikvision ip') ||
      (nameLower.includes('камера') && (nameLower.includes('ip') || nameLower.includes('сетевая')))
    ) {
      return categoryIndexBySlug.get('ip-oborudovanie');
    }
    
    // Видеорегистраторы
    if (
      nameLower.includes('видеорегистратор') ||
      nameLower.includes('nvr') ||
      nameLower.includes('dvr') ||
      nameLower.includes('регистратор') ||
      nameLower.includes('ds-7') ||
      nameLower.includes('ds-7') ||
      nameLower.includes('ds-h')
    ) {
      return categoryIndexBySlug.get('videonablyudenye');
    }
    
    // Кабели
    if (
      nameLower.includes('кабель') ||
      nameLower.includes('cable') ||
      nameLower.includes('провод') ||
      nameLower.includes('кабель витая пара') ||
      nameLower.includes('коаксиальный')
    ) {
      return categoryIndexBySlug.get('aksessuary');
    }
    
    // Аксессуары
    if (
      nameLower.includes('аксессуар') ||
      nameLower.includes('кронштейн') ||
      nameLower.includes('блок питания') ||
      nameLower.includes('адаптер') ||
      nameLower.includes('разветвитель')
    ) {
      return categoryIndexBySlug.get('aksessuary');
    }
    
    // TVI-камеры
    if (
      nameLower.includes('tvi') ||
      nameLower.includes('тви') ||
      nameLower.includes('аналоговая камера') ||
      nameLower.includes('ds-2cd')
    ) {
      return categoryIndexBySlug.get('hd-tvi-oborudovanie');
    }
    
    // Домофония
    if (
      nameLower.includes('домофон') ||
      nameLower.includes('видеодомофон') ||
      nameLower.includes('панель вызова')
    ) {
      return categoryIndexBySlug.get('domofoniya');
    }
  }
  
  return undefined;
};

const findManufacturerByName = async (name: string) => {
  try {
    const repo = AppDataSource.getRepository(Manufacturer);
    const slug = toSlug(name);
    const { entity } = await upsertBySlug(repo, slug, {
      name,
      slug,
      isActive: true,
    });
    return entity;
  } catch (error: any) {
    logError(`Manufacturer: ${name}`, `Ошибка поиска/создания: ${error.message}`);
    return undefined;
  }
};

/**
 * Улучшенная функция парсинга товара из HTML
 */
const parseProductFromHtml = (html: string, filePath: string) => {
  const $ = cheerio.load(html);

  try {
    // Парсинг названия (ищем в разных местах)
    const name =
      $('h1.product-title').text().trim() ||
      $('h1').first().text().trim() ||
      $('.product-name').text().trim() ||
      $('.product h1').first().text().trim() ||
      path.parse(filePath).name;

    if (!name || name.length < 3) {
      return null;
    }

    // Парсинг артикула (ищем в разных местах)
    const sku =
      cleanText(
        $('.product-sku').text().replace(/Артикул[:\s]*/i, '').trim() ||
          $('.sku').text().trim() ||
          $('li:contains("Модель") .value').text() ||
          $('li:contains("Артикул") .value').text() ||
          $('span:contains("Артикул")').next().text().trim() ||
          $('.product-info .model').text(),
      ) || null;

    // Генерация SKU если не найден
    const finalSku = sku || generateSku(name);

    // ФИЛЬТРАЦИЯ: Проверяем, что это товар, а не статья/новость/политика
    const fileName = path.parse(filePath).name.toLowerCase();
    const excludedKeywords = [
      'статья', 'article', 'новость', 'news', 'блог', 'blog',
      'политика', 'policy', 'privacy', 'конфиденциальность',
      'доставка', 'delivery', 'контакты', 'contacts', 'about',
      'о-нас', 'about-us', 'условия', 'terms', 'правила', 'rules',
      'гарантия', 'warranty', 'возврат', 'return', 'обмен', 'exchange',
      'как-выбрать', 'как-подключить', 'инструкция', 'instruction',
      'sitemap', 'карта-сайта', 'login', 'вход', 'регистрация', 'register',
    ];
    
    // Проверяем название файла и содержимое на наличие исключающих ключевых слов
    const isExcluded = excludedKeywords.some(keyword => 
      fileName.includes(keyword) || 
      name.toLowerCase().includes(keyword)
    );
    
    if (isExcluded) {
      return null; // Пропускаем не-товары
    }

    // Парсинг цены (ищем в разных местах)
    const priceText =
      $('.product-price').text() ||
      $('.price-new').first().text() ||
      $('.price').first().text() ||
      $('span:contains("₽")').first().text() ||
      '';
    const price = parsePrice(priceText) ?? 0;
    
    // ФИЛЬТРАЦИЯ: Товар должен иметь цену > 0 или SKU/артикул
    // Если нет ни цены, ни SKU - это скорее всего не товар
    if (price === 0 && !sku && !finalSku) {
      // Проверяем наличие элементов товара на странице
      const hasProductElements = 
        $('.product-price, .price-new, .price').length > 0 ||
        $('.product-sku, .sku, [itemprop="sku"]').length > 0 ||
        $('.product-info, .product-description, #tab-description').length > 0;
      
      if (!hasProductElements) {
        return null; // Пропускаем, если нет признаков товара
      }
    }

    // Парсинг описания (полное)
    const description =
      $('#tab-description').html() ||
      $('.product-description').html() ||
      $('.description').html() ||
      $('.tab-content .description').html() ||
      '';

    // Парсинг краткого описания
    const shortDescription =
      cleanText($('.product-info p').first().text()) ||
      cleanText($('.short-description').text()) ||
      '';

    // Парсинг характеристик (таблица)
    const attributeTable: Record<string, string> = {};
    $('#tab-specification tr, .product-specs tr, .specifications tr').each(
      (_idx, el) => {
        const key = cleanText($(el).find('td').first().text());
        const value = cleanText($(el).find('td').last().text());
        if (key && value && key !== value) {
          attributeTable[key] = value;
        }
      },
    );

    // Парсинг изображений (ищем в разных местах)
    const imageUrls = new Set<string>();
    $(
      '.image img, .product-image img, .carousel img, .gallery img, .product-gallery img, #image img',
    ).each((_idx, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && !src.includes('placeholder') && !src.includes('no-image')) {
        imageUrls.add(src);
      }
    });

    // Парсинг категории из breadcrumbs или пути файла
    const categoryName =
      cleanText($('.breadcrumb li').last().prev().text()) ||
      cleanText($('.breadcrumbs a').last().text()) ||
      null;

    return {
      name,
      sku: finalSku,
      price,
      description: description || null,
      shortDescription: shortDescription || null,
      attributes: Object.keys(attributeTable).length > 0 ? attributeTable : null,
      images: Array.from(imageUrls),
      categoryName,
      filePath,
    };
  } catch (error: any) {
    throw new Error(`Ошибка парсинга: ${error.message}`);
  }
};

/**
 * Генерация SKU если не найден
 */
const generateSku = (name: string): string => {
  const base = name
    .substring(0, 20)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `SKU-${Date.now().toString().slice(-6)}`;
};

/**
 * Генерация slug из названия и SKU
 */
const generateSlug = (name: string, sku: string): string => {
  const nameSlug = toSlug(name);
  const skuSlug = toSlug(sku).toLowerCase();
  return `${nameSlug}-${skuSlug}`.substring(0, 160);
};

const migrateProducts = async () => {
  console.log('\n📦 Миграция товаров...');
  const productRepo = AppDataSource.getRepository(Product);
  const productImageRepo = AppDataSource.getRepository(ProductImage);

  try {
    // НОВЫЙ КОД: Ищем в корне + в подпапках
    const productFiles = await fg(
      [
        '*.html',  // ← ДОБАВИЛИ: поиск в корне
        ...CATEGORY_ROOTS.map((root) => `${root}/**/*.html`), // + в подпапках
      ],
      {
        cwd: SOURCE_DIR,
        onlyFiles: true,
        ignore: [
          '**/index*.html',
          '**/brand_*.html',
          '**/category_*.html',
          'index*.html',      // ← ДОБАВИЛИ: исключить index в корне
          'brand_*.html',     // ← ДОБАВИЛИ: исключить brand в корне
          'category_*.html',  // ← ДОБАВИЛИ: исключить category в корне
          '**/articles/**',   // Статьи
          '**/news/**',        // Новости
          '**/blog/**',        // Блог
          '**/policy/**',      // Политика конфиденциальности
          '**/login/**',        // Страницы входа
          '**/contact-us/**',  // Контакты
          '**/about*',         // О нас
          '**/delivery*',      // Доставка
          '**/sitemap/**',     // Карта сайта
          '**/faq/**',         // FAQ
          '**/*статья*.html',  // Статьи по названию
          '**/*новость*.html', // Новости по названию
          '**/*политика*.html', // Политика по названию
        ],
      },
    );

    console.log(`   Найдено HTML файлов товаров: ${productFiles.length}\n`);

    for (let i = 0; i < productFiles.length; i++) {
      const relativeFile = productFiles[i];
      const filePath = path.join(SOURCE_DIR, relativeFile);

      try {
        const html = readHtml(filePath);
        const productData = parseProductFromHtml(html, filePath);

        if (!productData) {
          stats.productsSkipped += 1;
          continue;
        }

        // Найти или создать категорию (передаем также название товара для лучшего определения)
        let category = resolveCategoryForProduct(relativeFile, productData.name);
        if (!category && productData.categoryName) {
          try {
            const categoryRepo = AppDataSource.getRepository(Category);
            const categorySlug = toSlug(productData.categoryName);
            category = await categoryRepo.findOne({ where: { slug: categorySlug } });
            if (!category) {
              category = categoryRepo.create({
                name: productData.categoryName,
                slug: categorySlug,
                isActive: true,
              });
              category = await categoryRepo.save(category);
              stats.categoriesCreated += 1;
            }
          } catch (error: any) {
            logError(relativeFile, `Ошибка создания категории: ${error.message}`);
          }
        }

        // Найти производителя из HTML
        let manufacturer;
        try {
          const $ = cheerio.load(html);
          const manufacturerName = cleanText(
            $('li:contains("Производитель") a').text() ||
              $('.manufacturer a').text() ||
              '',
          );
          manufacturer = manufacturerName
            ? await findManufacturerByName(manufacturerName)
            : undefined;
        } catch (error: any) {
          logError(relativeFile, `Ошибка поиска производителя: ${error.message}`);
        }

        // Генерация slug
        const slug = generateSlug(productData.name, productData.sku);

        // Проверка существования товара
        let existing: Product | null = null;
        try {
          existing = await productRepo.findOne({
            where: { slug },
            relations: ['images'],
          });
        } catch (error: any) {
          logError(relativeFile, `Ошибка поиска товара: ${error.message}`);
        }

        // Создать или обновить товар
        const payload: Partial<Product> = {
          name: productData.name,
          slug,
          sku: productData.sku,
          price: productData.price,
          currency: 'RUB',
          shortDescription: productData.shortDescription || null,
          description: productData.description || null,
          manufacturer: manufacturer || null,
          category: category || null,
          attributes: productData.attributes || null,
          stock: 10, // По умолчанию
          isActive: true,
        };

        let product: Product;
        if (existing) {
          productRepo.merge(existing, payload);
          product = existing;
          stats.productsUpdated += 1;
        } else {
          product = productRepo.create(payload);
          product = await productRepo.save(product);
          stats.productsCreated += 1;
        }

        // Копировать и оптимизировать изображения
        if (productData.images.length === 0) {
          stats.productsWithoutImages += 1;
        } else {
          try {
            // Удалить старые изображения если обновляем
            if (existing?.images?.length) {
              await productImageRepo.remove(existing.images);
            }

            const persistedImages: ProductImage[] = [];
            for (let idx = 0; idx < productData.images.length; idx++) {
              const imageUrl = productData.images[idx];
              const savedPath = await copyAndOptimizeImage(imageUrl, product.id, idx);
              if (savedPath) {
                const image = productImageRepo.create({
                  url: savedPath,
                  alt: productData.name,
                  sortOrder: idx,
                  product,
                });
                persistedImages.push(image);
              }
            }

            if (persistedImages.length > 0) {
              await productImageRepo.save(persistedImages);
            }
          } catch (error: any) {
            logError(relativeFile, `Ошибка обработки изображений: ${error.message}`);
          }
        }

        // Проверка описания
        if (!productData.description && !productData.shortDescription) {
          stats.productsWithoutDescription += 1;
        }

        // Прогресс
        const progress = ((i + 1) / productFiles.length) * 100;
        process.stdout.write(
          `\r   Обработка: ${i + 1}/${productFiles.length} (${progress.toFixed(1)}%) - ${productData.name.substring(0, 50)}`,
        );
      } catch (error: any) {
        stats.errors += 1;
        const errorMsg = error.message || String(error);
        logError(relativeFile, errorMsg);
        process.stdout.write(`\r   ❌ Ошибка: ${relativeFile} - ${errorMsg.substring(0, 50)}\n`);
      }
    }
    
    console.log('\n');
  } catch (error: any) {
    const errorMsg = `Критическая ошибка миграции товаров: ${error.message}`;
    logError('migrateProducts', errorMsg);
    throw new Error(errorMsg);
  }
};

async function main() {
  // Проверка SOURCE_DIR
  if (!SOURCE_DIR || !fs.existsSync(SOURCE_DIR)) {
    console.error('❌ ОШИБКА: Папка hiwatch_site_copy не найдена!');
    console.error(`   Проверенные пути:`);
    possibleSourceDirs.forEach(dir => {
      if (dir) {
        console.error(`   - ${dir} ${fs.existsSync(dir) ? '✅' : '❌'}`);
      }
    });
    console.error(`\n   Установите переменную окружения HTML_SOURCE_DIR или поместите hiwatch_site_copy в правильное место.`);
    process.exit(1);
  }
  
  console.log(`📁 Исходная папка: ${SOURCE_DIR}`);
  
  // Проверка наличия папок категорий
  console.log(`\n📂 Проверка папок категорий:`);
  for (const root of CATEGORY_ROOTS) {
    const fullPath = path.join(SOURCE_DIR, root);
    const exists = fs.existsSync(fullPath);
    console.log(`   ${exists ? '✅' : '❌'} ${root}: ${exists ? 'найдена' : 'не найдена'}`);
    if (exists) {
      const files = fs.readdirSync(fullPath, { withFileTypes: true });
      const htmlFiles = files.filter(f => f.isFile() && f.name.endsWith('.html')).length;
      const dirs = files.filter(f => f.isDirectory()).length;
      console.log(`      - HTML файлов: ${htmlFiles}, папок: ${dirs}`);
    }
  }
  console.log('');
  console.log('🔌 Подключение к базе данных...');

  try {
    await AppDataSource.initialize();
    console.log('✅ База данных подключена');

    ensureDir(UPLOADS_DIR);
    ensureDir(PRODUCTS_UPLOADS_DIR);

    console.log('🚀 Начало миграции...\n');
    
    await migrateManufacturers();
    await migrateCategories();
    await migrateProducts();

    // Вывести детальный отчет
    console.log('\n' + '='.repeat(60));
    console.log('📊 ОТЧЕТ О МИГРАЦИИ');
    console.log('='.repeat(60));
    console.log(`\n📦 ТОВАРЫ:`);
    console.log(
      `   Всего файлов найдено: ${stats.productsCreated + stats.productsUpdated + stats.productsSkipped}`,
    );
    console.log(`   ✅ Успешно создано: ${stats.productsCreated}`);
    console.log(`   🔄 Обновлено: ${stats.productsUpdated}`);
    console.log(`   ⏭️  Пропущено: ${stats.productsSkipped}`);
    console.log(`   ❌ Ошибок: ${stats.errors}`);
    console.log(`   📷 Товаров без изображений: ${stats.productsWithoutImages}`);
    console.log(`   📝 Товаров без описания: ${stats.productsWithoutDescription}`);

    console.log(`\n🏭 ПРОИЗВОДИТЕЛИ:`);
    console.log(`   ✅ Создано: ${stats.manufacturersCreated}`);
    console.log(`   🔄 Обновлено: ${stats.manufacturersUpdated}`);

    console.log(`\n📂 КАТЕГОРИИ:`);
    console.log(`   ✅ Создано: ${stats.categoriesCreated}`);
    console.log(`   🔄 Обновлено: ${stats.categoriesUpdated}`);

    console.log(`\n🖼️  ИЗОБРАЖЕНИЯ:`);
    console.log(`   ✅ Скопировано: ${stats.productImagesCopied}`);
    console.log(`   ❌ Ошибок: ${stats.productImagesFailed}`);

    if (stats.errorDetails.length > 0) {
      console.log(`\n❌ ДЕТАЛИ ОШИБОК (первые 10):`);
      stats.errorDetails.slice(0, 10).forEach(({ file, error }) => {
        console.log(`   - ${file}: ${error}`);
      });
      if (stats.errorDetails.length > 10) {
        console.log(`   ... и еще ${stats.errorDetails.length - 10} ошибок`);
      }
      console.log(`\n📝 Полный лог ошибок сохранен в: ${ERROR_LOG_FILE}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Миграция завершена!');
    console.log('='.repeat(60) + '\n');
  } catch (error: any) {
    console.error('\n❌ Критическая ошибка миграции:', error);
    logError('main', `Критическая ошибка: ${error.message}`);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('🔌 Соединение с базой данных закрыто');
  }
}

// Экспорт функции для использования в других скриптах
export async function migrateFromHtmlDump() {
  return main();
}

// Запуск при прямом вызове скрипта
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
