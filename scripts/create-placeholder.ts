import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const placeholderPath = path.join(
  __dirname,
  '..',
  'apps',
  'frontend',
  'public',
  'uploads',
  'products',
  'placeholder.jpg'
);

// Создаем простое изображение 800x800 с серым фоном и текстом
async function createPlaceholder() {
  const svg = `
    <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="800" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">Нет изображения</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .jpeg({ quality: 80 })
    .toFile(placeholderPath);

  console.log(`✅ Placeholder создан: ${placeholderPath}`);
}

createPlaceholder().catch(console.error);

