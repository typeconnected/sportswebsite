const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const authRoutes = require('./routes/auth');
const streamRoutes = require('./routes/streams');
const { sportsRouter: sportRoutes } = require('./routes/sports');
const scheduleRoutes = require('./routes/schedule');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);

// Socket.IO for live chat & viewer count
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      mediaSrc: ["'self'", 'https:'],
      connectSrc: ["'self'", 'wss:', 'ws:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting – global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting – auth routes (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', globalLimiter);
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(morgan('combined'));

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/sports', sportRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SportStream API running', timestamp: new Date() });
});

// ─── Serve React build (single-container deployment) ───────────────────────
const clientBuildPath = path.join(__dirname, 'public');
app.use(express.static(clientBuildPath));

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Everything else -> React app (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Socket.IO Logic ────────────────────────────────────────────────────────
const streamViewers = new Map(); // streamId -> Set of socketIds
const streamChats = new Map();   // streamId -> last 50 messages

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.username = decoded.username;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.username} (${socket.id})`);

  socket.on('join_stream', (streamId) => {
    socket.join(streamId);
    if (!streamViewers.has(streamId)) streamViewers.set(streamId, new Set());
    streamViewers.get(streamId).add(socket.id);
    const count = streamViewers.get(streamId).size;
    io.to(streamId).emit('viewer_count', count);

    // Send recent chat history
    const history = streamChats.get(streamId) || [];
    socket.emit('chat_history', history);
  });

  socket.on('leave_stream', (streamId) => {
    socket.leave(streamId);
    if (streamViewers.has(streamId)) {
      streamViewers.get(streamId).delete(socket.id);
      io.to(streamId).emit('viewer_count', streamViewers.get(streamId).size);
    }
  });

  socket.on('chat_message', ({ streamId, message }) => {
    if (!message || message.trim().length === 0 || message.length > 300) return;
    const msg = {
      id: Date.now(),
      userId: socket.userId,
      username: socket.username,
      message: message.trim().substring(0, 300),
      timestamp: new Date().toISOString(),
    };
    if (!streamChats.has(streamId)) streamChats.set(streamId, []);
    const msgs = streamChats.get(streamId);
    msgs.push(msg);
    if (msgs.length > 50) msgs.shift();
    io.to(streamId).emit('new_message', msg);
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id && streamViewers.has(room)) {
        streamViewers.get(room).delete(socket.id);
        io.to(room).emit('viewer_count', streamViewers.get(room).size);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.username}`);
  });
});

// ─── MongoDB Connection ─────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sportstream';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 SportStream server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = { app, io };
