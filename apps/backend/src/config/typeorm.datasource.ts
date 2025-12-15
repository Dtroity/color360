import { config as dotenvConfig } from 'dotenv';
import { DataSource } from 'typeorm';
import { dataSourceConfig } from './database.config';
console.log(">>> LOADED TYPEORM CONFIG FROM:", __filename);

dotenvConfig({
  path: process.env.DOTENV_PATH || '.env',
});

// Обязательная строчка — она помогает CLI использовать entities из config
process.env.TYPEORM_USE_EXPLICIT_ENTITIES = 'true';

const dataSource = new DataSource({
  ...dataSourceConfig,
  entities: [
    __dirname + '/../modules/**/entities/*.entity.{ts,js}',
  ],
  migrations: [
    __dirname + '/../migrations/*.{ts,js}',
  ],
});

export default dataSource;
