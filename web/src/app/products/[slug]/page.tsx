import { notFound } from 'next/navigation';
import { SEED_PRODUCTS, SEED_REVIEWS } from '@/lib/seed-data';
import ProductDetail from './ProductDetail';

interface Props { params: Promise<{ slug: string }>; }

// Static export needs the full slug list at build time.
export function generateStaticParams() {
  return SEED_PRODUCTS.map(p => ({ slug: p.slug }));
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = SEED_PRODUCTS.find(p => p.slug === slug);
  if (!product) notFound();

  return <ProductDetail product={product} reviews={SEED_REVIEWS[product.id] || []} />;
}
