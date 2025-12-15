import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

interface ExtractedProduct {
  name: string;
  slug: string;
  imageUrl?: string;
}

// Функция копирования и оптимизации изображения
async function copyAndOptimizeImage(
  sourcePath: string,
  targetDir: string,
  productSlug: string,
  index: number = 0
): Promise<string | null> {
  try {
    if (!fs.existsSync(sourcePath)) {
      console.warn(`⚠️  Файл не найден: ${sourcePath}`);
      return null;
    }

    // Определяем расширение
    const ext = path.extname(sourcePath).toLowerCase();
    const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    
    if (!validExts.includes(ext)) {
      console.warn(`⚠️  Неподдерживаемый формат: ${ext}`);
      return null;
    }

    // Имя файла: {slug}-{index}.webp
    const fileName = `${productSlug}-${index}.webp`;
    const targetPath = path.join(targetDir, fileName);

    // Создаём директорию если не существует
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Оптимизируем и конвертируем в WebP
    try {
      await sharp(sourcePath)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toFile(targetPath);
      
      console.log(`✅ ${fileName}`);
      return `/uploads/products/${fileName}`;
    } catch (error) {
      // Если sharp не смог обработать, просто копируем
      console.warn(`⚠️  Sharp ошибка, копирую как есть: ${error}`);
      fs.copyFileSync(sourcePath, targetPath);
      return `/uploads/products/${fileName}`;
    }
  } catch (error) {
    console.error(`❌ Ошибка при копировании ${sourcePath}:`, error);
    return null;
  }
}

// Функция поиска изображения по URL
function findImageFile(imageUrl: string, sourceDir: string): string | null {
  if (!imageUrl) return null;

  // Если это абсолютный путь
  if (path.isAbsolute(imageUrl)) {
    if (fs.existsSync(imageUrl)) {
      return imageUrl;
    }
  }

  // Если это относительный путь
  const possiblePaths = [
    path.join(sourceDir, imageUrl),
    path.join(sourceDir, imageUrl.replace(/^\//, '')),
    path.join(sourceDir, 'images', path.basename(imageUrl)),
    path.join(sourceDir, 'uploads', path.basename(imageUrl)),
    path.join(sourceDir, 'assets', path.basename(imageUrl)),
  ];

  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }

  // Попробуем найти по имени файла рекурсивно
  const imageName = path.basename(imageUrl);
  try {
    const files = fs.readdirSync(sourceDir, { recursive: true, withFileTypes: true });
    for (const file of files) {
      if (file.isFile() && file.name === imageName) {
        return path.join(sourceDir, file.name);
      }
    }
  } catch {
    // Игнорируем ошибки
  }

  return null;
}

// Главная функция
async function main() {
  const sourceDir = 'C:\\Users\\Detroyti\\Documents\\GitHub\\hiwatch_site\\hiwatch_site_copy';
  const productsJsonPath = path.join(process.cwd(), 'data', 'extracted', 'products.json');
  const uploadsDir = path.join(process.cwd(), 'uploads', 'products');

  console.log('📖 Чтение products.json...');
  
  if (!fs.existsSync(productsJsonPath)) {
    console.error('❌ Файл products.json не найден! Сначала запустите extract-from-html-clone.ts');
    process.exit(1);
  }

  const products: ExtractedProduct[] = JSON.parse(
    fs.readFileSync(productsJsonPath, 'utf-8')
  );

  console.log(`✅ Загружено ${products.length} товаров\n`);
  console.log('🖼️  Копирование изображений...\n');

  // Создаём директорию для загрузок
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const updatedProducts: ExtractedProduct[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const progress = `[${i + 1}/${products.length}]`;
    
    if (!product.imageUrl) {
      console.log(`${progress} ⚠️  Нет изображения: ${product.name}`);
      updatedProducts.push(product);
      continue;
    }

    const sourceImagePath = findImageFile(product.imageUrl, sourceDir);
    
    if (!sourceImagePath) {
      console.log(`${progress} ⚠️  Изображение не найдено: ${product.imageUrl}`);
      updatedProducts.push(product);
      errorCount++;
      continue;
    }

    const newImageUrl = await copyAndOptimizeImage(
      sourceImagePath,
      uploadsDir,
      product.slug,
      0
    );

    if (newImageUrl) {
      updatedProducts.push({
        ...product,
        imageUrl: newImageUrl,
      });
      successCount++;
    } else {
      updatedProducts.push(product);
      errorCount++;
    }
  }

  // Сохраняем обновлённый JSON
  const updatedJsonPath = path.join(process.cwd(), 'data', 'extracted', 'products.json');
  fs.writeFileSync(
    updatedJsonPath,
    JSON.stringify(updatedProducts, null, 2),
    'utf-8'
  );

  console.log('\n📊 Статистика:');
  console.log(`✅ Успешно скопировано: ${successCount} изображений`);
  console.log(`⚠️  Ошибок: ${errorCount}`);
  console.log(`💾 Обновлённый JSON сохранён: ${updatedJsonPath}`);
}

// Запуск
main().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});

