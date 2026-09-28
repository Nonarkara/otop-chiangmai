'use client';
import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import SiteHeader from '@/components/SiteHeader';
import BottomNav from '@/components/BottomNav';
import TrendingTicker from '@/components/TrendingTicker';
import CategoryPill from '@/components/CategoryPill';
import ProductCard from '@/components/ProductCard';
import { useCatalogue } from '@/lib/useCatalogue';

const ProvinceMap = dynamic(() => import('@/components/ProvinceMap'), { ssr: false });

export default function HomePage() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const { products, categories, liveIds } = useCatalogue();

  const trending = useMemo(
    () => [...products].sort((a, b) => {
      const live = Number(liveIds.has(b.id)) - Number(liveIds.has(a.id));
      return live || b.trending_score - a.trending_score;
    }).slice(0, 8),
    [products, liveIds]
  );

  const displayed = useMemo(
    () => activeSlug
      ? products.filter(p => p.category_slug === activeSlug)
      : [...products].sort((a, b) => {
          const live = Number(liveIds.has(b.id)) - Number(liveIds.has(a.id));
          return live || b.trending_score - a.trending_score;
        }),
    [activeSlug, products, liveIds]
  );

  const toggleCategory = (slug: string) =>
    setActiveSlug(prev => prev === slug ? null : slug);

  return (
    <>
      <SiteHeader />

      <main className="main-content">
        {/* Province map — full bleed */}
        <ProvinceMap products={products} height="48dvh" />

        {/* Trending ticker */}
        <TrendingTicker products={trending} />

        {/* Category filter rail */}
        <p className="section-label">
          <span>หมวดหมู่</span>
        </p>
        <div className="category-rail">
          <button
            className={`category-pill${!activeSlug ? ' active' : ''}`}
            onClick={() => setActiveSlug(null)}
            aria-pressed={!activeSlug}
          >
            <span className="category-pill-label thai">ทั้งหมด</span>
          </button>
          {categories.map(cat => (
            <CategoryPill
              key={cat.slug}
              category={cat}
              active={activeSlug === cat.slug}
              onClick={() => toggleCategory(cat.slug)}
            />
          ))}
        </div>

        {/* Product grid */}
        <div className="section-label">
          <span>{activeSlug
            ? categories.find(c => c.slug === activeSlug)?.name_th || 'สินค้า'
            : 'สินค้าแนะนำ'}
          </span>
          <a href="/products" className="section-label-link">ดูทั้งหมด →</a>
        </div>

        <div className="product-grid container">
          {displayed.map(p => <ProductCard key={p.id} product={p} />)}
          {displayed.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '32px 16px', textAlign: 'center' }}>
              <p className="thai" style={{ color: 'var(--dim)', fontSize: 'var(--text-body)' }}>
                ยังไม่มีสินค้าในหมวดนี้
              </p>
            </div>
          )}
        </div>

        {/* Province stats strip */}
        <div style={{
          display: 'flex',
          gap: '1px',
          background: 'var(--line)',
          borderTop: '1px solid var(--line)',
          marginTop: '24px',
        }}>
          {[
            { value: products.length, label: 'สินค้าทั้งหมด' },
            { value: categories.length, label: 'หมวดหมู่' },
            { value: 25, label: 'อำเภอ' },
            { value: products.filter(p => p.contact).length, label: 'ติดต่อได้' },
          ].map(({ value, label }) => (
            <div key={label} style={{
              flex: 1, background: 'var(--bg)', padding: '16px 12px',
              display: 'flex', flexDirection: 'column', gap: '3px',
            }}>
              <span className="mono" style={{ fontSize: '20px', color: 'var(--fg)', lineHeight: 1 }}>
                {value}
              </span>
              <span className="thai" style={{ fontSize: 'var(--text-micro)', color: 'var(--dim)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </>
  );
}
