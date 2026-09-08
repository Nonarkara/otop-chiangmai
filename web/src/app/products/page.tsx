'use client';
import { useState, useMemo } from 'react';
import SiteHeader from '@/components/SiteHeader';
import BottomNav from '@/components/BottomNav';
import CategoryPill from '@/components/CategoryPill';
import ProductCard from '@/components/ProductCard';
import { SEED_PRODUCTS, SEED_CATEGORIES } from '@/lib/seed-data';

const SORT_OPTIONS = [
  { value: 'trending', label: 'ยอดนิยม' },
  { value: 'score',    label: 'คะแนนสูงสุด' },
  { value: 'price_asc', label: 'ราคาต่ำ–สูง' },
  { value: 'newest',   label: 'ใหม่สุด' },
];

export default function ProductsPage() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [sort, setSort]             = useState('trending');
  const [search, setSearch]         = useState('');

  const filtered = useMemo(() => {
    let list = SEED_PRODUCTS;

    if (activeSlug) list = list.filter(p => p.category_slug === activeSlug);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        p.name_th.toLowerCase().includes(q) ||
        p.name_en.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.district_th.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      switch (sort) {
        case 'score':     return b.ai_effectiveness_score - a.ai_effectiveness_score;
        case 'price_asc': return a.price_min - b.price_min;
        case 'newest':    return b.id.localeCompare(a.id); // seed ID proxy for recency
        default:          return b.trending_score - a.trending_score;
      }
    });
  }, [activeSlug, sort, search]);

  return (
    <>
      <SiteHeader />

      <main className="main-content">
        {/* Search bar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
          <input
            type="search"
            placeholder="ค้นหาสินค้า เช่น เซลาดอน กาแฟ ร่ม…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="thai"
            style={{
              width: '100%',
              height: '44px',
              padding: '0 12px',
              border: '1px solid var(--line)',
              background: 'var(--bg)',
              color: 'var(--fg)',
              fontSize: 'var(--text-body)',
              fontFamily: 'var(--font-thai)',
              outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
            onBlur={e  => (e.target.style.borderColor = 'var(--line)')}
          />
        </div>

        {/* Category rail */}
        <div className="category-rail" style={{ borderBottom: '1px solid var(--line)' }}>
          <button
            className={`category-pill${!activeSlug ? ' active' : ''}`}
            onClick={() => setActiveSlug(null)}
          >
            <span className="category-pill-label thai">ทั้งหมด</span>
          </button>
          {SEED_CATEGORIES.map(cat => (
            <CategoryPill
              key={cat.slug}
              category={cat}
              active={activeSlug === cat.slug}
              onClick={() => setActiveSlug(prev => prev === cat.slug ? null : cat.slug)}
            />
          ))}
        </div>

        {/* Sort + result count */}
        <div style={{
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--line)',
        }}>
          <span className="thai" style={{ fontSize: 'var(--text-micro)', color: 'var(--dim)' }}>
            {filtered.length} สินค้า
          </span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="thai"
            style={{
              height: '44px',
              padding: '0 8px',
              border: '1px solid var(--line)',
              background: 'var(--bg)',
              color: 'var(--fg)',
              fontSize: 'var(--text-micro)',
              fontFamily: 'var(--font-thai)',
              cursor: 'pointer',
            }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        <div className="product-grid">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '48px 16px', textAlign: 'center' }}>
              <p className="thai" style={{ color: 'var(--dim)' }}>ไม่พบสินค้าที่ตรงกับการค้นหา</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </>
  );
}
