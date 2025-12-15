import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/shared/api/catalog';
import { useCartStore } from '@/store/useCart';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Heart, ShoppingCart, BarChart3 } from 'lucide-react';
import { resolveImageUrl } from '@/shared/lib/resolveImageUrl';

interface ProductCardProps {
  product: Product;
  view?: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, view = 'grid' }) => {
  const addToCart = useCartStore((s) => s.addToCart);
  const [imageError, setImageError] = React.useState(false);

  const isNew = React.useMemo(() => {
    const created = new Date(product.createdAt);
    const daysDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30;
  }, [product.createdAt]);

  const hasDiscount = typeof product.oldPrice === 'number' && product.oldPrice > (product.price ?? 0);
  const inStock = (product.stock ?? 0) > 0;

  // Сортируем изображения по sortOrder, если есть
  const sortedImages = product.images?.length 
    ? [...product.images].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [];
  const mainImage = sortedImages[0] || product.images?.[0];
  const imgSrc = imageError 
    ? '/placeholder-product.svg'
    : (mainImage?.url ? resolveImageUrl(mainImage.url) : '/placeholder-product.svg');
  const imgAlt = mainImage?.alt ?? product.name;
  
  // #region agent log
  React.useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'ProductCard.tsx:36',
        message: 'Image resolution',
        data: {
          productId: product.id,
          productSlug: product.slug,
          originalUrl: mainImage?.url,
          resolvedUrl: imgSrc,
          imageError,
          hasImages: !!product.images?.length,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B'
      })
    }).catch(() => {});
  }, [product.id, product.slug, mainImage?.url, imgSrc, imageError, product.images]);
  // #endregion

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const placeholder = '/placeholder-product.svg';
    console.warn('ProductCard image failed to load:', {
      productId: product.id,
      productSlug: product.slug,
      attemptedUrl: target.src,
      imageUrl: mainImage?.url,
    });
    if (target.src !== placeholder && !target.src.includes(placeholder)) {
      target.src = placeholder;
      setImageError(true);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  // Универсальный путь к товару: используем slug, если есть, иначе id
  const productPath = product.slug 
    ? `/product/${product.slug}` 
    : `/product/id/${product.id}`;

  if (view === 'list') {
    return (
      <Link
        href={productPath}
        className="group flex gap-4 rounded-lg border border-neutral-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-md"
      >
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
          <Image
            src={imgSrc}
            alt={imgAlt}
            fill
            sizes="128px"
            className="object-cover"
            onError={handleImageError}
          />
          <div className="absolute left-2 top-2 flex gap-2">
            {isNew && <Badge variant="info">Новинка</Badge>}
            {hasDiscount && <Badge variant="alert">Скидка</Badge>}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div>
            <h3 className="line-clamp-2 font-medium text-neutral-900 group-hover:text-primary-600">
              {product.name}
            </h3>
            <p className="text-xs text-neutral-500">Артикул: {product.sku}</p>
          </div>

          {product.shortDescription && (
            <p className="line-clamp-2 text-sm text-neutral-600">
              {product.shortDescription}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {hasDiscount && (
                <span className="text-sm text-neutral-400 line-through">
                  {Number(product.oldPrice).toLocaleString('ru-RU')} {product.currency}
                </span>
              )}
              <span className="text-lg font-bold text-neutral-900">
                {Number(product.price).toLocaleString('ru-RU')} {product.currency}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs ${inStock ? 'text-green-600' : 'text-neutral-500'}`}>
                {inStock ? 'В наличии' : 'Под заказ'}
              </span>
              <Button
                size="base"
                onClick={handleAddToCart}
                className="gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                В корзину
              </Button>
            </div>
          </div>
        </div>
      </Link>
    );
  }


  return (
    <Link
      href={productPath}
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
        <Image
          src={imgSrc}
          alt={imgAlt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform group-hover:scale-105"
          onError={handleImageError}
        />
        <div className="absolute left-2 top-2 flex gap-2">
          {isNew && <Badge variant="info">Новинка</Badge>}
          {hasDiscount && <Badge variant="alert">Скидка</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3
          className="line-clamp-2 min-h-[2.5rem] font-medium text-neutral-900 transition-colors group-hover:text-primary-600"
          title={product.name}
        >
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-neutral-500">Артикул: {product.sku}</p>

        <div className="mt-3 flex items-baseline gap-2">
          {hasDiscount && (
            <span className="text-sm text-neutral-400 line-through">
              {Number(product.oldPrice).toLocaleString('ru-RU')} {product.currency}
            </span>
          )}
          <span className="text-lg font-bold text-neutral-900">
            {Number(product.price).toLocaleString('ru-RU')} {product.currency}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className={`text-xs font-medium ${inStock ? 'text-green-600' : 'text-neutral-500'}`}>
            {inStock ? 'В наличии' : 'Под заказ'}
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            onClick={handleAddToCart}
            className="flex-1 gap-2"
            size="base"
          >
            <ShoppingCart className="h-4 w-4" />
            В корзину
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="В избранное"
            title="В избранное"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: wishlist functionality
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Сравнить"
            title="Сравнить"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: compare functionality
            }}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
};

export { ProductCard };
export default ProductCard;

