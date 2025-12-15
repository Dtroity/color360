import { config as dotenvConfig } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import fg from 'fast-glob';
import dataSource from '../apps/backend/src/config/typeorm.datasource';
import { Product } from '../apps/backend/src/modules/catalog/products/entities/product.entity';
import { ProductImage } from '../apps/backend/src/modules/catalog/products/entities/product-image.entity';
import { Category } from '../apps/backend/src/modules/catalog/categories/entities/category.entity';
import { Manufacturer } from '../apps/backend/src/modules/catalog/manufacturers/entities/manufacturer.entity';

dotenvConfig({
  path: process.env.DOTENV_PATH || '.env',
});

const SOURCE_DIR =
  process.env.HTML_SOURCE_DIR ||
  'C:\\Users\\Detroyti\\Documents\\GitHub\\hiwatch_site';
const UPLOADS_DIR = path.resolve(
  __dirname,
  '..',
  'apps',
  'frontend',
  'public',
  'uploads',
);

const CATEGORY_ROOTS = [
  'ip-oborudovanie',
  'hd-tvi-oborudovanie',
  'videonablyudenye',
  'aksessuary',
  'domofoniya',
  'ohranno-pozharnaya-signalizaciya',
];

interface AnalysisReport {
  htmlFiles: {
    total: number;
    byCategory: Record<string, number>;
  };
  database: {
    products: {
      total: number;
      withoutImages: number;
      withoutDescription: number;
      withoutAttributes: number;
      byManufacturer: Array<{ manufacturer: string; count: number }>;
      byCategory: Array<{ category: string; count: number }>;
    };
    images: {
      total: number;
      missingFiles: number;
    };
    categories: {
      total: number;
      withParent: number;
      withoutParent: number;
    };
    manufacturers: {
      total: number;
      withLogo: number;
      withoutLogo: number;
    };
  };
  issues: Array<{
    type: string;
    description: string;
    affectedCount: number;
    examples: string[];
  }>;
}

