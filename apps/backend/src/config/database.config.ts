import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
// Явные импорты entities для TypeORM CLI
import { Manufacturer } from '../modules/catalog/manufacturers/entities/manufacturer.entity';
import { Category } from '../modules/catalog/categories/entities/category.entity';
import { Product } from '../modules/catalog/products/entities/product.entity';
import { ProductImage } from '../modules/catalog/products/entities/product-image.entity';
import { User } from '../modules/users/entities/user.entity';
import { Order } from '../modules/orders/entities/order.entity';
import { OrderItem } from '../modules/orders/entities/order-item.entity';
import { SiteSetting } from '../modules/settings/entities/site-setting.entity';
import { InstallationService } from '../modules/services/entities/installation-service.entity';

// Пути к entities и migrations
// Development: используем TypeScript файлы
// Production: используем скомпилированные JavaScript файлы из dist/
const entitiesPath = process.env.NODE_ENV === 'production' 
  ? __dirname + '/../modules/**/*.entity.js'
  : __dirname + '/../modules/**/*.entity.ts';

const migrationsPath = process.env.NODE_ENV === 'production'
  ? __dirname + '/../database/migrations/*.js'
  : __dirname + '/../database/migrations/*.ts';

// Явный список entities для TypeORM CLI (используется в миграциях)
// Важно: порядок имеет значение - сначала базовые entities, потом связанные
const entities = [
  // Базовые entities без зависимостей
  SiteSetting,
  Manufacturer,
  Category,
  // Entities с зависимостями от базовых
  Product,
  ProductImage,
  User,
  // Entities с зависимостями от других
  Order,
  OrderItem,
  // Услуги монтажа (независимая сущность)
  InstallationService,
];

const baseConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: +(process.env.DATABASE_PORT || 5432),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'video_shop',
  extra: {
    charset: 'utf8',
  },
  // Используем явные импорты для CLI, пути для NestJS
  entities: process.env.TYPEORM_USE_EXPLICIT_ENTITIES === 'true' ? entities : [entitiesPath],
  migrations: [migrationsPath],
  // WARNING: synchronize: true drops all data on restart! Use migrations in production.
  synchronize: false, // Changed from true to prevent data loss
  logging: process.env.NODE_ENV !== 'production',
};

export const databaseConfig: TypeOrmModuleOptions = {
  ...baseConfig,
  type: 'postgres',
  autoLoadEntities: true,
};

export const dataSourceConfig: DataSourceOptions = baseConfig;
