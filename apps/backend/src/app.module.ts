import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { databaseConfig } from './config/database.config';

import { EmailModule } from './modules/email/email.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { FilesModule } from './modules/files/files.module';
import { ProductsModule } from './modules/catalog/products/products.module';
import { CategoriesModule } from './modules/catalog/categories/categories.module';
import { ManufacturersModule } from './modules/catalog/manufacturers/manufacturers.module';
import { PopularDevicesModule } from './modules/catalog/popular-devices/popular-devices.module';
import { OrdersModule } from './modules/orders/orders.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ServicesModule } from './modules/services/services.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Статика: /uploads и фронтенд / (исключаем /api*)
    // Примечание: основная раздача статики настроена в main.ts через useStaticAssets
    // ServeStaticModule здесь используется только для дополнительных путей
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
      exclude: ['/api*'],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
      exclude: ['/api*'],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const config = {
          ...databaseConfig,
          retryAttempts: 3,
          retryDelay: 3000,
          autoLoadEntities: true,
        };

        console.log('📊 Database config:', {
          host: process.env.DATABASE_HOST || 'localhost',
          port: process.env.DATABASE_PORT || 5432,
          database: process.env.DATABASE_NAME || 'video_shop',
          synchronize: process.env.NODE_ENV !== 'production',
          autoLoadEntities: true,
        });

        return config;
      },
    }),

    // Твои модули
    EmailModule,
    TelegramModule,
    FilesModule,
    ProductsModule,
    CategoriesModule,
    ManufacturersModule,
    PopularDevicesModule,
    OrdersModule,
    UsersModule,
    AuthModule,
    ServicesModule,
    AdminModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
