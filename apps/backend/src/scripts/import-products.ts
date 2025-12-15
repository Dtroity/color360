import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

import { Product } from '../modules/catalog/products/entities/product.entity';
import { Category } from '../modules/catalog/categories/entities/category.entity';
import { ProductImage } from '../modules/catalog/products/entities/product-image.entity';
import { Manufacturer } from '../modules/catalog/manufacturers/entities/manufacturer.entity';
import { dataSourceConfig } from '../config/database.config';

const AppDataSource = new DataSource({
  ...dataSourceConfig,
  entities: [Product, Category, ProductImage, Manufacturer],
  synchronize: false,
  logging: false,
});

interface ProductImportData {
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  price: number;
  oldPrice?: number;
  categoryId?: number;
  manufacturerId?: number;
  sku?: string;
  stock?: number;
  images?: Array<{ url: string; alt?: string; sortOrder?: number }>;
}

function transliterateRuToSlug(input: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e',
    ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
    н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
    ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  const lower = input.toLowerCase();
  return lower
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9\-\s]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function importProducts() {
  console.log('===========================================');
  console.log('Starting product import from hiwatch_site_copy');
  console.log('===========================================\n');

  await AppDataSource.initialize();
  console.log('✅ Database connected\n');

  const productRepo = AppDataSource.getRepository(Product);
  const categoryRepo = AppDataSource.getRepository(Category);
  const manufacturerRepo = AppDataSource.getRepository(Manufacturer);
  const imageRepo = AppDataSource.getRepository(ProductImage);

  // Try to load from JSON file first (if exists)
  const jsonPath = path.join(process.cwd(), '..', '..', 'data', 'extracted', 'products.json');
  let productsData: ProductImportData[] = [];

  if (fs.existsSync(jsonPath)) {
    console.log(`📄 Loading products from ${jsonPath}`);
    try {
      const content = fs.readFileSync(jsonPath, 'utf-8');
      productsData = JSON.parse(content);
      console.log(`✅ Loaded ${productsData.length} products from JSON\n`);
    } catch (error: any) {
      console.error(`❌ Error reading JSON: ${error.message}`);
      console.log('⚠️  Will try to parse from CSV or HTML files\n');
    }
  }

  // If no JSON, try CSV
  if (productsData.length === 0) {
    const csvPath = path.join(process.cwd(), '..', '..', 'extracted_products.csv');
    if (fs.existsSync(csvPath)) {
      console.log(`📄 Loading products from ${csvPath}`);
      // Simple CSV parsing (can be enhanced)
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      // Skip header
      for (let i = 1; i < lines.length && i < 100; i++) { // Limit to 100 for testing
        const line = lines[i];
        const parts = line.split(',');
        if (parts.length >= 2) {
          const name = parts[0]?.trim();
          const priceMatch = parts[2]?.match(/(\d+(?:\s*\d+)*)/);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(/\s/g, '')) : 0;
          
          if (name && price > 0) {
            productsData.push({
              name,
              price,
              sku: name.substring(0, 20),
              stock: 10,
            });
          }
        }
      }
      console.log(`✅ Parsed ${productsData.length} products from CSV\n`);
    }
  }

  if (productsData.length === 0) {
    console.log('⚠️  No products data found. Please ensure:');
    console.log('   1. products.json exists in data/extracted/');
    console.log('   2. OR extracted_products.csv exists in root');
    console.log('   3. OR implement HTML parsing from hiwatch_site_copy/\n');
    process.exit(0);
  }

  // Get or create default category
  let defaultCategory = await categoryRepo.findOne({ where: { slug: 'uncategorized' } });
  if (!defaultCategory) {
    defaultCategory = categoryRepo.create({
      name: 'Без категории',
      slug: 'uncategorized',
      isActive: true,
      sortOrder: 999,
    });
    defaultCategory = await categoryRepo.save(defaultCategory);
    console.log('✅ Created default category\n');
  }

  let successCount = 0;
  let errorCount = 0;

  for (const productData of productsData) {
    try {
      // Check if product already exists
      const existing = await productRepo.findOne({
        where: [
          { name: productData.name },
          { sku: productData.sku || productData.name.substring(0, 20) },
        ],
      });

      if (existing) {
        console.log(`⏭️  Skipping existing: ${productData.name}`);
        continue;
      }

      const slug = productData.slug || transliterateRuToSlug(productData.name);
      
      const product = productRepo.create({
        name: productData.name,
        slug,
        sku: productData.sku || slug.substring(0, 50),
        description: productData.description || null,
        shortDescription: productData.shortDescription || productData.name,
        price: productData.price || 0,
        oldPrice: productData.oldPrice || null,
        stock: productData.stock || 0,
        isActive: true,
        category: productData.categoryId 
          ? await categoryRepo.findOne({ where: { id: productData.categoryId } })
          : defaultCategory,
        manufacturer: productData.manufacturerId
          ? await manufacturerRepo.findOne({ where: { id: productData.manufacturerId } })
          : null,
      });

      const savedProduct = await productRepo.save(product);

      // Add images if provided
      if (productData.images && productData.images.length > 0) {
        for (const imgData of productData.images) {
          const image = imageRepo.create({
            product: savedProduct,
            url: imgData.url,
            alt: imgData.alt || savedProduct.name,
            sortOrder: imgData.sortOrder || 0,
          });
          await imageRepo.save(image);
        }
      }

      successCount++;
      if (successCount % 10 === 0) {
        console.log(`✅ Imported ${successCount} products...`);
      }
    } catch (error: any) {
      errorCount++;
      console.error(`❌ Error importing ${productData.name}: ${error.message}`);
    }
  }

  console.log('\n===========================================');
  console.log('Import completed!');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('===========================================');

  await AppDataSource.destroy();
}

// Run import
importProducts().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

