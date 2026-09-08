export interface Category {
  id: string;
  name_th: string;
  name_en: string;
  slug: string;
  icon_motif: string;
  product_count?: number;
  avg_score?: number;
}

export interface District {
  id: string;
  name_th: string;
  name_en: string;
  lat: number;
  lon: number;
  product_count?: number;
  avg_score?: number;
}

export interface Seller {
  id: string;
  platform: 'line' | 'telegram';
  name_th: string;
  district_th?: string;
  verified: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name_th: string;
  name_en: string;
  category: string;          // name_th from joined category
  category_slug: string;
  category_icon: string;
  district_th: string;
  price_min: number;
  price_max: number;
  description_th: string;
  description_en: string;
  images: string[];
  otop_star_rating: 1 | 2 | 3 | 4 | 5;
  ai_effectiveness_score: number; // 0–100
  trending_score: number;
  view_count: number;
  review_count: number;
  avg_rating: number;
  platform_source: 'line' | 'telegram' | 'manual';
  seller_name?: string;
  lat?: number;
  lon?: number;
}

export interface Review {
  id: string;
  product_id: string;
  rating: number;
  text: string;
  source_platform: 'line' | 'telegram' | 'web';
  ai_summary?: string;
  created_at: string;
}

export interface AnalyticsData {
  total_products: number;
  total_categories: number;
  total_districts: number;
  avg_effectiveness: number;
  categories: Category[];
  districts: District[];
  trending: Product[];
}
