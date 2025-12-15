import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'node-html-parser';

// Функция транслитерации кириллицы в латиницу для slug
function transliterateRuToSlug(input: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e',
    ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
    н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
    ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
    А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ё: 'E',
    Ж: 'Zh', З: 'Z', И: 'I', Й: 'Y', К: 'K', Л: 'L', М: 'M',
    Н: 'N', О: 'O', П: 'P', Р: 'R', С: 'S', Т: 'T', У: 'U',
    Ф: 'F', Х: 'H', Ц: 'C', Ч: 'Ch', Ш: 'Sh', Щ: 'Sch',
    Ъ: '', Ы: 'Y', Ь: '', Э: 'E', Ю: 'Yu', Я: 'Ya',
  };

  return input
    .split('')
    .map((char) => map[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface ExtractedProduct {
  name: string;
  slug: string;
  sku?: string;
  price?: number;
  oldPrice?: number;
  description?: string;
  shortDescription?: string;
  categoryName?: string;
  imageUrl?: string;
  specifications?: Record<string, string>;
  sourceFile?: string;
}

interface ExtractedCategory {
  name: string;
  slug: string;
  description?: string;
}

// Функция извлечения числа из строки цены
function extractPrice(priceText: string | null | undefined): number | undefined {
  if (!priceText) return undefined;
  
  // Удаляем все символы кроме цифр, точек и запятых
  const cleaned = priceText.replace(/[^\d.,]/g, '').replace(/,/g, '.');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? undefined : parsed;
}

// Функция очистки HTML тегов
function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

// Функция извлечения данных из HTML файла
function extractFromHtml(htmlContent: string, filePath: string): ExtractedProduct | null {
  try {
    const root = parse(htmlContent);
    
    // Извлечение названия (пробуем несколько селекторов)
    const nameElement = 
      root.querySelector('.product-title') ||
      root.querySelector('h1.product-name') ||
      root.querySelector('.product h1') ||
      root.querySelector('h1') ||
      root.querySelector('[itemprop="name"]') ||
      root.querySelector('.title');
    
    const name = stripHtml(nameElement?.text || nameElement?.innerHTML || '');
    if (!name) {
      console.warn(`⚠️  Не найдено название в файле: ${filePath}`);
      return null;
    }

    // Извлечение цены
    const priceElement = 
      root.querySelector('.product-price') ||
      root.querySelector('.price') ||
      root.querySelector('[itemprop="price"]') ||
      root.querySelector('.price-current') ||
      root.querySelector('.cost');
    
    const priceText = priceElement?.text || priceElement?.getAttribute('content') || '';
    const price = extractPrice(priceText);

    // Извлечение старой цены
    const oldPriceElement = 
      root.querySelector('.product-price-old') ||
      root.querySelector('.price-old') ||
      root.querySelector('.old-price') ||
      root.querySelector('.price-was');
    
    const oldPriceText = oldPriceElement?.text || '';
    const oldPrice = extractPrice(oldPriceText);

    // Извлечение артикула (SKU)
    const skuElement = 
      root.querySelector('.product-sku') ||
      root.querySelector('.sku') ||
      root.querySelector('[itemprop="sku"]') ||
      root.querySelector('.article');
    
    const sku = stripHtml(skuElement?.text || skuElement?.innerHTML || '');

    // Извлечение описания
    const descriptionElement = 
      root.querySelector('.product-description') ||
      root.querySelector('.description') ||
      root.querySelector('[itemprop="description"]') ||
      root.querySelector('.product-content');
    
    const description = stripHtml(descriptionElement?.text || descriptionElement?.innerHTML || '');

    // Извлечение краткого описания
    const shortDescriptionElement = 
      root.querySelector('.product-short-description') ||
      root.querySelector('.short-description') ||
      root.querySelector('.excerpt');
    
    const shortDescription = stripHtml(shortDescriptionElement?.text || shortDescriptionElement?.innerHTML || '');

    // Извлечение категории
    const categoryElement = 
      root.querySelector('.product-category') ||
      root.querySelector('.category') ||
      root.querySelector('[itemprop="category"]') ||
      root.querySelector('nav .breadcrumb a:last-child');
    
    const categoryName = stripHtml(categoryElement?.text || categoryElement?.innerHTML || '');

    // Извлечение изображения
    const imageElement = 
      root.querySelector('.product-image img') ||
      root.querySelector('.product img') ||
      root.querySelector('img[itemprop="image"]') ||
      root.querySelector('.main-image img') ||
      root.querySelector('img');
    
    const imageUrl = imageElement?.getAttribute('src') || 
                     imageElement?.getAttribute('data-src') ||
                     imageElement?.getAttribute('data-lazy-src') || '';

    // Извлечение технических характеристик
    const specifications: Record<string, string> = {};
    const specRows = root.querySelectorAll('.specifications tr, .specs tr, .characteristics tr, table tr');
    
    specRows.forEach((row) => {
      const cells = row.querySelectorAll('td, th');
      if (cells.length >= 2) {
        const key = stripHtml(cells[0]?.text || '');
        const value = stripHtml(cells[1]?.text || '');
        if (key && value) {
          specifications[key] = value;
        }
      }
    });

    // Генерация slug
    const slug = transliterateRuToSlug(name);

    return {
      name,
      slug,
      sku: sku || undefined,
      price,
      oldPrice,
      description: description || undefined,
      shortDescription: shortDescription || description || undefined,
      categoryName: categoryName || undefined,
      imageUrl: imageUrl || undefined,
      specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
      sourceFile: path.basename(filePath),
    };
  } catch (error) {
    console.error(`❌ Ошибка при обработке файла ${filePath}:`, error);
    return null;
  }
}

// Функция рекурсивного поиска HTML файлов
function findHtmlFiles(dir: string): string[] {
  const files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Пропускаем node_modules и другие служебные папки
        if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(entry.name)) {
          files.push(...findHtmlFiles(fullPath));
        }
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Ошибка при чтении директории ${dir}:`, error);
  }
  
  return files;
}

// Главная функция
async function main() {
  const sourceDir = 'C:\\Users\\Detroyti\\Documents\\GitHub\\hiwatch_site\\hiwatch_site_copy';
  const outputDir = path.join(process.cwd(), 'data', 'extracted');
  
  console.log('🔍 Поиск HTML файлов...');
  const htmlFiles = findHtmlFiles(sourceDir);
  console.log(`✅ Найдено ${htmlFiles.length} HTML файлов\n`);

  if (htmlFiles.length === 0) {
    console.error('❌ HTML файлы не найдены!');
    process.exit(1);
  }

  // Создаём выходную директорию
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const products: ExtractedProduct[] = [];
  const categoriesMap = new Map<string, ExtractedCategory>();
  let successCount = 0;
  let errorCount = 0;

  console.log('📄 Извлечение данных из HTML файлов...\n');

  for (let i = 0; i < htmlFiles.length; i++) {
    const filePath = htmlFiles[i];
    const progress = `[${i + 1}/${htmlFiles.length}]`;
    
    try {
      const htmlContent = fs.readFileSync(filePath, 'utf-8');
      const product = extractFromHtml(htmlContent, filePath);
      
      if (product) {
        products.push(product);
        successCount++;
        
        // Добавляем категорию в карту
        if (product.categoryName) {
          const categorySlug = transliterateRuToSlug(product.categoryName);
          if (!categoriesMap.has(categorySlug)) {
            categoriesMap.set(categorySlug, {
              name: product.categoryName,
              slug: categorySlug,
            });
          }
        }
        
        console.log(`${progress} ✅ ${product.name}`);
      } else {
        errorCount++;
        console.log(`${progress} ⚠️  Пропущен: ${path.basename(filePath)}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`${progress} ❌ Ошибка: ${path.basename(filePath)}`, error);
    }
  }

  // Преобразуем Map в массив
  const categories = Array.from(categoriesMap.values());

  // Сохраняем результаты
  const productsPath = path.join(outputDir, 'products.json');
  const categoriesPath = path.join(outputDir, 'categories.json');

  fs.writeFileSync(
    productsPath,
    JSON.stringify(products, null, 2),
    'utf-8'
  );

  fs.writeFileSync(
    categoriesPath,
    JSON.stringify(categories, null, 2),
    'utf-8'
  );

  console.log('\n📊 Статистика:');
  console.log(`✅ Успешно извлечено: ${successCount} товаров`);
  console.log(`⚠️  Пропущено: ${errorCount} файлов`);
  console.log(`📁 Категорий: ${categories.length}`);
  console.log(`\n💾 Данные сохранены:`);
  console.log(`   - ${productsPath}`);
  console.log(`   - ${categoriesPath}`);
}

// Запуск
main().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});

