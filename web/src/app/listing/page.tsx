'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ProductDetail from '../products/[slug]/ProductDetail';
import { loadLiveProducts } from '@/lib/catalog';
import type { Product } from '@/lib/types';

function ListingView() {
  const slug = useSearchParams().get('slug') || '';
  const [product, setProduct] = useState<Product | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!slug) {
      setMissing(true);
      return;
    }
    let cancelled = false;
    loadLiveProducts().then(rows => {
      if (cancelled) return;
      const found = rows.find(p => p.slug === slug) ?? null;
      setProduct(found);
      setMissing(!found);
    });
    return () => { cancelled = true; };
  }, [slug]);

  return <ProductDetail product={missing ? null : product} slug={slug} reviews={[]} />;
}

export default function ListingPage() {
  return (
    <Suspense fallback={null}>
      <ListingView />
    </Suspense>
  );
}
