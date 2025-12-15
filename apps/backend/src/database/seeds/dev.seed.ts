import { config as dotenvConfig } from 'dotenv';
import * as bcrypt from 'bcrypt';
import dataSource from '../../config/typeorm.datasource';
import { Manufacturer } from '../../modules/catalog/manufacturers/entities/manufacturer.entity';
import { Category } from '../../modules/catalog/categories/entities/category.entity';
import { Product } from '../../modules/catalog/products/entities/product.entity';
import { ProductImage } from '../../modules/catalog/products/entities/product-image.entity';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import { SiteSetting } from '../../modules/settings/entities/site-setting.entity';

dotenvConfig({ path: process.env.DOTENV_PATH || '.env' });

const manufacturersList = [
  { name: 'HiWatch', country: 'China' },
  { name: 'Hikvision', country: 'China' },
];

const categoriesList = ['IP-камеры', 'TVI-камеры'];

const sampleSettings = [
  { key: 'site.name', value: 'color360.ru', description: 'Название платформы' },
  { key: 'site.email', value: 'info@color360.ru', description: 'Email для уведомлений' },
];

const toSlug = (value: string, suffix = ''): string => {
  return value.toLowerCase().replace(/\s+/g, '-') + (suffix ? `-${suffix}` : '');
};

async function seed() {
  await dataSource.initialize();

  const productRepo = dataSource.getRepository(Product);
  const productImageRepo = dataSource.getRepository(ProductImage);
  const categoryRepo = dataSource.getRepository(Category);
  const manufacturerRepo = dataSource.getRepository(Manufacturer);
  const userRepo = dataSource.getRepository(User);
  const siteSettingsRepo = dataSource.getRepository(SiteSetting);

  await productImageRepo.delete({});
  await productRepo.delete({});
  await categoryRepo.delete({});
  await manufacturerRepo.delete({});
  await userRepo.delete({});
  await siteSettingsRepo.delete({});

  const manufacturers: Manufacturer[] = [];
  for (const m of manufacturersList) {
    const entity = manufacturerRepo.create({ ...m, slug: toSlug(m.name), isActive: true });
    manufacturers.push(await manufacturerRepo.save(entity));
  }

  const categories: Category[] = [];
  for (const c of categoriesList) {
    const entity = categoryRepo.create({ name: c, slug: toSlug(c), isActive: true, sortOrder: 0 });
    categories.push(await categoryRepo.save(entity));
  }

  const products: Product[] = [];
  for (let i = 0; i < 10; i++) {
    const product = productRepo.create({
      name: `Продукт ${i + 1}`,
      slug: `product-${i + 1}`,
      sku: `SKU-${i + 1}`,
      price: 1000 + i * 10,
      currency: 'RUB',
      stock: 10 + i,
      isActive: true,
      category: categories[i % categories.length] || null,
      manufacturer: manufacturers[i % manufacturers.length] || null,
    });
    const savedProduct = await productRepo.save(product);
    
    // Создать изображения отдельно
    const image = productImageRepo.create({
      url: `/uploads/product-${i + 1}.jpg`,
      alt: `Продукт ${i + 1}`,
      sortOrder: 0,
      product: savedProduct,
    });
    await productImageRepo.save(image);
    
    products.push(savedProduct);
  }

  const adminPassword = await bcrypt.hash('Admin123!', 10);
  await userRepo.save(userRepo.create({
    email: 'admin@color360.ru',
    passwordHash: adminPassword,
    firstName: 'Главный',
    lastName: 'Администратор',
    role: UserRole.ADMIN,
    isActive: true,
  }));

  for (const setting of sampleSettings) {
    await siteSettingsRepo.save(siteSettingsRepo.create(setting));
  }

  console.log('Seed completed');

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
