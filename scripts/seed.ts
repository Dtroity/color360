import { config as dotenvConfig } from 'dotenv';
import * as path from 'path';

// Загрузить .env ПЕРВЫМ - ДО всех импортов
dotenvConfig({
  path: process.env.DOTENV_PATH || path.join(__dirname, '../.env'),
});

// Устанавливаем флаг для использования явных entities ДО импорта TypeORM
process.env.TYPEORM_USE_EXPLICIT_ENTITIES = 'true';

// Импорт зависимостей ПОСЛЕ загрузки .env
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

// Импорты entities - должны быть после загрузки .env и установки флага
// ВАЖНО: Используем обычный import, не import type
// Импортируем в правильном порядке: сначала базовые, потом зависимые
// КРИТИЧНО: SiteSetting должен быть импортирован первым, так как он не имеет зависимостей

// Импорт всех entities - должны быть после загрузки .env и установки флага
// ВАЖНО: Используем обычный import, не import type
// Импортируем в правильном порядке: сначала базовые, потом зависимые
import { SiteSetting } from '../apps/backend/src/modules/settings/entities/site-setting.entity';
import { Manufacturer } from '../apps/backend/src/modules/catalog/manufacturers/entities/manufacturer.entity';
import { Category } from '../apps/backend/src/modules/catalog/categories/entities/category.entity';
import { User, UserRole } from '../apps/backend/src/modules/users/entities/user.entity';
import { Product } from '../apps/backend/src/modules/catalog/products/entities/product.entity';
import { ProductImage } from '../apps/backend/src/modules/catalog/products/entities/product-image.entity';
import { Order, OrderStatus } from '../apps/backend/src/modules/orders/entities/order.entity';
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
  
  // Дополнительная диагностика
  console.error('   Попытка прямого импорта SiteSetting:');
  try {
    const directImport = require('../apps/backend/src/modules/settings/entities/site-setting.entity');
    console.error(`   - require result:`, Object.keys(directImport || {}));
  } catch (e: any) {
    console.error(`   - require error: ${e.message}`);
  }
  
  process.exit(1);
}

console.log('✅ Все сущности импортированы корректно\n');

// Создать DataSource
const AppDataSource = new DataSource({
  ...dataSourceConfig,
  entities: allEntities,
  synchronize: false,
  logging: false,
});

