/**
 * LINE Webhook Handler — OTOP Bot
 * Accepts product posts: image+caption → queue for Gemini extraction.
 */

import { middleware, messagingApi } from '@line/bot-sdk';
import { queueIncomingMessage } from '../services/productStore.js';
import { registerReplyFn } from '../services/messageQueue.service.js';

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
};

const client = new messagingApi.MessagingApiClient({ channelAccessToken: config.channelAccessToken });
const lineMiddleware = config.channelSecret ? middleware(config) : null;

// Register reply function with worker
registerReplyFn('line', async (userId, text) => {
  if (!config.channelAccessToken) return;
  await client.pushMessage({ to: userId, messages: [{ type: 'text', text }] });
});

function getSourceId(source = {}) {
  return source.userId || source.groupId || source.roomId || null;
}

async function handleImageEvent(event) {
  const userId = getSourceId(event.source);
  if (!userId) return;

  try {
    // Download image from LINE
    const stream = await client.getMessageContent(event.message.id);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    const imageBase64 = buffer.toString('base64');

    // Reply immediately (LINE 12s deadline)
    await client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: 'รับรูปภาพแล้วครับ กำลังวิเคราะห์สินค้าให้นะครับ ⏳' }],
    });

    // Queue for async processing
    await queueIncomingMessage({
      platform: 'line',
      userId,
      chatId: userId,
      messageType: 'image',
      payload: {
        imageBase64,
        mimeType: 'image/jpeg',
        caption: '', // will be enriched if text follows
        senderName: null,
      },
    });
  } catch (err) {
    console.error('[line] image handler error:', err.message);
  }
}

async function handleTextEvent(event) {
  const userId = getSourceId(event.source);
  const text = event.message.text?.trim();
  if (!userId || !text) return;

  // Ignore short texts that aren't product info
  if (text.length < 10) {
    await client.replyMessage({
      replyToken: event.replyToken,
      messages: [{
        type: 'text',
        text: 'สวัสดีครับ 🙏 ส่งรูปสินค้าพร้อมชื่อและราคามาได้เลยครับ\nหรือส่งข้อความในรูปแบบ:\nสินค้า: ชื่อสินค้า\nราคา: xxx–xxx บาท\nรายละเอียด: ...',
      }],
    });
    return;
  }

  // Reply immediately
  await client.replyMessage({
    replyToken: event.replyToken,
    messages: [{ type: 'text', text: 'รับข้อมูลแล้วครับ กำลังบันทึกสินค้า ⏳' }],
  });

  await queueIncomingMessage({
    platform: 'line',
    userId,
    chatId: userId,
    messageType: 'text',
    payload: { text, senderName: null },
  });
}

export function lineWebhookHandler(app) {
  if (!lineMiddleware) {
    console.warn('[line] LINE credentials not set — webhook disabled');
    app.post('/webhook/line', (req, res) => res.status(200).json({ ok: true }));
    return;
  }

  app.post('/webhook/line', lineMiddleware, async (req, res) => {
    res.status(200).json({ ok: true });

    const events = req.body?.events || [];
    for (const event of events) {
      try {
        if (event.type === 'message' && event.message.type === 'image') {
          await handleImageEvent(event);
        } else if (event.type === 'message' && event.message.type === 'text') {
          await handleTextEvent(event);
        }
      } catch (err) {
        console.error('[line] event handler error:', err.message);
      }
    }
  });

  console.log('[line] webhook registered at /webhook/line');
}
