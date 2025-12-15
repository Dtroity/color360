const fs = require('fs');
const path = require('path');

console.log('=== CHECKING IMAGES ===\n');

// Читаем products.json
const productsFile = path.join(__dirname, '..', '..', 'data', 'extracted', 'products.json');
const products = JSON.parse(fs.readFileSync(productsFile, 'utf-8'));

// Фильтруем уникальные imageUrl
const imageUrls = [...new Set(
  products
    .filter(p => p.imageUrl && p.name !== 'Оформление заказа')
    .map(p => p.imageUrl)
)];

console.log(`Total unique images in JSON: ${imageUrls.length}\n`);

// Проверяем существование файлов
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'products');
console.log(`Checking uploads directory: ${uploadsDir}\n`);

if (!fs.existsSync(uploadsDir)) {
  console.log('❌ Directory does NOT exist!');
  console.log('\nYou need to:');
  console.log('1. Create directory: mkdir -p apps/backend/uploads/products');
  console.log('2. Copy images there OR download them from source\n');
} else {
  console.log('✅ Directory exists\n');
  
  const filesInDir = fs.readdirSync(uploadsDir);
  console.log(`Files in directory: ${filesInDir.length}\n`);
  
  let found = 0;
  let missing = 0;
  
  imageUrls.slice(0, 20).forEach(url => {
    const filename = url.replace('/uploads/products/', '');
    const fullPath = path.join(uploadsDir, filename);
    
    if (fs.existsSync(fullPath)) {
      found++;
      console.log(`✅ ${filename}`);
    } else {
      missing++;
      console.log(`❌ ${filename} - MISSING`);
    }
  });
  
  if (imageUrls.length > 20) {
    console.log(`\n... and ${imageUrls.length - 20} more images\n`);
  }
  
  console.log(`\nSummary (first 20): Found: ${found}, Missing: ${missing}`);
}

console.log('\n=== END ===');