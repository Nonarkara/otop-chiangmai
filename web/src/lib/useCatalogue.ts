'use client';
import { useEffect, useMemo, useState } from 'react';
import { SEED_CATEGORIES, SEED_PRODUCTS } from './seed-data';
import { loadLiveProducts } from './catalog';
import type { Product } from './types';

export function useCatalogue() {
  const [live, setLive] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadLiveProducts().then(rows => {
      if (!cancelled) setLive(rows);
    });
    return () => { cancelled = true; };
  }, []);

  const liveIds = useMemo(() => new Set(live.map(p => p.id)), [live]);

  const products = useMemo(() => {
    const slugs = new Set(live.map(p => p.slug));
    return [...live, ...SEED_PRODUCTS.filter(p => !slugs.has(p.slug))];
  }, [live]);

  return { products, live, liveIds, categories: SEED_CATEGORIES };
}
