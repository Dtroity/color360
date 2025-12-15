import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

import { Product } from '../modules/catalog/products/entities/product.entity';
import { Category } from '../modules/catalog/categories/entities/category.entity';
import { ProductImage } from '../modules/catalog/products/entities/product-image.entity';
import { Manufacturer } from '../modules/catalog/manufacturers/entities/manufacturer.entity';

let Order: any = null;
let OrderItem: any = null;
let User: any = null;

try {
  Order = require('../modules/orders/entities/order.entity').Order;
  OrderItem = require('../modules/orders/entities/order-item.entity').OrderItem;
  console.log('Order entities loaded');
} catch (e) {
  console.log('Order entities not found (OK for initial import)');
}

try {
  User = require('../modules/users/entities/user.entity').User;
  console.log('User entity loaded');
} catch (e) {
  console.log('User entity not found (OK)');
}

const entities = [Product, Category, ProductImage, Manufacturer];
if (Order) entities.push(Order);
if (OrderItem) entities.push(OrderItem);
if (User) entities.push(User);

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'video_shop',
  synchronize: false,
  logging: ['error'],
  entities: entities,
});

interface ProductData {
  name: string;
  slug: string;
  sku?: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  oldPrice?: number;
  imageUrl?: string;
  categoryName?: string;
  specifications?: any;
}

interface CategoryData {
  name: string;
  slug: string;
  description?: string;
}

async function runImport() {
  console.log('===========================================');
  console.log('Starting data import...');
  console.log('===========================================\n');

  const dataDir = path.join(process.cwd(), 'data', 'extracted');
  const productsFile = path.join(dataDir, 'products.json');
  const categoriesFile = path.join(dataDir, 'categories.json');

  console.log('Data directory:', dataDir);

  if (!fs.existsSync(productsFile)) {
    console.error('ERROR: products.json not found!');
    console.log('Expected path:', productsFile);
    process.exit(1);
  }

  let products: ProductData[] = [];
  let categories: CategoryData[] = [];

  try {
    products = JSON.parse(fs.readFileSync(productsFile, 'utf-8'));
    console.log('Products loaded:', products.length);
  } catch (error: any) {
    console.error('ERROR reading products.json:', error.message);
    process.exit(1);
  }

  if (fs.existsSync(categoriesFile)) {
    try {
      categories = JSON.parse(fs.readFileSync(categoriesFile, 'utf-8'));
      console.log('Categories loaded:', categories.length);
    } catch (error: any) {
      console.error('Warning: Error reading categories.json:', error.message);
    }
  }

  try {
    console.log('\nConnecting to PostgreSQL...');
    await AppDataSource.initialize();
    console.log('Database connected!\n');

    const categoryRepo = AppDataSource.getRepository(Category);
    const productRepo = AppDataSource.getRepository(Product);
    const imageRepo = AppDataSource.getRepository(ProductImage);

    const categoryMap = new Map<string, Category>();

    if (categories.length > 0) {
      console.log('--- Importing Categories ---');

      for (const cat of categories) {
        try {
          let existing = await categoryRepo.findOne({ 
            where: { slug: cat.slug } 
          });

          if (!existing) {
            existing = categoryRepo.create({
              name: cat.name,
              slug: cat.slug,
              description: cat.description || '',
              isActive: true,
            });
            existing = await categoryRepo.save(existing);
            console.log('+ Created:', existing.name);
          } else {
            console.log('- Exists:', existing.name);
          }

          categoryMap.set(cat.slug, existing);
        } catch (error: any) {
          console.error('ERROR with category:', cat.name, error.message);
        }
      }
      console.log('');
    }

    console.log('--- Importing Products ---');
    
    const batchSize = 50;
    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const progress = `[${i + 1}-${Math.min(i + batchSize, products.length)}/${products.length}]`;

      console.log(`${progress} Processing batch...`);

      await AppDataSource.transaction(async (manager) => {
        const productRepo = manager.getRepository(Product);
        const imageRepo = manager.getRepository(ProductImage);

        for (const p of batch) {
          try {
            const exists = await productRepo.findOne({
              where: { slug: p.slug },
            });

            if (exists) {
              totalSkipped++;
              continue;
            }

            let category: Category | null = null;
            if (p.categoryName) {
              const categorySlug = p.categoryName
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/gi, '');
              category = categoryMap.get(categorySlug) || null;
            }

            const productData: any = {
              name: p.name.trim(),
              slug: p.slug,
              sku: p.sku?.trim() || `SKU-${Date.now()}-${totalCreated}`,
              description: p.description?.trim() || '',
              shortDescription: p.shortDescription?.trim() || '',
              price: Number(p.price) || 0,
              oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
              attributes: p.specifications || null,
              currency: 'RUB',
              availability: 'in_stock',
              stock: 0,
              isActive: true,
            };

            if (category) {
              productData.category = category;
            }

            const product = productRepo.create(productData);
            const saved = await productRepo.save(product);
            totalCreated++;

            if (p.imageUrl && p.imageUrl.trim()) {
              const imageData: any = {
                url: p.imageUrl.trim(),
                alt: p.name.trim(),
                sortOrder: 0,
                product: saved,
              };

              const image = imageRepo.create(imageData);
              await imageRepo.save(image);
            }

          } catch (error: any) {
            totalErrors++;
            console.error(`  ERROR: ${p.name.substring(0, 40)}... - ${error.message}`);
          }
        }
      });

      if ((i + batchSize) % 200 === 0) {
        console.log(`  Progress: ${totalCreated} created, ${totalSkipped} skipped, ${totalErrors} errors`);
      }
    }

    console.log('\n===========================================');
    console.log('IMPORT COMPLETED');
    console.log('===========================================');
    console.log('Created:     ', totalCreated);
    console.log('Skipped:     ', totalSkipped);
    console.log('Errors:      ', totalErrors);
    console.log('Total:       ', products.length);
    console.log('===========================================\n');

    if (totalCreated > 0) {
      console.log('SUCCESS! Import completed.');
    } else if (totalSkipped === products.length) {
      console.log('All products already exist in database.');
    }

  } catch (error: any) {
    console.error('\nCRITICAL ERROR:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed.\n');
    }
  }

  process.exit(0);
}

runImport().catch((err) => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});