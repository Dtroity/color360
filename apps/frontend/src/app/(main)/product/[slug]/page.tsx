import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductPageClient } from './ProductPageClient';
import { catalogApi } from '@/shared/api/catalog';
import Breadcrumbs from '@/widgets/Breadcrumbs';

type ProductPageProps = {
  params: { slug: string };
};

async function getProductBySlug(slug: string) {
  try {
    return await catalogApi.getProductBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
  const params = await props.params;
  const product = await getProductBySlug(params.slug);

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

export default async function ProductPage(props: ProductPageProps) {
  const params = await props.params;
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <Breadcrumbs />
      <ProductPageClient product={product} />
    </>
  );
}
