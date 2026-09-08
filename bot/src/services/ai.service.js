/**
 * AI Service — OTOP product extraction via Gemini Vision
 * Analyzes product photos and seller text to produce structured product data.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { detectCategory, parsePrice } from '../utils/extractProduct.js';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const DEFAULT_MODEL = 'gemini-2.0-flash';
const FALLBACK_MODEL = 'gemini-1.5-flash-latest';

async function withRetry(fn, maxRetries = 2) {
  let lastErr;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      return await fn(DEFAULT_MODEL);
    } catch (err) {
      lastErr = err;
      if (err.status === 429 || err.status === 503) {
        try { return await fn(FALLBACK_MODEL); } catch (e) { lastErr = e; }
      }
      if (i < maxRetries) await new Promise(r => setTimeout(r, 3000 * i));
    }
  }
  throw lastErr;
}

// ── Extract product from image + optional caption ─────────────────────────────

const EXTRACTION_PROMPT = `คุณเป็นผู้ช่วยวิเคราะห์สินค้า OTOP (One Tambon One Product) ของไทย

วิเคราะห์รูปภาพสินค้าและข้อความจากผู้ขาย แล้วตอบกลับเป็น JSON เท่านั้น (ไม่ต้องอธิบาย)

JSON format:
{
  "name_th": "ชื่อสินค้าภาษาไทย",
  "name_en": "Product name in English",
  "category_slug": "ceramics|textiles|food|beverages|herbs|crafts|household|tourism",
  "price_min": 0,
  "price_max": 0,
  "description_th": "คำอธิบายสินค้า 2–3 ประโยค เน้นวัสดุ กรรมวิธีผลิต จุดเด่น",
  "description_en": "2–3 sentence product description in English focusing on materials, craft process, and key features",
  "district_hint": "อำเภอ (ถ้าทราบ หรือ null)",
  "otop_star_rating": 1–5,
  "ai_effectiveness_score": 0–100,
  "image_quality_note": "brief note on image quality"
}

หลักเกณฑ์ให้คะแนน ai_effectiveness_score:
- คุณภาพรูปภาพ (ชัด พื้นหลังเรียบ มีสินค้าชัดเจน): 0–30 คะแนน
- ความสมบูรณ์ของข้อมูล (มีชื่อ ราคา วัสดุ แหล่งผลิต): 0–30 คะแนน
- มาตรฐานสินค้า OTOP โดยรวม: 0–40 คะแนน

ถ้าไม่ทราบราคา ให้ price_min = price_max = 0
ตอบเฉพาะ JSON ห้ามมีข้อความอื่น`;

export async function extractProductFromImage(imageBase64, mimeType, caption = '') {
  if (!genAI) throw new Error('Gemini API key not configured');

  return withRetry(async (model) => {
    const gemini = genAI.getGenerativeModel({ model });
    const parts = [
      { inlineData: { data: imageBase64, mimeType } },
      { text: caption ? `ข้อความจากผู้ขาย: "${caption}"\n\n${EXTRACTION_PROMPT}` : EXTRACTION_PROMPT },
    ];

    const result = await gemini.generateContent(parts);
    const text = result.response.text().trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '');

    const parsed = JSON.parse(text);

    // Enforce reasonable defaults
    if (!parsed.category_slug) parsed.category_slug = detectCategory(caption);
    if (!parsed.price_min && caption) {
      const prices = parsePrice(caption);
      parsed.price_min = prices.price_min || 0;
      parsed.price_max = prices.price_max || 0;
    }
    parsed.ai_effectiveness_score = Math.min(100, Math.max(0, parsed.ai_effectiveness_score || 50));
    parsed.otop_star_rating = Math.min(5, Math.max(1, parsed.otop_star_rating || 3));

    return parsed;
  });
}

// ── Extract product from text only (no image) ─────────────────────────────────

const TEXT_EXTRACTION_PROMPT = `คุณเป็นผู้ช่วยวิเคราะห์สินค้า OTOP ของไทย

วิเคราะห์ข้อความจากผู้ขาย แล้วตอบกลับเป็น JSON เท่านั้น

JSON format:
{
  "name_th": "ชื่อสินค้าภาษาไทย",
  "name_en": "Product name in English",
  "category_slug": "ceramics|textiles|food|beverages|herbs|crafts|household|tourism",
  "price_min": 0,
  "price_max": 0,
  "description_th": "คำอธิบายสินค้า 2–3 ประโยค",
  "description_en": "2–3 sentence description in English",
  "district_hint": "อำเภอ (ถ้าทราบ หรือ null)",
  "otop_star_rating": 3,
  "ai_effectiveness_score": 40
}

หมายเหตุ: เนื่องจากไม่มีรูปภาพ ai_effectiveness_score ต้องไม่เกิน 60
ตอบเฉพาะ JSON ห้ามมีข้อความอื่น`;

export async function extractProductFromText(text) {
  if (!genAI) return null;

  return withRetry(async (model) => {
    const gemini = genAI.getGenerativeModel({ model });
    const result = await gemini.generateContent(
      `ข้อความจากผู้ขาย: "${text}"\n\n${TEXT_EXTRACTION_PROMPT}`
    );
    const raw = result.response.text().trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '');

    const parsed = JSON.parse(raw);
    parsed.ai_effectiveness_score = Math.min(60, Math.max(0, parsed.ai_effectiveness_score || 40));
    parsed.otop_star_rating = Math.min(5, Math.max(1, parsed.otop_star_rating || 3));
    return parsed;
  });
}

// ── Generate seller confirmation message ─────────────────────────────────────

export function buildConfirmationMessage(extracted, platform) {
  const { name_th, category_slug, price_min, price_max } = extracted;
  const priceText = (price_min && price_max)
    ? `฿${price_min.toLocaleString()}${price_min !== price_max ? `–${price_max.toLocaleString()}` : ''}`
    : 'กรุณาระบุราคา';

  const lines = [
    `✓ รับสินค้าแล้วครับ`,
    ``,
    `📦 ${name_th || 'สินค้า OTOP'}`,
    `💰 ${priceText}`,
    `🏷 ${category_slug || 'ไม่ระบุหมวด'}`,
    ``,
    `สินค้าของคุณจะปรากฏบนแพลตฟอร์มภายใน 2–3 นาทีครับ`,
  ];

  return lines.join('\n');
}
