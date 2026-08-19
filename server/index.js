// server/index.js
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
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
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

// Mount API routes
app.use('/api', apiRouter);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`\n🌾 FarmChain AI 2.0 Real-Time Server running on http://localhost:${PORT}`);
  console.log(`🔗 REST API: http://localhost:${PORT}/api/health`);
  console.log(`⚡ WebSocket sync enabled for multi-client concurrency\n`);
});