async function seed() {
  console.log('🔌 Подключение к базе данных...');

  try {
    await AppDataSource.initialize();
    console.log('✅ База данных подключена\n');

    const manufacturerRepo = AppDataSource.getRepository(Manufacturer);
    const categoryRepo = AppDataSource.getRepository(Category);
    const userRepo = AppDataSource.getRepository(User);
    const siteSettingRepo = AppDataSource.getRepository(SiteSetting);

    console.log('🌱 Seeding database...\n');

    // 1. Создать производителей
    console.log('🏭 Создание производителей...');
    const manufacturers = [
      { name: 'HiWatch', slug: 'hiwatch', country: 'Китай', description: 'Производитель систем видеонаблюдения' },
      { name: 'Hikvision', slug: 'hikvision', country: 'Китай', description: 'Ведущий производитель систем видеонаблюдения' },
      { name: 'Dahua', slug: 'dahua', country: 'Китай', description: 'Производитель IP-камер и видеорегистраторов' },
      { name: 'Ajax Systems', slug: 'ajax-systems', country: 'Украина', description: 'Производитель систем безопасности' },
      { name: 'Uniview', slug: 'uniview', country: 'Китай', description: 'Производитель систем видеонаблюдения' },
      { name: 'EZVIZ', slug: 'ezviz', country: 'Китай', description: 'Производитель умных камер' },
      { name: 'Tiandy', slug: 'tiandy', country: 'Китай', description: 'Производитель систем безопасности' },
      { name: 'Beward', slug: 'beward', country: 'Китай', description: 'Производитель IP-камер' },
      { name: 'Kedacom', slug: 'kedacom', country: 'Китай', description: 'Производитель систем видеонаблюдения' },
      { name: 'Болид', slug: 'bolid', country: 'Россия', description: 'Российский производитель систем безопасности' },
    ];

    for (const data of manufacturers) {
      const existing = await manufacturerRepo.findOne({ where: { slug: data.slug } });
      if (!existing) {
        const manufacturer = manufacturerRepo.create({
          ...data,
          isActive: true,
        });
        await manufacturerRepo.save(manufacturer);
        console.log(`   ✅ Создан производитель: ${data.name}`);
      } else {
        console.log(`   ⏭️  Пропущен (уже существует): ${data.name}`);
      }
    }

    // 2. Создать категории
    console.log('\n📂 Создание категорий...');
    const categories = [
      { name: 'IP камеры', slug: 'ip-kamery', description: 'IP-камеры для систем видеонаблюдения' },
      { name: 'AHD камеры', slug: 'ahd-kamery', description: 'AHD камеры высокого разрешения' },
      { name: 'TVI камеры', slug: 'tvi-kamery', description: 'TVI камеры для аналоговых систем' },
      { name: 'Видеорегистраторы', slug: 'videoregistratory', description: 'Цифровые видеорегистраторы' },
      { name: 'Аксессуары', slug: 'aksessuary', description: 'Аксессуары для систем видеонаблюдения' },
      { name: 'Домофония', slug: 'domofoniya', description: 'Системы домофонии' },
      { name: 'Охранно-пожарная сигнализация', slug: 'ohranno-pozharnaya-signalizaciya', description: 'Системы охранно-пожарной сигнализации' },
    ];

    for (const data of categories) {
      const existing = await categoryRepo.findOne({ where: { slug: data.slug } });
      if (!existing) {
        const category = categoryRepo.create({
          ...data,
          isActive: true,
          sortOrder: 0,
        });
        await categoryRepo.save(category);
        console.log(`   ✅ Создана категория: ${data.name}`);
      } else {
        console.log(`   ⏭️  Пропущена (уже существует): ${data.name}`);
      }
    }

    // 3. Создать администратора
    console.log('\n👤 Создание пользователей...');
    const existingAdmin = await userRepo.findOne({ where: { email: 'admin@color360.ru' } });
    if (!existingAdmin) {
      const adminPassword = await bcrypt.hash('Admin123!', 10);
      const admin = userRepo.create({
        email: 'admin@color360.ru',
        passwordHash: adminPassword,
        role: UserRole.ADMIN,
        firstName: 'Администратор',
        lastName: 'Системы',
        isActive: true,
      });
      await userRepo.save(admin);
      console.log('   ✅ Создан администратор: admin@color360.ru / Admin123!');
    } else {
      console.log('   ⏭️  Администратор уже существует');
    }

    // 4. Создать тестового пользователя
    const existingUser = await userRepo.findOne({ where: { email: 'user@example.com' } });
    if (!existingUser) {
      const userPassword = await bcrypt.hash('User123!', 10);
      const user = userRepo.create({
        email: 'user@example.com',
        passwordHash: userPassword,
        role: UserRole.CUSTOMER,
        firstName: 'Тестовый',
        lastName: 'Пользователь',
        isActive: true,
      });
      await userRepo.save(user);
      console.log('   ✅ Создан тестовый пользователь: user@example.com / User123!');
    } else {
      console.log('   ⏭️  Тестовый пользователь уже существует');
    }

    // 5. Создать настройки сайта
    console.log('\n⚙️  Создание настроек сайта...');
    const settings = [
      {
        key: 'site_name',
        value: 'ИП Визе В.Н.',
        description: 'Название сайта',
      },
      {
        key: 'site_email',
        value: 'info@color360.ru',
        description: 'Email для связи',
      },
      {
        key: 'site_phone',
        value: '+7 (XXX) XXX-XX-XX',
        description: 'Телефон для связи',
      },
    ];

    for (const data of settings) {
      const existing = await siteSettingRepo.findOne({ where: { key: data.key } });
      if (!existing) {
        const setting = siteSettingRepo.create(data);
        await siteSettingRepo.save(setting);
        console.log(`   ✅ Создана настройка: ${data.key}`);
      } else {
        console.log(`   ⏭️  Пропущена (уже существует): ${data.key}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Seeding completed!');
    console.log('='.repeat(60));
    console.log('\n📋 Созданные данные:');
    console.log(`   🏭 Производителей: ${manufacturers.length}`);
    console.log(`   📂 Категорий: ${categories.length}`);
    console.log(`   👤 Пользователей: 2 (admin + user)`);
    console.log(`   ⚙️  Настроек: ${settings.length}`);
    console.log('\n🔑 Учетные данные:');
    console.log('   Администратор: admin@color360.ru / Admin123!');
    console.log('   Пользователь: user@example.com / User123!');
    console.log('\n');
  } catch (error: any) {
    console.error('\n❌ Ошибка seeding:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
    console.log('🔌 Соединение с базой данных закрыто');
  }
}

if (require.main === module) {
  seed()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { seed };

