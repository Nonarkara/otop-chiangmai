'use client';
import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import SiteHeader from '@/components/SiteHeader';
import BottomNav from '@/components/BottomNav';
import TrendingTicker from '@/components/TrendingTicker';
import CategoryPill from '@/components/CategoryPill';
import ProductCard from '@/components/ProductCard';
import { SEED_PRODUCTS, SEED_CATEGORIES } from '@/lib/seed-data';

const ProvinceMap = dynamic(() => import('@/components/ProvinceMap'), { ssr: false });

export default function HomePage() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const trending = useMemo(
    () => [...SEED_PRODUCTS].sort((a, b) => b.trending_score - a.trending_score).slice(0, 8),
    []
  );

  const displayed = useMemo(
    () => activeSlug
      ? SEED_PRODUCTS.filter(p => p.category_slug === activeSlug)
      : [...SEED_PRODUCTS].sort((a, b) => b.trending_score - a.trending_score),
    [activeSlug]
  );

  const toggleCategory = (slug: string) =>
    setActiveSlug(prev => prev === slug ? null : slug);

  return (
    <>
      <SiteHeader />

      <main className="main-content">
        {/* Province map — full bleed */}
        <ProvinceMap products={SEED_PRODUCTS} height="48dvh" />

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
          {SEED_CATEGORIES.map(cat => (
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
            ? SEED_CATEGORIES.find(c => c.slug === activeSlug)?.name_th || 'สินค้า'
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
            { value: SEED_PRODUCTS.length, label: 'สินค้าทั้งหมด' },
            { value: SEED_CATEGORIES.length, label: 'หมวดหมู่' },
            { value: 25, label: 'อำเภอ' },
            { value: `${Math.round(SEED_PRODUCTS.reduce((s, p) => s + p.ai_effectiveness_score, 0) / SEED_PRODUCTS.length)}`, label: 'คะแนนเฉลี่ย' },
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
