import React from 'react';
import { Product } from '../../shared/api/catalog';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
}

const SkeletonCard: React.FC = () => (
  <div className="skeleton-card">
    <div className="skeleton-image" />
    <div className="skeleton-line" />
    <div className="skeleton-line short" />
    <div className="skeleton-line price" />
    <style jsx>{`
      .skeleton-card { background: #fff; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden; }
      .skeleton-image { width: 100%; aspect-ratio: 1/1; background: #f5f5f5; }
      .skeleton-line { height: 12px; margin: 10px 8px; background: #f0f0f0; border-radius: 6px; }
      .skeleton-line.short { width: 60%; }
      .skeleton-line.price { width: 40%; }
    `}</style>
  </div>
);

const ProductGrid: React.FC<ProductGridProps> = ({ products, isLoading }) => {
  const showEmpty = !isLoading && (!products || products.length === 0);

  return (
    <div className="product-grid">
      {isLoading && (
        Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)
      )}

      {!isLoading && products && products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}

      {showEmpty && (
        <div className="grid-empty">Товары не найдены</div>
      )}

      <style jsx>{`
        .product-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 768px) {
          .product-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .product-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1280px) {
          .product-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .grid-empty { grid-column: 1 / -1; text-align: center; color: #8c8c8c; padding: 20px 0; }
      `}</style>
    </div>
  );
};

export default ProductGrid;
