/**
 * Message Queue Worker
 * Polls ai_jobs table, calls Gemini Vision, saves products, sends replies.
 * Adapted from city-reporter-v2 — simplified for OTOP product extraction.
 */

import {
  isSupabaseEnabled, claimNextJob, completeJob, failJob,
} from './supabase.js';
import { extractProductFromImage, extractProductFromText, buildConfirmationMessage } from './ai.service.js';
import { saveProduct } from './productStore.js';

const WORKER_POLL_MS = parseInt(process.env.MESSAGE_WORKER_POLL_MS || '2000', 10);

// Reply functions injected by handlers
const replyFns = { line: null, telegram: null };
export function registerReplyFn(platform, fn) { replyFns[platform] = fn; }

async function sendReply(platform, userId, text) {
  const fn = replyFns[platform];
  if (!fn) { console.log(`[worker] reply (${platform}):`, text); return; }
  try { await fn(userId, text); } catch (err) {
    console.warn(`[worker] reply delivery failed (${platform}):`, err.message);
  }
}

async function processJob(job) {
  const { job_type, payload, platform, user_id: userId } = job;

  try {
    let extracted;

    if (job_type === 'extract_product' && payload?.imageBase64) {
      extracted = await extractProductFromImage(
        payload.imageBase64,
        payload.mimeType || 'image/jpeg',
        payload.caption || ''
      );
    } else {
      extracted = await extractProductFromText(payload?.text || '');
    }

    if (!extracted || !extracted.name_th) {
      await sendReply(platform, userId,
        'ขอโทษครับ ไม่สามารถวิเคราะห์สินค้าได้ กรุณาส่งรูปภาพพร้อมชื่อและราคาสินค้าครับ'
      );
      await failJob(job.id, 'extraction returned no name_th');
      return;
    }

    const sender = { userId, displayName: payload?.senderName || null };
    await saveProduct({ extracted, sender, platform, inboxId: job.inbox_id });

    const confirmation = buildConfirmationMessage(extracted, platform);
    await sendReply(platform, userId, confirmation);
    await completeJob(job.id, { name_th: extracted.name_th });

  } catch (err) {
    console.error('[worker] job failed:', err.message);
    await sendReply(platform, userId,
      'เกิดข้อผิดพลาดครับ กรุณาลองส่งสินค้าใหม่อีกครั้งนะครับ'
    );
    await failJob(job.id, err.message);
  }
}

let timer = null;
let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    if (!isSupabaseEnabled()) return;
    const job = await claimNextJob();
    if (job) await processJob(job);
  } finally {
    running = false;
  }
}

export function startWorker() {
  if (timer) return;
  timer = setInterval(() => tick().catch(err => console.error('[worker] tick error:', err.message)), WORKER_POLL_MS);
  timer.unref?.();
  void tick().catch(() => {});
  console.log(`[worker] started (poll every ${WORKER_POLL_MS}ms)`);
}

export function stopWorker() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
