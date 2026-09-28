/**
 * Local listing intake. LINE and Telegram stay closed until those tokens exist.
 * This is the path that writes one published row the storefront can read.
 */

import { insertProduct, lookupCategoryId, lookupDistrictId, isSupabaseEnabled } from '../services/supabase.js';

function corsHeaders(req) {
  const origin = req.headers.origin || '';
  const allowed = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
    ? origin
    : 'http://127.0.0.1:3000';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

export function listingsHandler(app) {
  app.options('/listings', (req, res) => {
    res.set(corsHeaders(req)).status(204).end();
  });

  app.post('/listings', async (req, res) => {
    res.set(corsHeaders(req));
    if (!isSupabaseEnabled()) {
      res.status(503).json({ error: 'database not configured' });
      return;
    }

    const body = req.body || {};
    const nameTh = String(body.name_th || '').trim();
    const priceMin = Number(body.price_min);
    const priceMax = Number(body.price_max || body.price_min);
    const district = String(body.district_th || '').trim();
    const description = String(body.description_th || '').trim();
    const categorySlug = String(body.category_slug || '').trim();
    const contact = String(body.contact || '').trim();

    if (!nameTh || nameTh.length > 200) {
      res.status(400).json({ error: 'name_th required' });
      return;
    }
    if (contact.length < 4 || contact.length > 80) {
      res.status(400).json({ error: 'contact required' });
      return;
    }
    if (!Number.isFinite(priceMin) || priceMin < 0 || priceMin > 1_000_000) {
      res.status(400).json({ error: 'price_min required' });
      return;
    }

    const categoryId = categorySlug ? await lookupCategoryId(categorySlug) : null;
    const districtId = district ? await lookupDistrictId(district) : null;
    const slug = `listing-${Date.now().toString(36)}`;

    const product = await insertProduct({
      slug,
      name_th: nameTh,
      name_en: null,
      category_id: categoryId,
      district_id: districtId,
      price_min: priceMin,
      price_max: Number.isFinite(priceMax) ? priceMax : priceMin,
      description_th: description || null,
      description_en: null,
      images: [],
      otop_star_rating: null,
      ai_effectiveness_score: 0,
      trending_score: 0,
      view_count: 0,
      review_count: 0,
      avg_rating: 0,
      platform_source: 'manual',
      contact,
      published: true,
    });

    if (!product) {
      res.status(500).json({ error: 'insert failed' });
      return;
    }

    res.status(201).json({ id: product.id, slug: product.slug, name_th: product.name_th });
  });
}
