import { config as dotenvConfig } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { dataSourceConfig } from '../apps/backend/src/config/database.config';

dotenvConfig({
  path: process.env.DOTENV_PATH || '.env',
});

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message?: string;
  details?: any;
}

const results: TestResult[] = [];

function addResult(name: string, status: 'PASS' | 'FAIL' | 'SKIP', message?: string, details?: any) {
  results.push({ name, status, message, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${icon} ${name}${message ? `: ${message}` : ''}`);
}

let dataSource: DataSource;

async function testDatabaseConnection() {
  try {
    dataSource = new DataSource(dataSourceConfig);
    await dataSource.initialize();
    addResult('Подключение к БД', 'PASS', 'Успешно подключено');
    return true;
  } catch (error: any) {
    addResult('Подключение к БД', 'FAIL', `Ошибка: ${error?.message || 'Неизвестная ошибка'}`);
    return false;
  }
}

async function testMigrationData() {
  try {
    const queryRunner = dataSource.createQueryRunner();

    // Проверка количества товаров
    const productsResult = await queryRunner.query('SELECT COUNT(*) as count FROM products');
    const productsCount = parseInt(productsResult[0].count);
    addResult('Количество товаров', productsCount > 0 ? 'PASS' : 'FAIL', `${productsCount} товаров`);

    // Проверка количества изображений
    const imagesResult = await queryRunner.query('SELECT COUNT(*) as count FROM product_images');
    const imagesCount = parseInt(imagesResult[0].count);
    addResult('Количество изображений', imagesCount > 0 ? 'PASS' : 'FAIL', `${imagesCount} изображений`);

    // Проверка товаров без изображений
    const productsWithoutImagesResult = await queryRunner.query(`
      SELECT COUNT(*) as count 
      FROM products p 
      LEFT JOIN product_images pi ON p.id = pi.product_id 
      WHERE pi.id IS NULL
    `);
    const productsWithoutImages = parseInt(productsWithoutImagesResult[0].count);
    addResult(
      'Товары без изображений',
      productsWithoutImages === 0 ? 'PASS' : 'FAIL',
      `${productsWithoutImages} товаров без изображений`,
    );

    // Проверка товаров без описания
    const productsWithoutDescriptionResult = await queryRunner.query(`
      SELECT COUNT(*) as count 
      FROM products 
      WHERE description IS NULL OR description = ''
    `);
    const productsWithoutDescription = parseInt(productsWithoutDescriptionResult[0].count);
    addResult(
      'Товары без описания',
      productsWithoutDescription === 0 ? 'PASS' : 'FAIL',
      `${productsWithoutDescription} товаров без описания`,
    );

    // Проверка категорий
    const categoriesResult = await queryRunner.query('SELECT COUNT(*) as count FROM categories');
    const categoriesCount = parseInt(categoriesResult[0].count);
    addResult('Количество категорий', categoriesCount > 0 ? 'PASS' : 'FAIL', `${categoriesCount} категорий`);

    // Проверка производителей
    const manufacturersResult = await queryRunner.query('SELECT COUNT(*) as count FROM manufacturers');
    const manufacturersCount = parseInt(manufacturersResult[0].count);
    addResult(
      'Количество производителей',
      manufacturersCount > 0 ? 'PASS' : 'FAIL',
      `${manufacturersCount} производителей`,
    );

    // Проверка товаров с изображениями
    const productsWithImagesResult = await queryRunner.query(`
      SELECT COUNT(DISTINCT p.id) as count 
      FROM products p 
      INNER JOIN product_images pi ON p.id = pi.product_id
    `);
    const productsWithImages = parseInt(productsWithImagesResult[0].count);
    addResult(
      'Товары с изображениями',
      productsWithImages > 0 ? 'PASS' : 'FAIL',
      `${productsWithImages} товаров с изображениями`,
    );

    await queryRunner.release();

    return {
      productsCount,
      imagesCount,
      productsWithoutImages,
      productsWithoutDescription,
      categoriesCount,
      manufacturersCount,
      productsWithImages,
    };
  } catch (error: any) {
    addResult('Проверка данных миграции', 'FAIL', `Ошибка: ${error?.message || 'Неизвестная ошибка'}`);
    return null;
  }
}

async function testProductImages() {
  try {
    const queryRunner = dataSource.createQueryRunner();

    // Получаем несколько товаров с изображениями
    const productsResult = await queryRunner.query(`
      SELECT p.id, pi.url 
      FROM products p 
      LEFT JOIN product_images pi ON p.id = pi.product_id 
      LIMIT 20
    `);

    let imagesFound = 0;
    let imagesMissing = 0;
    const missingPaths: string[] = [];

    for (const row of productsResult) {
      if (row.url) {
        const imagePath = path.join(
          __dirname,
          '..',
          'apps',
          'frontend',
          'public',
          row.url.replace(/^\//, ''),
        );
        if (fs.existsSync(imagePath)) {
          imagesFound++;
        } else {
          imagesMissing++;
          if (missingPaths.length < 5) {
            missingPaths.push(row.url);
          }
        }
      }
    }

    addResult(
      'Проверка файлов изображений',
      imagesMissing === 0 ? 'PASS' : 'FAIL',
      `Найдено: ${imagesFound}, Отсутствует: ${imagesMissing}`,
      imagesMissing > 0 ? { missingPaths } : undefined,
    );

    await queryRunner.release();

    return { imagesFound, imagesMissing };
  } catch (error: any) {
    addResult('Проверка изображений', 'FAIL', `Ошибка: ${error?.message || 'Неизвестная ошибка'}`);
    return null;
  }
}

async function testProductQueries() {
  try {
    const queryRunner = dataSource.createQueryRunner();

    // Тест 1: Получение всех активных товаров
    const allProductsResult = await queryRunner.query(`
      SELECT COUNT(*) as count 
      FROM products 
      WHERE "isActive" = true
    `);
    const allProductsCount = parseInt(allProductsResult[0].count);
    addResult('Запрос активных товаров', 'PASS', `Найдено ${allProductsCount} товаров`);

    // Тест 2: Поиск по slug
    const slugResult = await queryRunner.query(`
      SELECT slug 
      FROM products 
      WHERE "isActive" = true 
      LIMIT 1
    `);
    if (slugResult.length > 0) {
      const productBySlugResult = await queryRunner.query(
        `SELECT id FROM products WHERE slug = $1`,
        [slugResult[0].slug],
      );
      addResult(
        'Поиск по slug',
        productBySlugResult.length > 0 ? 'PASS' : 'FAIL',
        productBySlugResult.length > 0 ? 'Товар найден' : 'Товар не найден',
      );
    }

    // Тест 3: Фильтр по производителю
    const productsWithManufacturerResult = await queryRunner.query(`
      SELECT COUNT(*) as count 
      FROM products p 
      LEFT JOIN manufacturers m ON p."manufacturerId" = m.id 
      WHERE m.id IS NOT NULL
    `);
    const productsWithManufacturer = parseInt(productsWithManufacturerResult[0].count);
    addResult(
      'Фильтр по производителю',
      productsWithManufacturer > 0 ? 'PASS' : 'FAIL',
      `Найдено ${productsWithManufacturer} товаров`,
    );

    // Тест 4: Фильтр по категории
    const productsWithCategoryResult = await queryRunner.query(`
      SELECT COUNT(*) as count 
      FROM products p 
      LEFT JOIN categories c ON p."categoryId" = c.id 
      WHERE c.id IS NOT NULL
    `);
    const productsWithCategory = parseInt(productsWithCategoryResult[0].count);
    addResult(
      'Фильтр по категории',
      productsWithCategory > 0 ? 'PASS' : 'FAIL',
      `Найдено ${productsWithCategory} товаров`,
    );

    await queryRunner.release();

    return true;
  } catch (error: any) {
    addResult('Проверка запросов товаров', 'FAIL', `Ошибка: ${error?.message || 'Неизвестная ошибка'}`);
    return false;
  }
}

async function testOrders() {
  try {
    const queryRunner = dataSource.createQueryRunner();
    const ordersResult = await queryRunner.query('SELECT COUNT(*) as count FROM orders');
    const ordersCount = parseInt(ordersResult[0].count);
    addResult('Проверка заказов', 'PASS', `Найдено ${ordersCount} заказов`);
    await queryRunner.release();
    return true;
  } catch (error: any) {
    addResult('Проверка заказов', 'FAIL', `Ошибка: ${error?.message || 'Неизвестная ошибка'}`);
    return false;
  }
}

async function generateReport() {
  const reportPath = path.join(__dirname, '..', 'TEST_REPORT.md');
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  const skipCount = results.filter((r) => r.status === 'SKIP').length;

  const report = `# ОТЧЕТ О ТЕСТИРОВАНИИ

**Дата:** ${new Date().toLocaleString('ru-RU')}

---

## 📊 СТАТИСТИКА ТЕСТОВ

- ✅ Пройдено: ${passCount}
- ❌ Провалено: ${failCount}
- ⏭️ Пропущено: ${skipCount}
- 📈 Успешность: ${passCount + failCount > 0 ? ((passCount / (passCount + failCount)) * 100).toFixed(1) : 0}%

---

## 📋 РЕЗУЛЬТАТЫ ТЕСТОВ

${results
  .map((r) => {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️';
    return `### ${icon} ${r.name}

${r.message || 'Тест выполнен'}

${r.details ? `\n**Детали:**\n\`\`\`json\n${JSON.stringify(r.details, null, 2)}\n\`\`\`` : ''}`;
  })
  .join('\n\n')}

---

## 🎯 ВЫВОДЫ

${failCount === 0 ? '✅ Все тесты пройдены успешно!' : `⚠️ Найдено ${failCount} проблем, требующих исправления.`}

---

## 📝 СЛЕДУЮЩИЕ ШАГИ

${failCount > 0 ? '1. Исправить найденные проблемы\n2. Повторить тестирование\n' : '1. Протестировать frontend функционал вручную\n2. Проверить работу API через curl/Postman\n3. Проверить работу корзины в браузере\n'}

---

**Статус:** ${failCount === 0 ? '✅ ГОТОВ К ИСПОЛЬЗОВАНИЮ' : '⚠️ ТРЕБУЮТСЯ ДОРАБОТКИ'}
`;

  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`\n📄 Отчет сохранен в: ${reportPath}`);
}

async function main() {
  console.log('🧪 Начало тестирования...\n');

  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log('\n❌ Не удалось подключиться к БД. Тестирование прервано.');
    await generateReport();
    process.exit(1);
  }

  // ТЕСТ 1: Миграция данных
  console.log('\n📦 ТЕСТ 1: Миграция данных');
  console.log('─'.repeat(50));
  const migrationData = await testMigrationData();

  // ТЕСТ 2: Изображения
  console.log('\n🖼️  ТЕСТ 2: Изображения товаров');
  console.log('─'.repeat(50));
  await testProductImages();

  // ТЕСТ 3: Запросы товаров
  console.log('\n🔍 ТЕСТ 3: Запросы товаров');
  console.log('─'.repeat(50));
  await testProductQueries();

  // ТЕСТ 4: Заказы
  console.log('\n📦 ТЕСТ 4: Заказы');
  console.log('─'.repeat(50));
  await testOrders();

  // Генерация отчета
  console.log('\n📊 Генерация отчета...');
  await generateReport();

  // Закрытие соединения
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
  }

  console.log('\n✅ Тестирование завершено!');
}

main().catch((error) => {
  console.error('❌ Ошибка при выполнении тестов:', error);
  process.exit(1);
});
