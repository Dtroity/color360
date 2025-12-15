-- Backup created at 2025-12-10T21:54:47.761Z
-- Tables: products, product_images

-- Table: products (5 rows)
DELETE FROM product_images WHERE "productId" IN (SELECT id FROM products);
DELETE FROM products;

INSERT INTO products ("id", "name", "slug", "sku", "shortDescription", "description", "price", "oldPrice", "currency", "stock", "isActive", "availability", "externalId", "attributes", "metadata", "seo", "createdAt", "updatedAt", "manufacturerId", "categoryId") VALUES
  (1, 'IP Љ ¬Ґа  HiWatch DS-I200C', 'hiwatch-ds-i200c', 'SKU001', 'Љ®¬Ї Єв­ п IP Є ¬Ґа  2ЊЇ', '“«Ёз­ п IP Є ¬Ґа  б €Љ Ї®¤бўҐвЄ®© ¤® 30¬, а §аҐиҐ­ЁҐ 1920x1080, ®ЎкҐЄвЁў 2.8¬¬', '5990.00', NULL, 'RUB', 10, TRUE, NULL, NULL, NULL, NULL, NULL, '2025-12-09T17:26:50.953Z', '2025-12-09T17:26:50.953Z', 1, 1),
  (2, 'IP Љ ¬Ґа  HiWatch DS-I400C', 'hiwatch-ds-i400c', 'SKU002', 'IP Є ¬Ґа  4ЊЇ б €Љ Ї®¤бўҐвЄ®©', 'ЉгЇ®«м­ п IP Є ¬Ґа  4ЊЇ б €Љ Ї®¤бўҐвЄ®© ¤® 20¬, H.265, microSD ¤® 256Gb', '8990.00', NULL, 'RUB', 15, TRUE, NULL, NULL, NULL, NULL, NULL, '2025-12-09T17:26:50.953Z', '2025-12-09T17:26:50.953Z', 1, 1),
  (3, 'IP Љ ¬Ґа  Dahua IPC-HFW1230S1', 'dahua-ipc-hfw1230s1', 'SKU003', '“«Ёз­ п IP Є ¬Ґа  2ЊЇ', '–Ё«Ё­¤аЁзҐбЄ п Є ¬Ґа  Dahua 2ЊЇ, €Љ ¤® 30¬, IP67, PoE', '6990.00', NULL, 'RUB', 8, TRUE, NULL, NULL, NULL, NULL, NULL, '2025-12-09T17:26:50.953Z', '2025-12-09T17:26:50.953Z', 1, 1),
  (4, 'IP Љ ¬Ґа  Uniview IPC2122SR3', 'uniview-ipc2122sr3', 'SKU004', 'Љ ¬Ґа  Uniview 2ЊЇ', 'Љ®¬Ї Єв­ п Є ¬Ґа  б дЁЄбЁа®ў ­­л¬ ®ЎкҐЄвЁў®¬ 2.8¬¬', '7490.00', NULL, 'RUB', 12, TRUE, NULL, NULL, NULL, NULL, NULL, '2025-12-09T17:26:50.953Z', '2025-12-09T17:26:50.953Z', 1, 1),
  (5, 'IP Љ ¬Ґа  EZVIZ C3N', 'ezviz-c3n', 'SKU005', 'Wi-Fi Є ¬Ґа  EZVIZ', 'ЃҐбЇа®ў®¤­ п Є ¬Ґа  б ®Ў« з­л¬ еа ­Ґ­ЁҐ¬, microSD, ­®з­®Ґ ўЁ¤Ґ­ЁҐ', '4990.00', NULL, 'RUB', 20, TRUE, NULL, NULL, NULL, NULL, NULL, '2025-12-09T17:26:50.953Z', '2025-12-09T17:26:50.953Z', 1, 1);

-- Table: product_images (5 rows)
INSERT INTO product_images ("id", "url", "alt", "sortOrder", "createdAt", "updatedAt", "productId") VALUES
  (1, '/uploads/products/1/0.webp', 'IP Љ ¬Ґа  HiWatch DS-I200C', 0, '2025-12-09T17:26:58.682Z', '2025-12-09T17:26:58.682Z', 1),
  (2, '/uploads/products/2/0.webp', 'IP Љ ¬Ґа  HiWatch DS-I400C', 0, '2025-12-09T17:26:58.682Z', '2025-12-09T17:26:58.682Z', 2),
  (3, '/uploads/products/3/0.webp', 'IP Љ ¬Ґа  Dahua IPC-HFW1230S1', 0, '2025-12-09T17:26:58.682Z', '2025-12-09T17:26:58.682Z', 3),
  (4, '/uploads/products/4/0.webp', 'IP Љ ¬Ґа  Uniview IPC2122SR3', 0, '2025-12-09T17:26:58.682Z', '2025-12-09T17:26:58.682Z', 4),
  (5, '/uploads/products/5/0.webp', 'IP Љ ¬Ґа  EZVIZ C3N', 0, '2025-12-09T17:26:58.682Z', '2025-12-09T17:26:58.682Z', 5);

