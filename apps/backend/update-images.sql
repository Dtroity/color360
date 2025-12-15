-- ============================================
-- СКРИПТ ОБНОВЛЕНИЯ ИЗОБРАЖЕНИЙ ТОВАРОВ
-- ============================================
-- Обновляет все изображения товаров на placeholder
-- Выполнить в pgAdmin или через psql
-- ============================================

-- 1. Обновляем таблицу product_images
-- Обновляем все изображения, которые имеют старые пути или пустые
UPDATE product_images
SET url = '/placeholder-product.svg'
WHERE url IS NULL 
   OR url = ''
   OR url LIKE '/uploads/products/%'
   OR url NOT LIKE '/placeholder-product.svg';

-- 2. Проверяем структуру таблицы products
-- Показываем какие поля отвечают за изображения
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND (column_name LIKE '%image%' 
       OR column_name LIKE '%metadata%'
       OR column_name LIKE '%url%')
ORDER BY ordinal_position;

-- 3. Проверяем структуру таблицы product_images
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'product_images'
ORDER BY ordinal_position;

-- 4. Показываем примеры товаров с изображениями (до обновления)
SELECT 
    p.id,
    p.name,
    p.sku,
    COUNT(pi.id) as image_count,
    STRING_AGG(pi.url, ', ') as image_urls
FROM products p
LEFT JOIN product_images pi ON pi."productId" = p.id
WHERE p."isActive" = true
GROUP BY p.id, p.name, p.sku
ORDER BY p.id
LIMIT 10;

-- 5. Показываем товары без изображений
SELECT 
    p.id,
    p.name,
    p.sku,
    COUNT(pi.id) as image_count
FROM products p
LEFT JOIN product_images pi ON pi."productId" = p.id
WHERE p."isActive" = true
GROUP BY p.id, p.name, p.sku
HAVING COUNT(pi.id) = 0
LIMIT 10;

-- 6. Создаём placeholder изображения для товаров без изображений
-- (Если нужно создать запись в product_images для товаров без изображений)
INSERT INTO product_images (url, alt, "sortOrder", "productId", "createdAt", "updatedAt")
SELECT 
    '/placeholder-product.svg' as url,
    p.name as alt,
    0 as "sortOrder",
    p.id as "productId",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM products p
WHERE p."isActive" = true
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi 
    WHERE pi."productId" = p.id
  );

-- 7. Проверяем результат после обновления
SELECT 
    p.id,
    p.name,
    p.sku,
    COUNT(pi.id) as image_count,
    STRING_AGG(pi.url, ', ') as image_urls
FROM products p
LEFT JOIN product_images pi ON pi."productId" = p.id
WHERE p."isActive" = true
GROUP BY p.id, p.name, p.sku
ORDER BY p.id
LIMIT 10;

-- 8. Статистика обновления
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN pi.id IS NOT NULL THEN 1 END) as products_with_images,
    COUNT(CASE WHEN pi.id IS NULL THEN 1 END) as products_without_images,
    COUNT(CASE WHEN pi.url = '/placeholder-product.svg' THEN 1 END) as products_with_placeholder
FROM products p
LEFT JOIN product_images pi ON pi."productId" = p.id AND pi."sortOrder" = 0
WHERE p."isActive" = true;

