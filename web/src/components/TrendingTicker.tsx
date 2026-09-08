'use client';
import type { Product } from '@/lib/types';

interface Props { products: Product[]; }

export default function TrendingTicker({ products }: Props) {
  if (!products.length) return null;
  // Duplicate for seamless loop
  const items = [...products, ...products];

  return (
    <div className="ticker" role="marquee" aria-label="สินค้ายอดนิยม">
      <div className="ticker-label" aria-hidden>▶</div>
      <div className="ticker-track" aria-hidden>
        <div className="ticker-content">
          {items.map((p, i) => (
            <span key={`${p.id}-${i}`} className="ticker-item thai">
              {p.name_th} · {p.district_th}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
