#!/usr/bin/env tsx

/**
 * Скрипт для анализа Backend API и Базы данных
 * Проверяет эндпоинты, целостность данных и создает отчет
 */

import { DataSource } from 'typeorm';
import * as http from 'http';
import * as https from 'https';
import { dataSourceConfig } from '../apps/backend/src/config/typeorm.datasource';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const DB_CHECK_ENABLED = process.env.DB_CHECK !== 'false';

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  expectedStatus?: number;
}

interface ApiTestResult {
  endpoint: string;
  method: string;
  status: number | 'ERROR';
  responseTime: number;
  error?: string;
  data?: any;
}

interface DbCheckResult {
  query: string;
  count: number;
  issues: string[];
}

const ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/products',
    description: 'Получение списка товаров',
    expectedStatus: 200,
  },
  {
    method: 'GET',
    path: '/api/products?page=1&limit=20',
    description: 'Получение товаров с пагинацией',
    expectedStatus: 200,
  },
  {
    method: 'GET',
    path: '/api/categories',
    description: 'Получение списка категорий',
    expectedStatus: 200,
  },
  {
    method: 'GET',
    path: '/api/manufacturers',
    description: 'Получение списка производителей',
    expectedStatus: 200,
  },
  {
    method: 'POST',
    path: '/api/orders',
    description: 'Создание заказа',
    expectedStatus: 201,
  },
];

async function testApiEndpoint(endpoint: ApiEndpoint): Promise<ApiTestResult> {
  const url = new URL(endpoint.path, API_BASE_URL);
  const startTime = Date.now();

  return new Promise((resolve) => {
    const client = url.protocol === 'https:' ? https : http;
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    const req = client.request(url.toString(), options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        let parsedData: any = null;

        try {
          parsedData = JSON.parse(data);
        } catch {
          // Не JSON ответ
        }

        resolve({
          endpoint: endpoint.path,
          method: endpoint.method,
          status: res.statusCode || 0,
          responseTime,
          data: parsedData,
        });
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'ERROR',
        responseTime,
        error: error.message,
      });
    });

    if (endpoint.method === 'POST') {
      req.write(
        JSON.stringify({
          items: [
            {
              productId: 1,
              quantity: 1,
              price: 1000,
            },
          ],
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          customerPhone: '+79991234567',
          shippingAddress: 'Test Address',
          paymentMethod: 'cash',
        }),
      );
    }

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'ERROR',
        responseTime: Date.now() - startTime,
        error: 'Request timeout',
      });
    });

    req.end();
  });
}

async function checkDatabase(dataSource: DataSource): Promise<DbCheckResult[]> {
  const results: DbCheckResult[] = [];

  try {
    // Товары без категории
    const productsWithoutCategory = await dataSource.query(
      `SELECT id, name FROM products WHERE category_id IS NULL`,
    );
    results.push({
      query: 'Товары без категории',
      count: productsWithoutCategory.length,
      issues:
        productsWithoutCategory.length > 0
          ? productsWithoutCategory.map((p: any) => `ID: ${p.id}, Название: ${p.name}`)
          : [],
    });

    // Товары без производителя
    const productsWithoutManufacturer = await dataSource.query(
      `SELECT id, name FROM products WHERE manufacturer_id IS NULL`,
    );
    results.push({
      query: 'Товары без производителя',
      count: productsWithoutManufacturer.length,
      issues:
        productsWithoutManufacturer.length > 0
          ? productsWithoutManufacturer.map((p: any) => `ID: ${p.id}, Название: ${p.name}`)
          : [],
    });

    // Товары с некорректными ценами
    const productsWithInvalidPrice = await dataSource.query(
      `SELECT id, name, price FROM products WHERE price <= 0 OR price IS NULL`,
    );
    results.push({
      query: 'Товары с некорректными ценами',
      count: productsWithInvalidPrice.length,
      issues:
        productsWithInvalidPrice.length > 0
          ? productsWithInvalidPrice.map((p: any) => `ID: ${p.id}, Название: ${p.name}, Цена: ${p.price}`)
          : [],
    });

    // Изображения с несуществующими путями
    const imagesWithInvalidPath = await dataSource.query(
      `SELECT id, url, product_id FROM product_images WHERE url IS NULL OR url = ''`,
    );
    results.push({
      query: 'Изображения с некорректными путями',
      count: imagesWithInvalidPath.length,
      issues:
        imagesWithInvalidPath.length > 0
          ? imagesWithInvalidPath.map((img: any) => `ID: ${img.id}, Product ID: ${img.product_id}`)
          : [],
    });

    // Заказы с некорректными статусами
    const ordersWithInvalidStatus = await dataSource.query(
      `SELECT id, order_number, status FROM orders WHERE status NOT IN ('new', 'processing', 'shipped', 'delivered', 'cancelled')`,
    );
    results.push({
      query: 'Заказы с некорректными статусами',
      count: ordersWithInvalidStatus.length,
      issues:
        ordersWithInvalidStatus.length > 0
          ? ordersWithInvalidStatus.map((o: any) => `ID: ${o.id}, Номер: ${o.order_number}, Статус: ${o.status}`)
          : [],
    });

    // Проверка связей
    const brokenRelations = await dataSource.query(
      `SELECT p.id, p.name, c.name as category, m.name as manufacturer
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
       WHERE (p.category_id IS NOT NULL AND c.id IS NULL) 
          OR (p.manufacturer_id IS NOT NULL AND m.id IS NULL)`,
    );
    results.push({
      query: 'Товары с битыми связями',
      count: brokenRelations.length,
      issues:
        brokenRelations.length > 0
          ? brokenRelations.map((r: any) => `ID: ${r.id}, Название: ${r.name}`)
          : [],
    });

    // Общая статистика
    const totalProducts = await dataSource.query(`SELECT COUNT(*) as count FROM products`);
    const totalCategories = await dataSource.query(`SELECT COUNT(*) as count FROM categories`);
    const totalManufacturers = await dataSource.query(`SELECT COUNT(*) as count FROM manufacturers`);
    const totalOrders = await dataSource.query(`SELECT COUNT(*) as count FROM orders`);
    const productsWithImages = await dataSource.query(
      `SELECT COUNT(DISTINCT product_id) as count FROM product_images`,
    );

    results.push({
      query: 'Общая статистика',
      count: 0,
      issues: [
        `Всего товаров: ${totalProducts[0]?.count || 0}`,
        `Всего категорий: ${totalCategories[0]?.count || 0}`,
        `Всего производителей: ${totalManufacturers[0]?.count || 0}`,
        `Всего заказов: ${totalOrders[0]?.count || 0}`,
        `Товаров с изображениями: ${productsWithImages[0]?.count || 0}`,
      ],
    });
  } catch (error: any) {
    results.push({
      query: 'Ошибка проверки БД',
      count: 0,
      issues: [error.message || 'Unknown error'],
    });
  }

  return results;
}

