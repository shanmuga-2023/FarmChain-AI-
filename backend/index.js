// backend/index.js
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { apiRouter } from './routes/api.js';
import { db } from './db.js';

const app = express();
const server = http.createServer(app);

// Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

app.use(express.json());

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
    name: '🌾 FarmChain AI 2.0 Backend Server',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      mandiRates: '/api/mandi-rates',
      products: '/api/products',
      productDetail: '/api/products/:productId',
      orders: '/api/orders',
      users: '/api/users',
    },
    frontend: 'https://farm-chain-ai.vercel.app',
  });
});

// Mount API routes
app.use('/api', apiRouter);

const PORT = process.env.PORT || 4000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🌾 FarmChain AI 2.0 Real-Time Server running on http://0.0.0.0:${PORT}`);
  console.log(`🔗 REST API: http://0.0.0.0:${PORT}/api/health`);
  console.log(`⚡ WebSocket sync enabled for multi-client concurrency\n`);
});
