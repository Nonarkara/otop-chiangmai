'use client';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import EffectivenessScore from './EffectivenessScore';

interface Props { product: Product; }

export default function ProductCard({ product }: Props) {
  const {
    slug, name_th, name_en, category, category_icon,
    district_th, price_min, price_max,
    images, ai_effectiveness_score, platform_source,
  } = product;

  const hasImage = images && images.length > 0;

  return (
    <Link href={platform_source === 'manual' ? `/listing?slug=${slug}` : `/products/${slug}`} className="product-card">
      <div className="product-card-image">
        {hasImage ? (
          <img src={images[0]} alt={name_en || name_th} loading="lazy" />
        ) : (
          <div className="product-card-placeholder">
            <span className="product-card-placeholder-icon">{category_icon || '◈'}</span>
          </div>
        )}
        <div className="product-card-platform">
          {platform_source === 'line' ? 'LINE' : platform_source === 'telegram' ? 'TG' : 'ใหม่'}
        </div>
      </div>

      <div className="product-card-body">
        <div className="product-card-category thai">{category}</div>
        <div className="product-card-name-th thai">{name_th}</div>
        {name_en && <div className="product-card-name-en">{name_en}</div>}
        <div className="product-card-footer">
          <span className="product-card-price mono">
            ฿{price_min.toLocaleString()}
            {price_max > price_min && `–${price_max.toLocaleString()}`}
          </span>
          {product.contact
            ? <span className="thai" style={{ fontSize: 'var(--text-micro)', color: 'var(--amber)' }}>{product.contact}</span>
            : <EffectivenessScore score={ai_effectiveness_score} />}
        </div>
        <div className="product-card-district thai">{district_th}</div>
      </div>
    </Link>
  );
}
