'use client';
import SiteHeader from '@/components/SiteHeader';
import BottomNav from '@/components/BottomNav';
import { SEED_PRODUCTS, SEED_CATEGORIES } from '@/lib/seed-data';

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="stat-block">
      <span className="stat-block-value mono">{value}</span>
      <span className="stat-block-label thai">{label}</span>
    </div>
  );
}

function CategoryBarChart() {
  const cats = SEED_CATEGORIES.map(cat => {
    const count = SEED_PRODUCTS.filter(p => p.category_slug === cat.slug).length;
    const avg = SEED_PRODUCTS
      .filter(p => p.category_slug === cat.slug)
      .reduce((s, p, _, a) => s + p.ai_effectiveness_score / a.length, 0);
    return { ...cat, count, avg: Math.round(avg) };
  }).sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...cats.map(c => c.count), 1);

  return (
    <div className="bar-chart">
      <div className="bar-chart-title">สินค้าตามหมวดหมู่</div>
      {cats.map(cat => (
        <div key={cat.slug} className="bar-row">
          <span className="bar-row-label thai">{cat.name_th}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(cat.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="bar-row-value">{cat.count}</span>
        </div>
      ))}
    </div>
  );
}

function DistrictRankings() {
  // Build from seed data
  const districtMap: Record<string, { count: number; score: number }> = {};
  for (const p of SEED_PRODUCTS) {
    if (!districtMap[p.district_th]) districtMap[p.district_th] = { count: 0, score: 0 };
    districtMap[p.district_th].count++;
    districtMap[p.district_th].score += p.ai_effectiveness_score;
  }
  const districts = Object.entries(districtMap)
    .map(([name, { count, score }]) => ({
      name,
      count,
      avg: Math.round(score / count),
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...districts.map(d => d.count), 1);

  return (
    <div className="bar-chart">
      <div className="bar-chart-title">อำเภอที่มีสินค้ามากที่สุด</div>
      {districts.map(d => (
        <div key={d.name} className="bar-row">
          <span className="bar-row-label thai">{d.name}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(d.count / maxCount) * 100}%` }} />
          </div>
          <span className="bar-row-value">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

function TopProducts() {
  const top = [...SEED_PRODUCTS]
    .sort((a, b) => b.ai_effectiveness_score - a.ai_effectiveness_score)
    .slice(0, 5);

  return (
    <div className="bar-chart" style={{ gridColumn: '1 / -1' }}>
      <div className="bar-chart-title">สินค้าคะแนนสูงสุด</div>
      {top.map((p, i) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '44px', borderBottom: '1px solid var(--line)', padding: '8px 0' }}>
          <span className="mono" style={{ fontSize: 'var(--text-micro)', color: 'var(--dim)', minWidth: '16px' }}>{i + 1}</span>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span className="thai" style={{ fontSize: 'var(--text-body)', color: 'var(--fg)' }}>{p.name_th}</span>
            <span className="thai" style={{ fontSize: 'var(--text-micro)', color: 'var(--dim)' }}>{p.district_th} · {p.category}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <span className="mono" style={{ fontSize: 'var(--text-body)', color: 'var(--amber)' }}>{p.ai_effectiveness_score}</span>
            <span style={{ fontSize: 'var(--text-micro)', color: 'var(--dim)' }}>คะแนน</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const totalProducts   = SEED_PRODUCTS.length;
  const avgScore        = Math.round(SEED_PRODUCTS.reduce((s, p) => s + p.ai_effectiveness_score, 0) / totalProducts);
  const totalReviews    = SEED_PRODUCTS.reduce((s, p) => s + p.review_count, 0);
  const lineProducts    = SEED_PRODUCTS.filter(p => p.platform_source === 'line').length;
  const telegramProducts = SEED_PRODUCTS.filter(p => p.platform_source === 'telegram').length;

  return (
    <>
      <SiteHeader />

      <main className="main-content">
        <div style={{ padding: '16px 16px 0' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--dim)' }}>
            CHIANG MAI OTOP — ANALYTICS
          </p>
          <h1 style={{ fontFamily: 'var(--font-thai)', fontSize: 'var(--text-display)', fontWeight: 600, marginTop: '4px' }}>
            ภาพรวมจังหวัด
          </h1>
        </div>

        {/* Stats grid */}
        <div className="analytics-grid">
          <StatBlock value={totalProducts}        label="สินค้าทั้งหมด" />
          <StatBlock value={avgScore}             label="คะแนนเฉลี่ย" />
          <StatBlock value={totalReviews}         label="รีวิวทั้งหมด" />
          <StatBlock value={SEED_CATEGORIES.length} label="หมวดหมู่" />
        </div>

        {/* Platform breakdown */}
        <div style={{ padding: '0 16px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px',
            background: 'var(--line)', border: '1px solid var(--line)',
          }}>
            {[
              { platform: 'LINE', count: lineProducts, color: '#06c755' },
              { platform: 'Telegram', count: telegramProducts, color: '#229ed9' },
            ].map(({ platform, count, color }) => (
              <div key={platform} style={{ background: 'var(--bg)', padding: '12px 16px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: '0.1em', color, marginBottom: '4px' }}>
                  {platform}
                </div>
                <div className="mono" style={{ fontSize: '24px', color: 'var(--fg)', lineHeight: 1 }}>{count}</div>
                <div className="thai" style={{ fontSize: 'var(--text-micro)', color: 'var(--dim)', marginTop: '2px' }}>สินค้า</div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', padding: '16px' }}>
          <CategoryBarChart />
          <DistrictRankings />
          <TopProducts />
        </div>

        <div style={{ height: '16px' }} />
      </main>

      <BottomNav />
    </>
  );
}
