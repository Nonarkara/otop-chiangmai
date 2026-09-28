import { notFound } from 'next/navigation';
import { SEED_PRODUCTS, SEED_REVIEWS } from '@/lib/seed-data';
import ProductDetail from './ProductDetail';

interface Props { params: Promise<{ slug: string }>; }

export function generateStaticParams() {
  return SEED_PRODUCTS.map(p => ({ slug: p.slug }));
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = SEED_PRODUCTS.find(p => p.slug === slug) ?? null;
  if (!product && process.env.NEXT_PUBLIC_SUPABASE_URL == null) notFound();

  return <ProductDetail product={product} slug={slug} reviews={product ? (SEED_REVIEWS[product.id] || []) : []} />;
}
