/**
 * OTOP Bot — Entry Point
 * Express server with LINE + Telegram webhooks + Gemini Vision product extraction.
 */

import 'dotenv/config';
import express from 'express';
import { lineWebhookHandler } from './handlers/line.handler.js';
import { telegramWebhookHandler, startTelegramPolling } from './handlers/telegram.handler.js';
import { listingsHandler } from './handlers/listings.handler.js';
import { startWorker } from './services/messageQueue.service.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '127.0.0.1';
const app  = express();

// Health check
app.get('/health', (_, res) => res.json({
  status: 'ok',
  service: 'otop-bot',
  timestamp: new Date().toISOString(),
}));

// Raw body for LINE signature verification
app.use('/webhook/line', express.raw({ type: '*/*' }));
// JSON for Telegram
app.use(express.json());

// Register webhook handlers
lineWebhookHandler(app);
telegramWebhookHandler(app);
listingsHandler(app);

// Root
app.get('/', (_, res) => res.json({ service: 'OTOP Chiang Mai Bot', status: 'running' }));

// Start server
app.listen(PORT, HOST, () => {
  console.log(`[otop-bot] listening on http://${HOST}:${PORT}`);

  // Start AI job processor
  startWorker();

  // Use polling in dev when no webhook URL is set, else rely on webhook
  if (process.env.NODE_ENV !== 'production' && !process.env.TELEGRAM_WEBHOOK_URL) {
    startTelegramPolling();
  }
});
