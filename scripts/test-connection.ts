/**
 * Скрипт для тестирования подключения к базе данных и загрузки всех сущностей
 * Использование: pnpm tsx scripts/test-connection.ts
 */

import { config as dotenvConfig } from 'dotenv';
import * as path from 'path';

// Загрузить .env ПЕРВЫМ - ДО всех импортов
dotenvConfig({
  path: process.env.DOTENV_PATH || path.join(__dirname, '../.env'),
});

// Устанавливаем флаг для использования явных entities ДО импорта TypeORM
process.env.TYPEORM_USE_EXPLICIT_ENTITIES = 'true';

// Импорт TypeORM ПОСЛЕ загрузки .env
import { DataSource } from 'typeorm';

// Импорты entities - должны быть после загрузки .env и установки флага
// ВАЖНО: Используем обычный import, не import type
// Импортируем в правильном порядке: сначала базовые, потом зависимые
import { SiteSetting } from '../apps/backend/src/modules/settings/entities/site-setting.entity';
import { Manufacturer } from '../apps/backend/src/modules/catalog/manufacturers/entities/manufacturer.entity';
import { Category } from '../apps/backend/src/modules/catalog/categories/entities/category.entity';
import { User } from '../apps/backend/src/modules/users/entities/user.entity';
import { Product } from '../apps/backend/src/modules/catalog/products/entities/product.entity';
import { ProductImage } from '../apps/backend/src/modules/catalog/products/entities/product-image.entity';
import { Order } from '../apps/backend/src/modules/orders/entities/order.entity';
import { OrderItem } from '../apps/backend/src/modules/orders/entities/order-item.entity';
import { dataSourceConfig } from '../apps/backend/src/config/database.config';

// ДИАГНОСТИКА: Явное логирование SiteSetting (как указано в ТЗ)
console.log('🔍 ФИНАЛЬНАЯ ПРОВЕРКА ИМПОРТА SiteSetting:');
console.log({ SiteSetting });
console.log('   Type:', typeof SiteSetting);
console.log('   Is Function:', typeof SiteSetting === 'function');
console.log('   Name:', SiteSetting?.name || 'N/A');
console.log('   Is Undefined:', SiteSetting === undefined);
console.log('');

// ДИАГНОСТИКА: Логирование всех импортированных сущностей
console.log('🔍 Диагностика импорта всех сущностей:');
console.log('   SiteSetting:', typeof SiteSetting, SiteSetting ? '✅' : '❌', SiteSetting?.name || 'N/A');
console.log('   Manufacturer:', typeof Manufacturer, Manufacturer ? '✅' : '❌', Manufacturer?.name || 'N/A');
console.log('   Category:', typeof Category, Category ? '✅' : '❌', Category?.name || 'N/A');
console.log('   User:', typeof User, User ? '✅' : '❌', User?.name || 'N/A');
console.log('   Product:', typeof Product, Product ? '✅' : '❌', Product?.name || 'N/A');
console.log('   ProductImage:', typeof ProductImage, ProductImage ? '✅' : '❌', ProductImage?.name || 'N/A');
console.log('   Order:', typeof Order, Order ? '✅' : '❌', Order?.name || 'N/A');
console.log('   OrderItem:', typeof OrderItem, OrderItem ? '✅' : '❌', OrderItem?.name || 'N/A');
console.log('');

// Проверка, что все entities импортированы корректно (не undefined)
// Это критично для предотвращения ошибки "Cannot read properties of undefined"
const allEntities = [
  SiteSetting,    // Базовые без зависимостей
  Manufacturer,   // Базовые без зависимостей
  Category,       // Базовые без зависимостей
  User,           // Базовые без зависимостей
  Product,        // Зависит от Category, Manufacturer
  ProductImage,   // Зависит от Product
  Order,          // Зависит от User
  OrderItem,      // Зависит от Order, Product
];

// Валидация entities перед созданием DataSource
const entityNames = ['SiteSetting', 'Manufacturer', 'Category', 'User', 'Product', 'ProductImage', 'Order', 'OrderItem'];

