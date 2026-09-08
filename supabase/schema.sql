-- OTOP Chiang Mai — Supabase Schema
-- Apply to the 'otop' schema in the consolidated Supabase Pro org
-- Run: psql $DATABASE_URL < schema.sql

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ── Categories ───────────────────────────────────────────────────────────────
create table if not exists categories (
  id          uuid primary key default uuid_generate_v4(),
  name_th     text not null,
  name_en     text not null,
  slug        text not null unique,
  icon_motif  text,              -- single character / SVG path hint
  sort_order  int default 0,
  created_at  timestamptz default now()
);

-- ── Districts (Amphoe) — Chiang Mai province ─────────────────────────────────
create table if not exists districts (
  id          uuid primary key default uuid_generate_v4(),
  name_th     text not null,
  name_en     text not null,
  province    text not null default 'chiang_mai',
  lat         numeric(10,6),
  lon         numeric(10,6),
  created_at  timestamptz default now()
);

-- ── Sellers ──────────────────────────────────────────────────────────────────
create table if not exists sellers (
  id               uuid primary key default uuid_generate_v4(),
  platform         text not null check (platform in ('line', 'telegram')),
  platform_user_id text not null,
  name_th          text,
  province         text default 'chiang_mai',
  district_id      uuid references districts(id),
  verified         boolean default false,
  created_at       timestamptz default now(),
  unique(platform, platform_user_id)
);

