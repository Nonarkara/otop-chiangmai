'use client';
import dynamic from 'next/dynamic';
import SiteHeader from '@/components/SiteHeader';
import BottomNav from '@/components/BottomNav';
import EffectivenessScore from '@/components/EffectivenessScore';
import ReviewCard from '@/components/ReviewCard';
import type { Product, Review } from '@/lib/types';

const ProvinceMap = dynamic(() => import('@/components/ProvinceMap'), { ssr: false });

interface Props { product: Product; reviews: Review[]; }

export default function ProductDetail({ product, reviews }: Props) {
  const otopStars = Array.from({ length: 5 }, (_, i) => i < product.otop_star_rating);
  const hasImage  = product.images && product.images.length > 0;

  return (
    <>
      <SiteHeader />

      <main className="main-content">
        <article className="product-detail">
          {/* Hero image / placeholder */}
          <div className="product-detail-hero">
            {hasImage ? (
              <img src={product.images[0]} alt={product.name_en || product.name_th} />
            ) : (
              <div className="product-detail-hero-placeholder">
                <span style={{ fontSize: '64px', color: 'var(--amber)', opacity: 0.25 }}>
                  {product.category_icon}
                </span>
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="product-detail-meta">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span className="thai" style={{ fontSize: 'var(--text-micro)', color: 'var(--amber)', fontWeight: 500 }}>
                {product.category}
              </span>
              <span style={{ fontSize: 'var(--text-micro)', color: 'var(--dim)' }}>·</span>
              <span className="thai" style={{ fontSize: 'var(--text-micro)', color: 'var(--dim)' }}>
                {product.district_th}
              </span>
              <span style={{ fontSize: 'var(--text-micro)', color: 'var(--dim)' }}>·</span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-micro)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: product.platform_source === 'line' ? '#06c755' : '#229ed9',
              }}>
                {product.platform_source === 'line' ? 'LINE' : 'TELEGRAM'}
              </span>
            </div>

            <h1 className="product-detail-name-th thai">{product.name_th}</h1>
            <p className="product-detail-name-en">{product.name_en}</p>

            <div className="product-detail-price mono">
              ฿{product.price_min.toLocaleString()}
              {product.price_max > product.price_min && `–${product.price_max.toLocaleString()}`} บาท
            </div>

            {/* Badges */}
            <div className="product-detail-badges">
              {/* OTOP Star rating */}
              <div className="info-chip">
                <span className="info-chip-label">OTOP</span>
                <div className="otop-stars">
                  {otopStars.map((f, i) => (
                    <div key={i} className={`otop-star${f ? ' filled' : ''}`} />
                  ))}
                </div>
                <span className="info-chip-value">{product.otop_star_rating} ดาว</span>
              </div>

              {/* AI Score */}
              <div className="info-chip">
                <span className="info-chip-label">คะแนน AI</span>
                <EffectivenessScore score={product.ai_effectiveness_score} size="lg" />
              </div>

              {/* Reviews */}
              {product.review_count > 0 && (
                <div className="info-chip">
                  <span className="info-chip-label">รีวิว</span>
                  <span className="info-chip-value mono">
                    ★ {product.avg_rating.toFixed(1)} ({product.review_count})
                  </span>
                </div>
              )}
            </div>

            {/* Seller */}
            {product.seller_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dim)' }}>
                  ผู้ขาย
                </span>
                <span className="thai" style={{ fontSize: 'var(--text-body)', color: 'var(--fg)' }}>
                  {product.seller_name}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="product-detail-section">
            <div className="product-detail-section-label">รายละเอียดสินค้า</div>
            <p className="product-detail-desc-th thai">{product.description_th}</p>
            <p className="product-detail-desc-en">{product.description_en}</p>
          </div>

          {/* Map — only if coordinates available */}
          {typeof product.lat === 'number' && typeof product.lon === 'number' && (
            <div className="product-detail-section">
              <div className="product-detail-section-label">แหล่งผลิต — {product.district_th}</div>
              <ProvinceMap
                products={[product]}
                height="220px"
                interactive={false}
              />
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="product-detail-section">
              <div className="product-detail-section-label">
                รีวิวจากผู้ซื้อ ({reviews.length})
              </div>
              {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
            </div>
          )}

          {/* Back */}
          <div style={{ marginTop: '40px', borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
            <a href="/products" style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-micro)',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--dim)',
            }}>
              ← กลับไปหน้าสินค้า
            </a>
          </div>

          <div style={{ height: '24px' }} />
        </article>
      </main>

      <BottomNav />
    </>
  );
}
