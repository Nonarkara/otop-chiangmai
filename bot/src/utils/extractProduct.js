/**
 * Parse a raw seller message into a structured product payload.
 * Used as a pre-flight before sending to Gemini Vision,
 * and as a fallback parser when no image is present.
 *
 * Expected seller message format (flexible):
 *   สินค้า: ชามเซลาดอน
 *   ราคา: 380–1,500 บาท
 *   อำเภอ: เมืองเชียงใหม่
 *   รายละเอียด: …
 */

const CATEGORY_KEYWORDS = {
  ceramics:  ['เซรามิก', 'เซลาดอน', 'ดินเผา', 'เครื่องปั้นดินเผา', 'ceramic', 'celadon'],
  textiles:  ['ผ้า', 'ทอ', 'ฝ้าย', 'ไหม', 'มัดหมี่', 'ครา', 'batik', 'fabric', 'silk', 'cotton'],
  food:      ['อาหาร', 'ไส้อั่ว', 'น้ำพริก', 'แหนม', 'ข้าว', 'food', 'sausage', 'paste'],
  beverages: ['กาแฟ', 'ชา', 'น้ำ', 'เครื่องดื่ม', 'coffee', 'tea', 'drink', 'beverage'],
  herbs:     ['สมุนไพร', 'สบู่', 'ครีม', 'บำรุง', 'ยา', 'herb', 'soap', 'cream', 'wellness'],
  crafts:    ['ร่ม', 'ตุ๊กตา', 'โมบาย', 'ของที่ระลึก', 'งานฝีมือ', 'umbrella', 'craft', 'souvenir'],
  household: ['กระบุง', 'ตะกร้า', 'เครื่องใช้', 'basket', 'household'],
  tourism:   ['ท่องเที่ยว', 'ทัวร์', 'แพ็กเกจ', 'tour', 'tourism', 'experience'],
};

export function detectCategory(text = '') {
  const lower = text.toLowerCase();
  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return slug;
  }
  return null;
}

const PRICE_RE = /(\d[\d,]*)\s*[-–]\s*(\d[\d,]*)/;
const PRICE_SINGLE_RE = /(\d[\d,]+)\s*บาท/;

export function parsePrice(text = '') {
  const range = text.match(PRICE_RE);
  if (range) {
    return {
      price_min: parseInt(range[1].replace(/,/g, ''), 10),
      price_max: parseInt(range[2].replace(/,/g, ''), 10),
    };
  }
  const single = text.match(PRICE_SINGLE_RE);
  if (single) {
    const v = parseInt(single[1].replace(/,/g, ''), 10);
    return { price_min: v, price_max: v };
  }
  return { price_min: null, price_max: null };
}

const FIELD_RE = /^(สินค้า|ชื่อ|product|ราคา|price|อำเภอ|จังหวัด|district|รายละเอียด|detail|desc)\s*[:：]\s*(.+)/im;

export function parseTextMessage(text = '') {
  const lines = text.split(/\n/);
  const result = {
    name_th: null,
    price_min: null,
    price_max: null,
    district_hint: null,
    description_th: null,
    category_slug: null,
  };

  for (const line of lines) {
    const m = line.match(FIELD_RE);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();

    if (['สินค้า', 'ชื่อ', 'product'].includes(key)) result.name_th = val;
    if (['ราคา', 'price'].includes(key)) {
      const prices = parsePrice(val);
      result.price_min = prices.price_min;
      result.price_max = prices.price_max;
    }
    if (['อำเภอ', 'จังหวัด', 'district'].includes(key)) result.district_hint = val;
    if (['รายละเอียด', 'detail', 'desc'].includes(key)) result.description_th = val;
  }

  // If no structured name found, use first non-empty line
  if (!result.name_th) {
    result.name_th = lines.find(l => l.trim().length > 2)?.trim() || null;
  }

  // Detect category from full text
  result.category_slug = detectCategory(text);

  // Parse price from full text if not found in structured fields
  if (!result.price_min) {
    const prices = parsePrice(text);
    result.price_min = prices.price_min;
    result.price_max = prices.price_max;
  }

  return result;
}