async function main() {
  console.log('=== АНАЛИЗ BACKEND API И БАЗЫ ДАННЫХ ===\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  // Тестирование API
  console.log('1. ТЕСТИРОВАНИЕ API ЭНДПОИНТОВ\n');
  const apiResults: ApiTestResult[] = [];

  for (const endpoint of ENDPOINTS) {
    console.log(`Тестирование: ${endpoint.method} ${endpoint.path}...`);
    const result = await testApiEndpoint(endpoint);
    apiResults.push(result);

    if (result.status === 'ERROR') {
      console.log(`  ❌ ОШИБКА: ${result.error}`);
    } else if (result.status === endpoint.expectedStatus) {
      console.log(`  ✅ Успешно (${result.status}) - ${result.responseTime}ms`);
    } else {
      console.log(`  ⚠️  Неожиданный статус: ${result.status} (ожидалось ${endpoint.expectedStatus})`);
    }
  }

  // Проверка БД
  let dbResults: DbCheckResult[] = [];
  if (DB_CHECK_ENABLED) {
    console.log('\n2. ПРОВЕРКА БАЗЫ ДАННЫХ\n');
    try {
      const dataSource = new DataSource(dataSourceConfig);
      await dataSource.initialize();
      console.log('✅ Подключение к БД установлено\n');
      dbResults = await checkDatabase(dataSource);
      await dataSource.destroy();
    } catch (error: any) {
      console.log(`❌ Ошибка подключения к БД: ${error.message}\n`);
      dbResults = [
        {
          query: 'Подключение к БД',
          count: 0,
          issues: [error.message || 'Unknown error'],
        },
      ];
    }
  } else {
    console.log('\n2. ПРОВЕРКА БАЗЫ ДАННЫХ (пропущена)\n');
  }

  // Генерация отчета
  console.log('\n=== ОТЧЕТ ===\n');

  console.log('API ЭНДПОИНТЫ:');
  apiResults.forEach((result) => {
    const statusIcon = result.status === 'ERROR' ? '❌' : result.status === 200 || result.status === 201 ? '✅' : '⚠️';
    console.log(`  ${statusIcon} ${result.method} ${result.endpoint}`);
    if (result.status === 'ERROR') {
      console.log(`     Ошибка: ${result.error}`);
    } else {
      console.log(`     Статус: ${result.status}, Время: ${result.responseTime}ms`);
      if (result.data && typeof result.data === 'object') {
        if (Array.isArray(result.data)) {
          console.log(`     Элементов: ${result.data.length}`);
        } else if (result.data.data && Array.isArray(result.data.data)) {
          console.log(`     Элементов: ${result.data.data.length}, Всего: ${result.data.total || 'N/A'}`);
        }
      }
    }
  });

  if (dbResults.length > 0) {
    console.log('\nБАЗА ДАННЫХ:');
    dbResults.forEach((result) => {
      if (result.query === 'Общая статистика') {
        console.log(`  📊 ${result.query}:`);
        result.issues.forEach((issue) => console.log(`     ${issue}`));
      } else if (result.count > 0) {
        console.log(`  ⚠️  ${result.query}: ${result.count} проблем`);
        if (result.issues.length > 0 && result.issues.length <= 5) {
          result.issues.forEach((issue) => console.log(`     - ${issue}`));
        } else if (result.issues.length > 5) {
          result.issues.slice(0, 5).forEach((issue) => console.log(`     - ${issue}`));
          console.log(`     ... и еще ${result.issues.length - 5} проблем`);
        }
      } else {
        console.log(`  ✅ ${result.query}: проблем не найдено`);
      }
    });
  }

  // Сохранение отчета в файл
  const report = {
    timestamp: new Date().toISOString(),
    apiBaseUrl: API_BASE_URL,
    apiResults,
    dbResults,
  };

  const fs = await import('fs');
  const path = await import('path');
  const reportPath = path.join(process.cwd(), 'API_DB_ANALYSIS_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Отчет сохранен в: ${reportPath}`);
}

main().catch(console.error);

