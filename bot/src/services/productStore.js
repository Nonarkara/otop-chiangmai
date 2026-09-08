/**
 * Product Store — persist extracted product data to Supabase.
 * Orchestrates: seller upsert → category lookup → district lookup → product insert.
 */

import { randomUUID } from 'crypto';
import {
  isSupabaseEnabled, getSupabaseClient,
  findOrCreateSeller, lookupCategoryId, lookupDistrictId,
  insertProduct, enqueueInbox, enqueueJob,
} from './supabase.js';

// In-memory log when Supabase is not configured
const memoryLog = [];

export async function saveProduct({ extracted, sender, platform, inboxId }) {
  const {
    name_th, name_en, category_slug, price_min, price_max,
    description_th, description_en, district_hint,
    otop_star_rating, ai_effectiveness_score, images = [],
  } = extracted;

  if (!isSupabaseEnabled()) {
    const entry = {
      id: randomUUID(), name_th, name_en, category_slug,
      price_min, price_max, description_th, description_en,
      district_hint, otop_star_rating, ai_effectiveness_score,
      platform_source: platform,
      created_at: new Date().toISOString(),
    };
    memoryLog.push(entry);
    console.log('[productStore] saved to memory (no Supabase):', entry.name_th);
    return entry;
  }

  const sellerId = await findOrCreateSeller({
    platform,
    platformUserId: sender.userId,
    nameTh: sender.displayName,
  });

  const categoryId = category_slug ? await lookupCategoryId(category_slug) : null;
  const districtId = district_hint ? await lookupDistrictId(district_hint) : null;

  const productData = {
    seller_id: sellerId,
    name_th: name_th || 'สินค้า OTOP',
    name_en: name_en || null,
    category_id: categoryId,
    district_id: districtId,
    price_min: price_min || 0,
    price_max: price_max || price_min || 0,
    description_th: description_th || null,
    description_en: description_en || null,
    images,
    otop_star_rating: otop_star_rating || 3,
    ai_effectiveness_score: ai_effectiveness_score || 50,
    trending_score: 0,
    platform_source: platform,
    published: true,
  };

  const product = await insertProduct(productData);
  if (product) {
    console.log(`[productStore] saved product: ${product.name_th} (${product.id})`);
  }
  return product;
}

export async function queueIncomingMessage({ platform, userId, chatId, messageType, payload }) {
  if (!isSupabaseEnabled()) {
    return { id: randomUUID(), backend: 'memory' };
  }

  const now = new Date().toISOString();
  const inboxRecord = {
    platform, user_id: userId, chat_id: chatId,
    message_type: messageType, raw_payload: payload,
    status: 'queued', created_at: now,
  };

  const inbox = await enqueueInbox(inboxRecord);
  if (!inbox) return { id: randomUUID(), backend: 'memory' };

  const jobRecord = {
    inbox_id: inbox.id, platform, user_id: userId,
    job_type: messageType === 'image' ? 'extract_product' : 'extract_text',
    payload, status: 'pending', attempts: 0,
    available_at: now, created_at: now, updated_at: now,
  };

  const job = await enqueueJob(jobRecord);
  return { id: job?.id || randomUUID(), backend: 'supabase', inboxId: inbox.id };
}

export function getMemoryLog() { return [...memoryLog]; }