async function analyzeMigration(): Promise<AnalysisReport> {
  await dataSource.initialize();

  const report: AnalysisReport = {
    htmlFiles: {
      total: 0,
      byCategory: {},
    },
    database: {
      products: {
        total: 0,
        withoutImages: 0,
        withoutDescription: 0,
        withoutAttributes: 0,
        byManufacturer: [],
        byCategory: [],
      },
      images: {
        total: 0,
        missingFiles: 0,
      },
      categories: {
        total: 0,
        withParent: 0,
        withoutParent: 0,
      },
      manufacturers: {
        total: 0,
        withLogo: 0,
        withoutLogo: 0,
      },
    },
    issues: [],
  };

  // 1. Анализ HTML файлов
  console.log('📁 Анализ HTML файлов...');
  const productFiles = await fg(
    CATEGORY_ROOTS.map((root) => `${root}/**/*.html`),
    {
      cwd: SOURCE_DIR,
      onlyFiles: true,
    },
  );

  report.htmlFiles.total = productFiles.length;
  for (const file of productFiles) {
    const category = file.split('/')[0];
    report.htmlFiles.byCategory[category] =
      (report.htmlFiles.byCategory[category] || 0) + 1;
  }

  // 2. Анализ БД - товары
  console.log('📦 Анализ товаров в БД...');
  const productRepo = dataSource.getRepository(Product);
  const allProducts = await productRepo.find({
    relations: ['manufacturer', 'category', 'images'],
  });

  report.database.products.total = allProducts.length;

  const productsWithoutImages = allProducts.filter(
    (p) => !p.images || p.images.length === 0,
  );
  report.database.products.withoutImages = productsWithoutImages.length;

  const productsWithoutDescription = allProducts.filter(
    (p) => !p.description || p.description.trim() === '',
  );
  report.database.products.withoutDescription =
    productsWithoutDescription.length;

  const productsWithoutAttributes = allProducts.filter(
    (p) => !p.attributes || Object.keys(p.attributes).length === 0,
  );
  report.database.products.withoutAttributes = productsWithoutAttributes.length;

  // Группировка по производителям
  const manufacturerMap = new Map<number, number>();
  for (const product of allProducts) {
    const mId = product.manufacturer?.id || 0;
    manufacturerMap.set(mId, (manufacturerMap.get(mId) || 0) + 1);
  }

  const manufacturerRepo = dataSource.getRepository(Manufacturer);
  for (const [mId, count] of manufacturerMap.entries()) {
    if (mId === 0) {
      report.database.products.byManufacturer.push({
        manufacturer: 'Не указан',
        count,
      });
    } else {
      const m = await manufacturerRepo.findOne({ where: { id: mId } });
      report.database.products.byManufacturer.push({
        manufacturer: m?.name || `ID: ${mId}`,
        count,
      });
    }
  }

  // Группировка по категориям
  const categoryMap = new Map<number, number>();
  for (const product of allProducts) {
    const cId = product.category?.id || 0;
    categoryMap.set(cId, (categoryMap.get(cId) || 0) + 1);
  }

  const categoryRepo = dataSource.getRepository(Category);
  for (const [cId, count] of categoryMap.entries()) {
    if (cId === 0) {
      report.database.products.byCategory.push({
        category: 'Не указана',
        count,
      });
    } else {
      const c = await categoryRepo.findOne({ where: { id: cId } });
      report.database.products.byCategory.push({
        category: c?.name || `ID: ${cId}`,
        count,
      });
    }
  }

  // 3. Анализ изображений
  console.log('🖼️  Анализ изображений...');
  const imageRepo = dataSource.getRepository(ProductImage);
  const allImages = await imageRepo.find();
  report.database.images.total = allImages.length;

  let missingFiles = 0;
  for (const image of allImages) {
    const imagePath = path.join(
      __dirname,
      '..',
      'apps',
      'frontend',
      'public',
      image.url.replace(/^\//, ''),
    );
    if (!fs.existsSync(imagePath)) {
      missingFiles++;
    }
  }
  report.database.images.missingFiles = missingFiles;

  // 4. Анализ категорий
  console.log('📂 Анализ категорий...');
  const allCategories = await categoryRepo.find({ relations: ['parent'] });
  report.database.categories.total = allCategories.length;
  report.database.categories.withParent = allCategories.filter(
    (c) => c.parent !== null,
  ).length;
  report.database.categories.withoutParent = allCategories.filter(
    (c) => c.parent === null,
  ).length;

  // 5. Анализ производителей
  console.log('🏭 Анализ производителей...');
  const allManufacturers = await manufacturerRepo.find();
  report.database.manufacturers.total = allManufacturers.length;
  report.database.manufacturers.withLogo = allManufacturers.filter(
    (m) => m.logo && m.logo.trim() !== '',
  ).length;
  report.database.manufacturers.withoutLogo = allManufacturers.filter(
    (m) => !m.logo || m.logo.trim() === '',
  ).length;

  // 6. Выявление проблем
  console.log('🔍 Выявление проблем...');

  // Проблема: товары без изображений
  if (productsWithoutImages.length > 0) {
    report.issues.push({
      type: 'Товары без изображений',
      description:
        'Товары, у которых отсутствуют изображения в БД или файлы изображений',
      affectedCount: productsWithoutImages.length,
      examples: productsWithoutImages
        .slice(0, 5)
        .map((p) => `${p.id}: ${p.name}`),
    });
  }

  // Проблема: товары без описания
  if (productsWithoutDescription.length > 0) {
    report.issues.push({
      type: 'Товары без описания',
      description: 'Товары с пустым или отсутствующим полем description',
      affectedCount: productsWithoutDescription.length,
      examples: productsWithoutDescription
        .slice(0, 5)
        .map((p) => `${p.id}: ${p.name}`),
    });
  }

  // Проблема: товары без характеристик
  if (productsWithoutAttributes.length > 0) {
    report.issues.push({
      type: 'Товары без характеристик',
      description: 'Товары с пустым объектом attributes',
      affectedCount: productsWithoutAttributes.length,
      examples: productsWithoutAttributes
        .slice(0, 5)
        .map((p) => `${p.id}: ${p.name}`),
    });
  }

  // Проблема: несоответствие количества HTML файлов и товаров в БД
  const diff = productFiles.length - allProducts.length;
  if (diff > 0) {
    report.issues.push({
      type: 'Не импортированные товары',
      description: `Найдено ${productFiles.length} HTML файлов, но в БД только ${allProducts.length} товаров`,
      affectedCount: diff,
      examples: [],
    });
  }

  // Проблема: отсутствующие файлы изображений
  if (missingFiles > 0) {
    report.issues.push({
      type: 'Отсутствующие файлы изображений',
      description:
        'Изображения указаны в БД, но файлы отсутствуют в public/uploads',
      affectedCount: missingFiles,
      examples: [],
    });
  }

  await dataSource.destroy();
  return report;
}

function printReport(report: AnalysisReport) {
  console.log('\n' + '='.repeat(60));
  console.log('ОТЧЕТ О МИГРАЦИИ ДАННЫХ');
  console.log('='.repeat(60) + '\n');

  console.log('📁 HTML ФАЙЛЫ:');
  console.log(`  Всего найдено: ${report.htmlFiles.total}`);
  console.log('  По категориям:');
  for (const [cat, count] of Object.entries(report.htmlFiles.byCategory)) {
    console.log(`    - ${cat}: ${count}`);
  }

  console.log('\n📦 ТОВАРЫ В БД:');
  console.log(`  Всего: ${report.database.products.total}`);
  console.log(`  Без изображений: ${report.database.products.withoutImages}`);
  console.log(
    `  Без описания: ${report.database.products.withoutDescription}`,
  );
  console.log(
    `  Без характеристик: ${report.database.products.withoutAttributes}`,
  );

  console.log('\n  По производителям:');
  for (const item of report.database.products.byManufacturer) {
    console.log(`    - ${item.manufacturer}: ${item.count}`);
  }

  console.log('\n  По категориям:');
  for (const item of report.database.products.byCategory) {
    console.log(`    - ${item.category}: ${item.count}`);
  }

  console.log('\n🖼️  ИЗОБРАЖЕНИЯ:');
  console.log(`  Всего в БД: ${report.database.images.total}`);
  console.log(
    `  Отсутствующих файлов: ${report.database.images.missingFiles}`,
  );

  console.log('\n📂 КАТЕГОРИИ:');
  console.log(`  Всего: ${report.database.categories.total}`);
  console.log(`  С родителем: ${report.database.categories.withParent}`);
  console.log(`  Без родителя: ${report.database.categories.withoutParent}`);

  console.log('\n🏭 ПРОИЗВОДИТЕЛИ:');
  console.log(`  Всего: ${report.database.manufacturers.total}`);
  console.log(`  С логотипом: ${report.database.manufacturers.withLogo}`);
  console.log(`  Без логотипа: ${report.database.manufacturers.withoutLogo}`);

  console.log('\n⚠️  ПРОБЛЕМЫ:');
  if (report.issues.length === 0) {
    console.log('  Проблем не обнаружено ✅');
  } else {
    for (const issue of report.issues) {
      console.log(`\n  [${issue.type}]`);
      console.log(`  Описание: ${issue.description}`);
      console.log(`  Затронуто: ${issue.affectedCount}`);
      if (issue.examples.length > 0) {
        console.log('  Примеры:');
        for (const ex of issue.examples) {
          console.log(`    - ${ex}`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

if (require.main === module) {
  analyzeMigration()
    .then(printReport)
    .catch((error) => {
      console.error('Ошибка анализа:', error);
      process.exit(1);
    });
}

export { analyzeMigration, printReport };

