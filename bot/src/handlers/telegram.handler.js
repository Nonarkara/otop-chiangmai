/**
 * Telegram Webhook Handler — OTOP Bot
 * Accepts product posts: photo+caption → queue for Gemini extraction.
 */

import { Telegraf } from 'telegraf';
import axios from 'axios';
import { queueIncomingMessage } from '../services/productStore.js';
import { registerReplyFn } from '../services/messageQueue.service.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = token ? new Telegraf(token) : null;

if (!bot) {
  console.warn('[telegram] TELEGRAM_BOT_TOKEN not set — bot disabled');
}

// Register reply function with worker
registerReplyFn('telegram', async (userId, text) => {
  if (!bot) return;
  await bot.telegram.sendMessage(userId, text);
});

async function downloadPhoto(fileId) {
  if (!bot || !token) return null;
  try {
    const file = await bot.telegram.getFile(fileId);
    const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    const resp = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(resp.data).toString('base64');
  } catch (err) {
    console.error('[telegram] photo download failed:', err.message);
    return null;
  }
}

function setupHandlers() {
  if (!bot) return;

  // Photo with optional caption
  bot.on('photo', async (ctx) => {
    const userId = String(ctx.from?.id);
    const caption = ctx.message.caption?.trim() || '';
    const photos = ctx.message.photo;
    const largest = photos[photos.length - 1]; // Telegram sends multiple sizes

    try {
      await ctx.reply('รับรูปภาพแล้วครับ กำลังวิเคราะห์สินค้าให้นะครับ ⏳');
    } catch { /* non-critical */ }

    const imageBase64 = await downloadPhoto(largest.file_id);
    if (!imageBase64) {
      await ctx.reply('ไม่สามารถดาวน์โหลดรูปได้ครับ กรุณาลองใหม่อีกครั้งนะครับ').catch(() => {});
      return;
    }

    await queueIncomingMessage({
      platform: 'telegram',
      userId,
      chatId: String(ctx.chat?.id),
      messageType: 'image',
      payload: {
        imageBase64,
        mimeType: 'image/jpeg',
        caption,
        senderName: ctx.from?.first_name || null,
      },
    });
  });

  // Text message
  bot.on('text', async (ctx) => {
    const userId = String(ctx.from?.id);
    const text = ctx.message.text?.trim() || '';

    // Ignore commands and short texts
    if (text.startsWith('/') || text.length < 10) {
      await ctx.reply(
        'สวัสดีครับ 🙏 ส่งรูปสินค้าพร้อม caption ชื่อและราคามาได้เลยครับ\n\nหรือส่งข้อความในรูปแบบ:\nสินค้า: ชื่อสินค้า\nราคา: xxx–xxx บาท\nรายละเอียด: ...'
      ).catch(() => {});
      return;
    }

    await ctx.reply('รับข้อมูลแล้วครับ กำลังบันทึกสินค้า ⏳').catch(() => {});

    await queueIncomingMessage({
      platform: 'telegram',
      userId,
      chatId: String(ctx.chat?.id),
      messageType: 'text',
      payload: { text, senderName: ctx.from?.first_name || null },
    });
  });

  // Start command
  bot.command('start', async (ctx) => {
    await ctx.reply(
      'ยินดีต้อนรับสู่ OTOP เชียงใหม่ บอท 🌿\n\n' +
      'ส่งรูปสินค้าพร้อมชื่อและราคามาได้เลยครับ\n' +
      'ระบบจะวิเคราะห์และนำขึ้นแพลตฟอร์มให้อัตโนมัติครับ'
    ).catch(() => {});
  });

  console.log('[telegram] handlers registered');
}

export function telegramWebhookHandler(app) {
  if (!bot) {
    app.post('/webhook/telegram', (req, res) => res.status(200).json({ ok: true }));
    return;
  }

  setupHandlers();

  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const path = webhookSecret ? `/webhook/telegram/${webhookSecret}` : '/webhook/telegram';

  app.use(path, bot.webhookCallback(path));
  console.log(`[telegram] webhook registered at ${path}`);
}

export async function startTelegramPolling() {
  if (!bot) return;
  setupHandlers();
  await bot.launch();
  console.log('[telegram] polling started');
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

export { bot };
