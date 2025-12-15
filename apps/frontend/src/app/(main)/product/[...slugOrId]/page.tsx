import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductPageClient } from '../[slug]/ProductPageClient';
import { catalogApi } from '@/shared/api/catalog';
import { API_BASE_URL } from '@/shared/config/api';

type ProductPageProps = {
  params: { slugOrId: string[] };
};

async function getProduct(slugOrId: string) {
  try {
    // Пробуем сначала как slug
    try {
      return await catalogApi.getProductBySlug(slugOrId);
    } catch {
      // Если не получилось, пробуем как id
      const id = Number(slugOrId);
      if (!Number.isNaN(id)) {
        const response = await fetch(`${API_BASE_URL}/api/products/id/${id}`, {
          cache: 'no-store',
        });
        if (response.ok) {
          return await response.json();
        }
      }
      return null;
    }
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const slugOrId = params.slugOrId?.[0] || '';
  const product = await getProduct(slugOrId);

  if (!product) {
    return {
      title: 'Товар не найден',
    };
  }

  return {
    title: `${product.name} — ИП Визе В.Н.`,
    description: product.shortDescription || product.description || `Купить ${product.name} в интернет-магазине`,
    openGraph: {
      title: product.name,
      description: product.shortDescription || '',
      images: product.images?.[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const slugOrId = params.slugOrId?.[0] || '';
  const product = await getProduct(slugOrId);

  if (!product) {
    notFound();
  }

  return <ProductPageClient product={product} />;
}

