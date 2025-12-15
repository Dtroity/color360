import { DataSource } from 'typeorm';
import { join } from 'path';
import * as fs from 'fs';

import { Product } from '../modules/catalog/products/entities/product.entity';
import { ProductImage } from '../modules/catalog/products/entities/product-image.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_NAME ?? 'video_shop',
  synchronize: false,
  entities: [Product, ProductImage],
});

async function run() {
  await AppDataSource.initialize();
  
  const uploadsRoot = join(process.cwd(), 'uploads', 'products');
  console.log('📁 Scanning images in:', uploadsRoot);
  
  const products = await AppDataSource.getRepository(Product).find();
  
  for (const product of products) {
    const productDir = join(uploadsRoot, String(product.id));
    const mainImage = join(productDir, '0.webp');
    
    if (fs.existsSync(mainImage)) {
      await AppDataSource.getRepository(ProductImage).update(
        { product: { id: product.id } }, // <-- ЗАПЯТАЯ ЗДЕСЬ!
        { url: `/uploads/products/${product.id}/0.webp` }
      );
      console.log(`✔ Updated: product ${product.id}`);
    } else {
      console.warn(`⚠ No image: product ${product.id}`);
    }
  }
  
  await AppDataSource.destroy();
  console.log('✅ Done.');
}

run().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});