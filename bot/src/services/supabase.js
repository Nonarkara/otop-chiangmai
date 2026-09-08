import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

if (supabase) {
  console.log('[supabase] client initialized');
} else {
  console.warn('[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing — running without DB');
}

export function isSupabaseEnabled() { return !!supabase; }
export function getSupabaseClient() { return supabase; }

// ── Products ──────────────────────────────────────────────────────────────────

export async function insertProduct(data) {
  if (!supabase) return null;
  try {
    const { data: row, error } = await supabase.from('products').insert(data).select().single();
    if (error) throw error;
    return row;
  } catch (err) {
    console.warn('[supabase] product insert failed:', err.message);
    return null;
  }
}

export async function findOrCreateSeller({ platform, platformUserId, nameTh }) {
  if (!supabase) return null;
  try {
    // Try to find existing seller
    const { data: existing } = await supabase.from('sellers')
      .select('id')
      .eq('platform', platform)
      .eq('platform_user_id', platformUserId)
      .maybeSingle();

    if (existing) return existing.id;

    // Create new seller
    const { data: created, error } = await supabase.from('sellers')
      .insert({ platform, platform_user_id: platformUserId, name_th: nameTh || 'ผู้ขาย' })
      .select('id')
      .single();

    if (error) throw error;
    return created.id;
  } catch (err) {
    console.warn('[supabase] seller upsert failed:', err.message);
    return null;
  }
}

export async function lookupCategoryId(slug) {
  if (!supabase) return null;
  try {
    const { data } = await supabase.from('categories')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    return data?.id || null;
  } catch { return null; }
}

export async function lookupDistrictId(nameTh) {
  if (!supabase) return null;
  try {
    const { data } = await supabase.from('districts')
      .select('id')
      .ilike('name_th', `%${nameTh}%`)
      .limit(1)
      .maybeSingle();
    return data?.id || null;
  } catch { return null; }
}

// ── Bot Queue ─────────────────────────────────────────────────────────────────

export async function enqueueInbox(record) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('bot_inbox').insert(record).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('[supabase] inbox enqueue failed:', err.message);
    return null;
  }
}

export async function enqueueJob(record) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('ai_jobs').insert(record).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('[supabase] job enqueue failed:', err.message);
    return null;
  }
}

export async function claimNextJob() {
  if (!supabase) return null;
  try {
    const now = new Date().toISOString();
    const { data } = await supabase.from('ai_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('available_at', now)
      .order('created_at', { ascending: true })
      .limit(1);

    const job = data?.[0];
    if (!job) return null;

    const { data: claimed, error } = await supabase.from('ai_jobs')
      .update({ status: 'processing', attempts: job.attempts + 1, locked_at: now, updated_at: now })
      .eq('id', job.id)
      .eq('status', 'pending')
      .select()
      .maybeSingle();

    if (error || !claimed) return null;
    return claimed;
  } catch (err) {
    console.warn('[supabase] claim job failed:', err.message);
    return null;
  }
}

export async function completeJob(jobId, result) {
  if (!supabase) return;
  try {
    const now = new Date().toISOString();
    await supabase.from('ai_jobs').update({
      status: 'completed', completed_at: now, result, updated_at: now
    }).eq('id', jobId);
  } catch (err) {
    console.warn('[supabase] complete job failed:', err.message);
  }
}

export async function failJob(jobId, errorMessage) {
  if (!supabase) return;
  try {
    const now = new Date().toISOString();
    await supabase.from('ai_jobs').update({
      status: 'failed', last_error: errorMessage, updated_at: now
    }).eq('id', jobId);
  } catch (err) {
    console.warn('[supabase] fail job failed:', err.message);
  }
}

export async function enqueueOutbox(record) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('bot_outbox').insert(record).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('[supabase] outbox enqueue failed:', err.message);
    return null;
  }
}
