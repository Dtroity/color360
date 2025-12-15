import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

const SOURCE_DIR = 'C:\\Users\\Detroyti\\Documents\\GitHub\\hiwatch_site';

interface ProductData {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  oldPrice?: number;
  inStock: boolean;
  imageUrl: string;
  manufacturer: { id: number; name: string };
  category: { id: number; name: string };
  specifications?: Record<string, string>;
}

const cleanText = (text: string) =>
  text.replace(/\s+/g, ' ').trim();

const toSlug = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const parseHtmlFile = (filePath: string, id: number): ProductData | null => {
  try {
    const html = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(html);

    const name = cleanText($('.product h1, h1').first().text() || '');
    if (!name) return null;

    const sku = cleanText($('.product-info .model, .sku').first().text().replace(/Модель:|SKU:/gi, ''));
    const description = cleanText($('.product-info p, .description p').first().text());
    
    const priceText = $('.price, .product-price').first().text().replace(/[^\d]/g, '');
    const price = parseInt(priceText) || Math.floor(Math.random() * 10000) + 2000;
    
    const oldPriceText = $('.price-old, .old-price').first().text().replace(/[^\d]/g, '');
    const oldPrice = oldPriceText ? parseInt(oldPriceText) : undefined;

    const imageSrc = $('img[src*="image/catalog"], .product-image img').first().attr('src') || '';
    const imageUrl = imageSrc ? `/uploads/products/${toSlug(path.basename(imageSrc, path.extname(imageSrc)))}.jpg` : '/uploads/products/placeholder.jpg';

    const manufacturerName = name.split(' ')[0] || 'HiWatch';
    
    const categoryFromPath = path.dirname(filePath).split(path.sep).pop() || 'IP-камеры';
    const categoryName = categoryFromPath.includes('ip') ? 'IP-камеры' 
      : categoryFromPath.includes('tvi') ? 'TVI-камеры'
      : categoryFromPath.includes('domofoniya') ? 'Домофония'
      : categoryFromPath.includes('aksessuary') ? 'Аксессуары'
      : 'IP-камеры';

    const specs: Record<string, string> = {};
    $('.product-info table tr, .specifications tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length === 2) {
        const key = cleanText($(cells[0]).text());
        const value = cleanText($(cells[1]).text());
        if (key && value) specs[key] = value;
      }
    });

    return {
      id,
      name,
      slug: toSlug(name),
      sku: sku || `SKU-${id}`,
      description: description || name,
      price,
      oldPrice,
      inStock: Math.random() > 0.2,
      imageUrl,
      manufacturer: { 
        id: manufacturerName === 'Hikvision' ? 2 : manufacturerName === 'Dahua' ? 3 : 1, 
        name: manufacturerName 
      },
      category: { 
        id: categoryName === 'IP-камеры' ? 1 : categoryName === 'TVI-камеры' ? 2 : 3, 
        name: categoryName 
      },
      specifications: Object.keys(specs).length > 0 ? specs : undefined,
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
};

const main = () => {
  const products: ProductData[] = [];
  let id = 1;

  // Найдём первые 100 HTML файлов с товарами
  const ipCameraPatterns = [
    'ds-i*.html',
    'ds-2cd*.html',
    'ipc-*.html',
    'ds-pd*.html',
  ];

  ipCameraPatterns.forEach(pattern => {
    const files = fs.readdirSync(SOURCE_DIR).filter(f => 
      f.match(new RegExp(pattern.replace('*', '.*'))) && !f.includes('&add=true')
    ).slice(0, 50);

    files.forEach(file => {
      const product = parseHtmlFile(path.join(SOURCE_DIR, file), id);
      if (product) {
        products.push(product);
        id++;
      }
    });
  });

  console.log(`Parsed ${products.length} products`);

  // Генерируем TypeScript файл
  const tsContent = `export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  oldPrice?: number;
  inStock: boolean;
  imageUrl: string;
  manufacturer: {
    id: number;
    name: string;
  };
  category: {
    id: number;
    name: string;
  };
  specifications?: Record<string, string>;
}

export const mockProducts: Product[] = ${JSON.stringify(products, null, 2)};
`;

  const outputPath = path.join(__dirname, '..', 'apps', 'frontend', 'src', 'data', 'mockProducts.ts');
  fs.writeFileSync(outputPath, tsContent, 'utf-8');
  console.log(`Generated ${outputPath} with ${products.length} products`);
};

main();
