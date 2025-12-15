import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: false,
  });

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Префикс API
  app.setGlobalPrefix('api');

  // Валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Middleware для UTF-8
  app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
  });

  // Статика для uploads — используем один детерминированный путь без перекрытия /api/*
  const uploadsPath = join(process.cwd(), 'apps', 'backend', 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log(`✅ Создана папка: ${uploadsPath}`);
  }
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads',
    index: false,
  });

  // Раздача изображений из hiwatch_site_copy/image/catalog
  // Это нужно для поддержки старых путей вида /image/catalog/...
  // process.cwd() в backend = apps/backend
  // hiwatch_site_copy находится на 3 уровня выше: apps/backend -> video-shop-monorepo -> hiwatch_site -> hiwatch_site_copy
  const imageCatalogPath1 = join(process.cwd(), '..', '..', '..', 'hiwatch_site_copy', 'image', 'catalog');
  const imageCatalogPath2 = join(process.cwd(), '..', '..', 'hiwatch_site_copy', 'image', 'catalog');
  const imageCatalogPath3 = join(process.cwd(), '..', 'hiwatch_site_copy', 'image', 'catalog');
  const imageCatalogPath = fs.existsSync(imageCatalogPath1) ? imageCatalogPath1 : 
                          (fs.existsSync(imageCatalogPath2) ? imageCatalogPath2 : 
                          (fs.existsSync(imageCatalogPath3) ? imageCatalogPath3 : null));
  
  if (imageCatalogPath && fs.existsSync(imageCatalogPath)) {
    app.useStaticAssets(imageCatalogPath, {
      prefix: '/image/catalog',
      index: false,
    });
    console.log(`📁 Image catalog served from: ${imageCatalogPath}`);
    // #region agent log
    const logPath = join(process.cwd(), '..', '..', '.cursor', 'debug.log');
    try {
      const logEntry = JSON.stringify({
        location: 'main.ts:57',
        message: 'Image catalog path configured',
        data: { path: imageCatalogPath, exists: true },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C'
      }) + '\n';
      fs.appendFileSync(logPath, logEntry, 'utf8');
    } catch (e) {}
    // #endregion
  } else {
    console.log(`⚠️  Image catalog path not found. Tried: ${imageCatalogPath1}, ${imageCatalogPath2}, ${imageCatalogPath3}`);
    // #region agent log
    const logPath = join(process.cwd(), '..', '..', '.cursor', 'debug.log');
    try {
      const logEntry = JSON.stringify({
        location: 'main.ts:59',
        message: 'Image catalog path NOT found',
        data: { path1: imageCatalogPath1, path2: imageCatalogPath2, cwd: process.cwd() },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C'
      }) + '\n';
      fs.appendFileSync(logPath, logEntry, 'utf8');
    } catch (e) {}
    // #endregion
  }

  // Раздаём frontend public статику
  const frontendPublicPath = join(process.cwd(), 'apps', 'frontend', 'public');
  if (fs.existsSync(frontendPublicPath)) {
    app.useStaticAssets(frontendPublicPath, {
      prefix: '/',
      index: false,
    });
  }

  // Логирование запросов
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    // #region agent log
    if (req.path.startsWith('/image/') || req.path.startsWith('/uploads/')) {
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
      const logEntry = JSON.stringify({
        location: 'main.ts:72',
        message: 'Static asset request',
        data: { method: req.method, path: req.path, url: req.url },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C'
      }) + '\n';
      try {
        fs.appendFileSync(logPath, logEntry, 'utf8');
      } catch (e) {}
    }
    // #endregion
    next();
  });

  // Старт сервера
  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📁 Uploads served from: ${uploadsPath}`);
  if (fs.existsSync(frontendPublicPath)) {
    console.log(`📁 Frontend public served from: ${frontendPublicPath}`);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start backend:', error);
  process.exit(1);
});