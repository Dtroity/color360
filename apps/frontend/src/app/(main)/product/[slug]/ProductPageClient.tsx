'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Tab } from '@headlessui/react'; // ИСПРАВЛЕНО: добавлен импорт Tab
import { Product } from '@/shared/api/catalog';
import { useCartStore } from '@/store/useCart';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ShoppingCart, Heart, Scale, ArrowLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { resolveImageUrl } from '@/shared/lib/resolveImageUrl';

interface ProductPageClientProps {
  product: Product;
}

export function ProductPageClient({ product }: ProductPageClientProps) {
  const addToCart = useCartStore((s) => s.addToCart);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Сортируем изображения по sortOrder
  const sortedImages = product.images?.length 
    ? [...product.images].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [];
  const mainImage = sortedImages[selectedImageIndex] || sortedImages[0] || product.images?.[0];
  const mainImgSrc = imageErrors.has(selectedImageIndex)
    ? '/placeholder-product.svg'
    : (mainImage?.url ? resolveImageUrl(mainImage.url) : '/placeholder-product.svg');
  const imgAlt = mainImage?.alt || product.name;
  
  // Логирование для отладки
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ProductPage image:', {
        productId: product.id,
        productSlug: product.slug,
        imageUrl: mainImage?.url,
        resolvedUrl: mainImgSrc,
        imageErrors: Array.from(imageErrors),
      });
    }
  }, [product.id, product.slug, mainImage?.url, mainImgSrc, imageErrors]);

  const handleImageError = (index: number) => (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== '/placeholder-product.svg') {
      target.src = '/placeholder-product.svg';
      setImageErrors((prev) => new Set(prev).add(index));
    }
  };

  const hasDiscount = typeof product.oldPrice === 'number' && product.oldPrice > product.price;
  const inStock = (product.stock ?? 0) > 0;
  const discountPercent = hasDiscount
    ? Math.round(((product.oldPrice! - product.price) / product.oldPrice!) * 100)
    : 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product, 1);
    }
    toast.success(`Товар добавлен в корзину${quantity > 1 ? ` (${quantity} шт.)` : ''}`);
  };

  const attributes = product.attributes || {};
  const attributeEntries = Object.entries(attributes);

  const tabItems = [
    {
      id: 'description',
      label: 'Описание',
      content: (
        <div className="prose prose-sm max-w-none">
          {product.description ? (
            <div dangerouslySetInnerHTML={{ __html: product.description }} />
          ) : (
            <p className="text-neutral-600">Описание отсутствует</p>
          )}
        </div>
      ),
    },
    {
      id: 'specifications',
      label: 'Характеристики',
      content: attributeEntries.length > 0 ? (
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {attributeEntries.map(([key, value]) => (
            <div key={key} className="border-b border-neutral-200 pb-2">
              <dt className="text-sm font-medium text-neutral-700">{key}</dt>
              <dd className="mt-1 text-sm text-neutral-900">{String(value)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-neutral-600">Характеристики отсутствуют</p>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Навигация назад */}
        <Link
          href="/catalog"
          className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Вернуться в каталог
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Левая колонка - изображения */}
          <div>
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <Image
                src={mainImgSrc}
                alt={imgAlt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 600px"
                className="object-contain p-4"
                priority
                onError={handleImageError(selectedImageIndex)}
              />
              {hasDiscount && (
                <div className="absolute right-4 top-4">
                  <Badge variant="alert">
                    -{discountPercent}%
                  </Badge>
                </div>
              )}
            </div>

            {/* Миниатюры */}
            {sortedImages && sortedImages.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-2">
                {sortedImages.map((image, index) => (
                  <button
                    key={image.id || index}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-primary-500'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <Image
                      src={imageErrors.has(index) 
                        ? '/placeholder-product.svg'
                        : resolveImageUrl(image.url)}
                      alt={image.alt || `${product.name} - фото ${index + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                      onError={handleImageError(index)}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Правая колонка - информация */}
          <div className="flex flex-col">
            <div className="mb-4 flex items-center gap-2">
              {product.manufacturer && (
                <Link
                  href={`/brands/${product.manufacturer.slug}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  {product.manufacturer.name}
                </Link>
              )}
              {product.category && (
                <>
                  <span className="text-neutral-400">/</span>
                  <Link
                    href={`/catalog?categories=${product.category.id}`}
                    className="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    {product.category.name}
                  </Link>
                </>
              )}
            </div>

            <h1 className="mb-4 text-3xl font-bold text-neutral-900">{product.name}</h1>

            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-baseline gap-3">
                {hasDiscount && (
                  <span className="text-xl text-neutral-400 line-through">
                    {Number(product.oldPrice).toLocaleString('ru-RU')} {product.currency}
                  </span>
                )}
                <span className="text-4xl font-bold text-neutral-900">
                  {Number(product.price).toLocaleString('ru-RU')} {product.currency}
                </span>
              </div>
            </div>

            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center gap-2">
                {inStock ? (
                  <>
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-600">В наличии</span>
                    <span className="text-sm text-neutral-600">({product.stock} шт.)</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-neutral-500">Под заказ</span>
                  </>
                )}
              </div>
            </div>

            {product.shortDescription && (
              <p className="mb-6 text-neutral-600">{product.shortDescription}</p>
            )}

            <Card className="mb-6 p-4">
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Количество
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-300 hover:bg-neutral-50"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stock || 999}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock || 999, Number(e.target.value))))}
                    className="w-20 rounded-lg border border-neutral-300 px-3 py-2 text-center"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock || 999, quantity + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-300 hover:bg-neutral-50"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="w-full gap-2"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {inStock ? 'Добавить в корзину' : 'Нет в наличии'}
                </Button>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2">
                    <Heart className="h-4 w-4" />
                    В избранное
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <Scale className="h-4 w-4" />
                    Сравнить
                  </Button>
                </div>
              </div>
            </Card>

            <div className="mt-auto space-y-2 text-sm text-neutral-600">
              <div>
                <span className="font-medium">Артикул:</span> {product.sku}
              </div>
              {product.availability && (
                <div>
                  <span className="font-medium">Доступность:</span> {product.availability}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Вкладки с описанием и характеристиками */}
        <div className="mt-12">
          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
              {tabItems.map((item) => (
                <Tab
                  key={item.id}
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all ${
                      selected
                        ? 'bg-white text-blue-700 shadow'
                        : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-600'
                    }`
                  }
                >
                  {item.label}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="mt-4">
              {tabItems.map((item) => (
                <Tab.Panel
                  key={item.id}
                  className="rounded-xl bg-white p-6"
                >
                  {item.content}
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
}