-- ── Products ─────────────────────────────────────────────────────────────────
create table if not exists products (
  id                    uuid primary key default uuid_generate_v4(),
  slug                  text unique,
  seller_id             uuid references sellers(id),
  name_th               text not null,
  name_en               text,
  category_id           uuid references categories(id),
  district_id           uuid references districts(id),
  price_min             numeric(10,2),
  price_max             numeric(10,2),
  description_th        text,
  description_en        text,
  images                text[] default '{}',
  otop_star_rating      int check (otop_star_rating between 1 and 5),
  ai_effectiveness_score int default 0 check (ai_effectiveness_score between 0 and 100),
  trending_score        numeric(8,2) default 0,
  view_count            int default 0,
  review_count          int default 0,
  avg_rating            numeric(3,2) default 0,
  platform_source       text check (platform_source in ('line', 'telegram', 'manual')),
  lat                   numeric(10,6),
  lon                   numeric(10,6),
  published             boolean default true,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ── Reviews ──────────────────────────────────────────────────────────────────
create table if not exists reviews (
  id              uuid primary key default uuid_generate_v4(),
  product_id      uuid not null references products(id) on delete cascade,
  rating          int not null check (rating between 1 and 5),
  text            text,
  source_platform text check (source_platform in ('line', 'telegram', 'web')),
  ai_summary      text,
  created_at      timestamptz default now()
);

-- ── Bot Queue Tables ─────────────────────────────────────────────────────────
create table if not exists bot_inbox (
  id           uuid primary key default uuid_generate_v4(),
  platform     text not null check (platform in ('line', 'telegram')),
  chat_id      text,
  user_id      text not null,
  message_type text not null,   -- 'image', 'text', 'image_with_caption'
  raw_payload  jsonb,
  status       text default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  error        text,
  created_at   timestamptz default now(),
  processed_at timestamptz
);

create table if not exists ai_jobs (
  id           uuid primary key default uuid_generate_v4(),
  inbox_id     uuid references bot_inbox(id),
  platform     text,
  user_id      text,
  job_type     text not null,   -- 'extract_product', 'analyze_image'
  payload      jsonb,
  status       text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  attempts     int default 0,
  available_at timestamptz default now(),
  locked_at    timestamptz,
  completed_at timestamptz,
  last_error   text,
  result       jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table if not exists bot_outbox (
  id             uuid primary key default uuid_generate_v4(),
  source_job_id  uuid,
  platform       text not null,
  user_id        text not null,
  messages       jsonb not null,
  status         text default 'pending' check (status in ('pending', 'processing', 'delivered', 'failed')),
  attempts       int default 0,
  available_at   timestamptz default now(),
  delivered_at   timestamptz,
  last_error     text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_products_category    on products(category_id);
create index if not exists idx_products_district    on products(district_id);
create index if not exists idx_products_trending    on products(trending_score desc);
create index if not exists idx_products_created     on products(created_at desc);
create index if not exists idx_products_published   on products(published);
create index if not exists idx_products_slug        on products(slug);
create index if not exists idx_reviews_product      on reviews(product_id);
create index if not exists idx_ai_jobs_status       on ai_jobs(status, available_at);
create index if not exists idx_bot_inbox_status     on bot_inbox(status);
create index if not exists idx_bot_outbox_status    on bot_outbox(status, available_at);

-- Full-text search on product names
create index if not exists idx_products_fts on products
  using gin(to_tsvector('simple', coalesce(name_th,'') || ' ' || coalesce(name_en,'')));

-- ── Slug auto-generation ──────────────────────────────────────────────────────
create or replace function generate_product_slug()
returns trigger language plpgsql as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := lower(regexp_replace(
      coalesce(new.name_en, 'product') || '-' || substring(new.id::text, 1, 8),
      '[^a-z0-9]+', '-', 'g'
    ));
  end if;
  return new;
end;
$$;

create trigger set_product_slug
  before insert on products
  for each row execute function generate_product_slug();

-- updated_at auto-update
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on products
  for each row execute function touch_updated_at();

create trigger ai_jobs_updated_at
  before update on ai_jobs
  for each row execute function touch_updated_at();

create trigger bot_outbox_updated_at
  before update on bot_outbox
  for each row execute function touch_updated_at();

-- ── Analytics SQL Functions ───────────────────────────────────────────────────

create or replace function get_trending_products(p_limit int default 10)
returns table (
  id uuid, slug text, name_th text, name_en text,
  category_id uuid, district_id uuid,
  price_min numeric, price_max numeric,
  ai_effectiveness_score int, trending_score numeric,
  view_count int, review_count int, avg_rating numeric,
  otop_star_rating int, images text[], platform_source text
) language sql stable as $$
  select p.id, p.slug, p.name_th, p.name_en,
         p.category_id, p.district_id,
         p.price_min, p.price_max,
         p.ai_effectiveness_score, p.trending_score,
         p.view_count, p.review_count, p.avg_rating,
         p.otop_star_rating, p.images, p.platform_source
  from products p
  where p.published = true
  order by p.trending_score desc, p.created_at desc
  limit p_limit;
$$;

create or replace function get_category_breakdown()
returns table (
  category_id uuid, name_th text, name_en text, slug text,
  product_count bigint, avg_score numeric
) language sql stable as $$
  select c.id, c.name_th, c.name_en, c.slug,
         count(p.id) as product_count,
         round(avg(p.ai_effectiveness_score), 1) as avg_score
  from categories c
  left join products p on p.category_id = c.id and p.published = true
  group by c.id, c.name_th, c.name_en, c.slug, c.sort_order
  order by c.sort_order, product_count desc;
$$;

create or replace function get_district_rankings()
returns table (
  district_id uuid, name_th text, name_en text,
  product_count bigint, avg_score numeric, lat numeric, lon numeric
) language sql stable as $$
  select d.id, d.name_th, d.name_en,
         count(p.id) as product_count,
         round(avg(p.ai_effectiveness_score), 1) as avg_score,
         d.lat, d.lon
  from districts d
  left join products p on p.district_id = d.id and p.published = true
  group by d.id, d.name_th, d.name_en, d.lat, d.lon
  order by product_count desc;
$$;

create or replace function update_product_stats(p_product_id uuid)
returns void language plpgsql as $$
declare
  v_count int;
  v_avg   numeric;
  v_score numeric;
begin
  select count(*), round(avg(rating::numeric), 2)
  into v_count, v_avg
  from reviews
  where product_id = p_product_id;

  -- recalc effectiveness: image+desc base score stays, review component updated
  update products set
    review_count = coalesce(v_count, 0),
    avg_rating   = coalesce(v_avg, 0),
    ai_effectiveness_score = least(100, greatest(0,
      (ai_effectiveness_score * 0.6) + (coalesce(v_avg, 0) / 5.0 * 40)
    )),
    trending_score = (view_count * 0.3) + (coalesce(v_count,0) * 10 * 0.5) +
      (extract(epoch from (now() - created_at)) / -86400.0 + 30) * 0.2
  where id = p_product_id;
end;
$$;

-- ── RLS Policies ─────────────────────────────────────────────────────────────
alter table categories   enable row level security;
alter table districts    enable row level security;
alter table sellers      enable row level security;
alter table products     enable row level security;
alter table reviews      enable row level security;
alter table bot_inbox    enable row level security;
alter table ai_jobs      enable row level security;
alter table bot_outbox   enable row level security;

-- Public read for products, categories, districts, reviews
create policy "public read categories"  on categories  for select using (true);
create policy "public read districts"   on districts   for select using (true);
create policy "public read products"    on products    for select using (published = true);
create policy "public read reviews"     on reviews     for select using (true);

-- Service role gets full access (bot uses service_role key)
create policy "service full categories" on categories  for all using (auth.role() = 'service_role');
create policy "service full districts"  on districts   for all using (auth.role() = 'service_role');
create policy "service full sellers"    on sellers     for all using (auth.role() = 'service_role');
create policy "service full products"   on products    for all using (auth.role() = 'service_role');
create policy "service full reviews"    on reviews     for all using (auth.role() = 'service_role');
create policy "service full inbox"      on bot_inbox   for all using (auth.role() = 'service_role');
create policy "service full jobs"       on ai_jobs     for all using (auth.role() = 'service_role');
create policy "service full outbox"     on bot_outbox  for all using (auth.role() = 'service_role');

-- ── Seed Data: Categories ─────────────────────────────────────────────────────
insert into categories (name_th, name_en, slug, icon_motif, sort_order) values
  ('ผ้าและเครื่องแต่งกาย', 'Textiles & Apparel',  'textiles',   '◫', 1),
  ('อาหาร',                'Food',                 'food',        '◈', 2),
  ('เครื่องดื่ม',           'Beverages',            'beverages',   '◎', 3),
  ('ของใช้',               'Household Goods',      'household',   '◻', 4),
  ('สมุนไพร',              'Herbs & Wellness',     'herbs',       '◇', 5),
  ('ศิลปประดิษฐ์',         'Arts & Crafts',        'crafts',      '◆', 6),
  ('ท่องเที่ยว',            'Tourism & Experience', 'tourism',     '◉', 7),
  ('เซรามิก',              'Ceramics',             'ceramics',    '⬡', 8)
on conflict (slug) do nothing;

-- ── Seed Data: Chiang Mai Districts ──────────────────────────────────────────
insert into districts (name_th, name_en, province, lat, lon) values
  ('เมืองเชียงใหม่', 'Mueang Chiang Mai', 'chiang_mai', 18.7904, 98.9847),
  ('จอมทอง',         'Chom Thong',         'chiang_mai', 18.4167, 98.6667),
  ('แม่แจ่ม',        'Mae Chaem',          'chiang_mai', 18.5333, 98.2333),
  ('เชียงดาว',       'Chiang Dao',         'chiang_mai', 19.3667, 98.9667),
  ('ดอยสะเก็ด',      'Doi Saket',          'chiang_mai', 18.8667, 99.1667),
  ('แม่แตง',         'Mae Taeng',          'chiang_mai', 19.0833, 98.9333),
  ('แม่ริม',         'Mae Rim',            'chiang_mai', 18.9189, 98.9428),
  ('สะเมิง',         'Samoeng',            'chiang_mai', 18.7500, 98.6833),
  ('ฝาง',            'Fang',               'chiang_mai', 19.9167, 99.2167),
  ('แม่อาย',         'Mae Ai',             'chiang_mai', 20.0333, 99.2833),
  ('พร้าว',          'Phrao',              'chiang_mai', 19.3667, 99.2167),
  ('สันป่าตอง',      'San Pa Tong',        'chiang_mai', 18.5000, 98.9167),
  ('กัลยาณิวัฒนา',   'Kanlayani Wattana',  'chiang_mai', 19.0167, 98.4833),
  ('สันกำแพง',       'San Kamphaeng',      'chiang_mai', 18.7462, 99.1292),
  ('สันทราย',        'San Sai',            'chiang_mai', 18.8500, 99.0500),
  ('หางดง',          'Hang Dong',          'chiang_mai', 18.6667, 98.9167),
  ('ฮอด',            'Hot',                'chiang_mai', 18.1833, 98.5833),
  ('ดอยเต่า',        'Doi Tao',            'chiang_mai', 17.9000, 98.4833),
  ('อมก๋อย',         'Omkoi',              'chiang_mai', 17.8000, 98.4333),
  ('สารภี',          'Saraphi',            'chiang_mai', 18.6667, 99.0167),
  ('เวียงแหง',       'Wiang Haeng',        'chiang_mai', 19.5539, 98.4892),
  ('ไชยปราการ',      'Chai Prakan',        'chiang_mai', 19.8167, 99.1500),
  ('แม่วาง',         'Mae Wang',           'chiang_mai', 18.5333, 98.7333),
  ('แม่ออน',         'Mae On',             'chiang_mai', 18.7833, 99.2000),
  ('ดอยหล่อ',        'Doi Lo',             'chiang_mai', 18.3500, 98.7833)
on conflict do nothing;