// Детальное логирование для диагностики
console.log('🔍 Детальная проверка импорта сущностей...');
const entityChecks = allEntities.map((entity, index) => {
  const name = entityNames[index];
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

const undefinedEntities = entityChecks.filter(({ isUndefined }) => isUndefined);

if (undefinedEntities.length > 0) {
  console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА: Некоторые сущности не импортированы!');
  console.error('   Это может быть вызвано:');
  console.error('   1. Неправильным путем импорта');
  console.error('   2. Проблемой с обработкой декораторов TypeScript');
  console.error('   3. Circular dependency');
  console.error('   4. Проблемой с TSX/TypeScript компиляцией');
  console.error('\n   Детальная информация:');
  undefinedEntities.forEach(({ name, type }) => {
    console.error(`   - ${name}: type=${type}`);
  });
  console.error('\n   Проверьте импорты в файлах сущностей.\n');
  process.exit(1);
}

console.log('✅ Все сущности импортированы корректно\n');

// Создать DataSource
const AppDataSource = new DataSource({
  ...dataSourceConfig,
  entities: allEntities,
  synchronize: false,
  logging: ['error', 'warn', 'schema'],
});

async function testConnection() {
  console.log('🔌 Тестирование подключения к базе данных...\n');

  try {
    // 1. Инициализация подключения
    console.log('📡 Шаг 1: Инициализация DataSource...');
    await AppDataSource.initialize();
    console.log('✅ DataSource успешно инициализирован\n');

    // 2. Проверка версии PostgreSQL
    console.log('📡 Шаг 2: Проверка версии PostgreSQL...');
    const versionResult = await AppDataSource.query('SELECT version()');
    console.log(`✅ Версия PostgreSQL: ${versionResult[0].version.split(',')[0]}\n`);

    // 3. Проверка текущей схемы
    console.log('📡 Шаг 3: Проверка текущей схемы...');
    const schemaResult = await AppDataSource.query('SELECT * FROM current_schema()');
    console.log(`✅ Текущая схема: ${schemaResult[0].current_schema}\n`);

    // 4. Проверка загрузки всех сущностей
    console.log('📡 Шаг 4: Проверка загрузки сущностей...');
    const entityMetadatas = AppDataSource.entityMetadatas;
    console.log(`✅ Загружено сущностей: ${entityMetadatas.length}`);
    entityMetadatas.forEach((metadata) => {
      console.log(`   - ${metadata.name} (таблица: ${metadata.tableName})`);
    });
    console.log('');

    // 5. Проверка структуры таблиц (если они существуют)
    console.log('📡 Шаг 5: Проверка существующих таблиц...');
    const tables = await AppDataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log(`✅ Найдено таблиц: ${tables.length}`);
    if (tables.length > 0) {
      tables.forEach((table: { table_name: string }) => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log('   ⚠️  Таблицы не найдены. Запустите synchronize: true или миграции.');
    }
    console.log('');

    // 6. Проверка связей между сущностями
    console.log('📡 Шаг 6: Проверка связей между сущностями...');
    let relationsCount = 0;
    entityMetadatas.forEach((metadata) => {
      const relations = metadata.relations || [];
      relationsCount += relations.length;
      if (relations.length > 0) {
        console.log(`   ${metadata.name}:`);
        relations.forEach((relation) => {
          const typeName = typeof relation.type === 'function' ? relation.type.name : String(relation.type);
          console.log(`     - ${relation.propertyName} → ${typeName}`);
        });
      }
    });
    console.log(`✅ Всего связей: ${relationsCount}\n`);

    // 7. Проверка типов колонок
    console.log('📡 Шаг 7: Проверка типов колонок...');
    let issuesFound = false;
    entityMetadatas.forEach((metadata) => {
      metadata.columns.forEach((column) => {
        // Проверка nullable полей без явного типа
        if (column.isNullable && !column.type) {
          console.log(`   ⚠️  ${metadata.name}.${column.propertyName}: nullable без явного типа`);
          issuesFound = true;
        }
        // Проверка строковых полей без типа
        if (column.type === 'varchar' && !column.length) {
          console.log(`   ⚠️  ${metadata.name}.${column.propertyName}: varchar без длины`);
          issuesFound = true;
        }
      });
    });
    if (!issuesFound) {
      console.log('✅ Все колонки имеют корректные типы\n');
    } else {
      console.log('');
    }

    // 8. Тест простого запроса
    console.log('📡 Шаг 8: Тест простого запроса...');
    try {
      const result = await AppDataSource.query('SELECT 1 as test');
      console.log(`✅ Запрос выполнен успешно: ${JSON.stringify(result[0])}\n`);
    } catch (error: any) {
      console.log(`❌ Ошибка выполнения запроса: ${error.message}\n`);
    }

    console.log('='.repeat(60));
    console.log('🎉 Все тесты пройдены успешно!');
    console.log('='.repeat(60));
    console.log('\n📊 Статистика:');
    console.log(`   Сущностей: ${entityMetadatas.length}`);
    console.log(`   Таблиц в БД: ${tables.length}`);
    console.log(`   Связей: ${relationsCount}`);
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Ошибка при тестировании подключения:');
    console.error(`   Тип: ${error.constructor.name}`);
    console.error(`   Сообщение: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack.split('\n').slice(0, 5).join('\n')}`);
    }
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Соединение с базой данных закрыто');
    }
  }
}

// Запуск теста
if (require.main === module) {
  testConnection()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { testConnection };

