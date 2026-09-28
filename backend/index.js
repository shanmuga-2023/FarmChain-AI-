// backend/index.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../blockchain/.env') });

import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { apiRouter } from './routes/api.js';
import { blockchainRouter } from './routes/blockchain.js';
import { deliveryRouter } from './routes/delivery.js';
import { invoiceRouter } from './routes/invoices.js';
import { assistantRouter } from './routes/assistant.js';
import { db } from './db.js';

const app = express();
const server = http.createServer(app);

// Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Socket.io for live synchronization across multiple browsers
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('⚡ Client connected via WebSocket:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Root status endpoint
app.get('/', (req, res) => {
  res.json({
    name: '🌾 FarmChain Backend Server',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      mandiRates: '/api/mandi-rates',
      products: '/api/products',
      productDetail: '/api/products/:productId',
      orders: '/api/orders',
      users: '/api/users',
      blockchain: {
        status: '/api/blockchain/status',
        batch: '/api/blockchain/batch',
        transfer: '/api/blockchain/transfer',
        stage: '/api/blockchain/stage',
        certificate: '/api/blockchain/certificate',
        verify: '/api/blockchain/verify/:batchId',
        history: '/api/blockchain/history/:batchId'
      }
    },
    frontend: 'https://farm-chain-ai.vercel.app',
  });
});

// Mount API routes
app.use('/api/blockchain', blockchainRouter);
app.use('/api/deliveries', deliveryRouter);
app.use('/api/invoices', invoiceRouter);
app.use('/api/assistant', assistantRouter);
app.use('/api', apiRouter);

const PORT = process.env.PORT || 4000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🌾 FarmChain Real-Time Server running on http://0.0.0.0:${PORT}`);
  console.log(`🔗 REST API: http://0.0.0.0:${PORT}/api/health`);
  console.log(`⚡ WebSocket sync enabled for multi-client concurrency\n`);
});
