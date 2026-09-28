import { supabase, isSupabaseEnabled } from './supabase';
import type { Product } from './types';

type Cat = { name_th: string; slug: string; icon_motif: string | null };
type Dist = { name_th: string; lat: number | null; lon: number | null };

type Row = {
  id: string;
  slug: string;
  name_th: string;
  name_en: string | null;
  price_min: number | null;
  price_max: number | null;
  description_th: string | null;
  description_en: string | null;
  images: string[] | null;
  otop_star_rating: number | null;
  ai_effectiveness_score: number | null;
  trending_score: number | null;
  view_count: number | null;
  review_count: number | null;
  avg_rating: number | null;
  platform_source: Product['platform_source'] | null;
  lat: number | null;
  lon: number | null;
  contact: string | null;
  categories: Cat | Cat[] | null;
  districts: Dist | Dist[] | null;
};

function one<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function mapRow(row: Row): Product {
  const cat = one(row.categories);
  const dist = one(row.districts);
  const stars = row.otop_star_rating ?? 0;
  return {
    id: row.id,
    slug: row.slug,
    name_th: row.name_th,
    name_en: row.name_en || '',
    category: cat?.name_th || 'ไม่ระบุหมวด',
    category_slug: cat?.slug || '',
    category_icon: cat?.icon_motif || '◻',
    district_th: dist?.name_th || '',
    price_min: Number(row.price_min || 0),
    price_max: Number(row.price_max || row.price_min || 0),
    description_th: row.description_th || '',
    description_en: row.description_en || '',
    images: row.images || [],
    otop_star_rating: (stars >= 0 && stars <= 5 ? stars : 0) as Product['otop_star_rating'],
    ai_effectiveness_score: row.ai_effectiveness_score || 0,
    trending_score: Number(row.trending_score || 0),
    view_count: row.view_count || 0,
    review_count: row.review_count || 0,
    avg_rating: Number(row.avg_rating || 0),
    platform_source: row.platform_source || 'manual',
    contact: row.contact || undefined,
    lat: row.lat ?? dist?.lat ?? undefined,
    lon: row.lon ?? dist?.lon ?? undefined,
  };
}

let pending: Promise<Product[]> | null = null;

export function invalidateLiveProducts() {
  pending = null;
}

export function loadLiveProducts(): Promise<Product[]> {
  if (!isSupabaseEnabled() || !supabase) return Promise.resolve([]);
  if (!pending) {
    pending = Promise.resolve(supabase
      .from('products')
      .select('id, slug, name_th, name_en, price_min, price_max, description_th, description_en, images, otop_star_rating, ai_effectiveness_score, trending_score, view_count, review_count, avg_rating, platform_source, lat, lon, contact, categories(name_th, slug, icon_motif), districts(name_th, lat, lon)')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          pending = null;
          console.warn('[catalog]', error.message);
          return [];
        }
        return ((data ?? []) as unknown as Row[]).map(mapRow);
      }));
  }
  return pending;
}
