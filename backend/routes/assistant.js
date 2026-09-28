// backend/routes/assistant.js
// REST API for AI Farming Assistant
import express from 'express';
import { processMessage } from '../services/farming-assistant.js';

export const assistantRouter = express.Router();

// POST /api/assistant/chat — send a message to the assistant
assistantRouter.post('/chat', async (req, res) => {
  const { userId, message, language, imageData, context } = req.body;

  if (!userId) return res.status(400).json({ error: 'userId is required' });
  if (!message && !imageData) return res.status(400).json({ error: 'message or imageData is required' });

  try {
    const result = await processMessage({ userId, message: message || '', language: language || 'en', imageData, context });

    if (!result.success) {
      const statusCode = result.error === 'RATE_LIMITED' ? 429 : 500;
      return res.status(statusCode).json({ error: result.error, message: result.message });
    }

    res.json({
      response: result.response,
      timestamp: result.timestamp
    });
  } catch (err) {
    console.error('Assistant error:', err);
    res.status(500).json({ error: 'AI assistant unavailable', message: err.message });
  }
});

// GET /api/assistant/health — check assistant status
assistantRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'farming-assistant', timestamp: new Date().toISOString() });
});
