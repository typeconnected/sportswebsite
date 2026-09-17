/**
 * SportStream Database Seed Script
 * Run: node server/seed.js
 */

require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Inline models to avoid circular deps
const userSchema = new mongoose.Schema({
  username: String, email: String, password: String,
  role: { type: String, default: 'user' }, isActive: { type: Boolean, default: true },
  loginAttempts: { type: Number, default: 0 }, refreshTokens: [String],
}, { timestamps: true });

const streamSchema = new mongoose.Schema({
  title: String, description: String, sport: String, tags: [String],
  thumbnail: String, streamKey: String, streamUrl: String, hlsUrl: String,
  streamer: mongoose.Schema.Types.ObjectId, streamerName: String,
  status: { type: String, default: 'live' },
  viewers: { type: Number, default: 0 }, likes: { type: Number, default: 0 },
  scheduledAt: Date, startedAt: Date,
  isPublic: { type: Boolean, default: true }, isPremium: { type: Boolean, default: false },
  channel: String, teams: { home: String, away: String },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Stream = mongoose.model('Stream', streamSchema);

const THUMBNAILS = {
  Soccer: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&q=80',
  Football: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&q=80',
  Basketball: 'https://images.unsplash.com/photo-1546519638405-a9f9e1bba818?w=400&q=80',
  Boxing: 'https://images.unsplash.com/photo-1517438322307-e67111335449?w=400&q=80',
  Cricket: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&q=80',
  Tennis: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400&q=80',
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sportstream');
    console.log('✅ Connected to MongoDB');

    // Clear existing
    await User.deleteMany({});
    await Stream.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create users
    const hashedPassword = await bcrypt.hash('Password123!', 12);

    const [admin, streamer1, streamer2] = await User.insertMany([
      { username: 'admin', email: 'admin@sportstream.com', password: hashedPassword, role: 'admin', isActive: true },
      { username: 'SinePlaxMultimedia', email: 'sineplax@sportstream.com', password: hashedPassword, role: 'streamer', isActive: true },
      { username: 'XpressEpose', email: 'xpress@sportstream.com', password: hashedPassword, role: 'streamer', isActive: true },
    ]);

    console.log('👤 Created users: admin, SinePlaxMultimedia, XpressEpose');
    console.log('   Password for all: Password123!');

    // Create streams
    const now = new Date();
    await Stream.insertMany([
      {
        title: 'Italy vs France, Soccer',
        description: 'Live UEFA Nations League Final — Italy vs France',
        sport: 'Soccer', tags: ['Sports', 'Football', 'Soccer', 'Live'],
        thumbnail: THUMBNAILS.Soccer, streamKey: 'sk_live_001',
        streamer: streamer1._id, streamerName: 'SinePlax Multimedia',
        status: 'live', viewers: 6251, likes: 4744, channel: 'ESPN',
        teams: { home: 'Italy', away: 'France' }, startedAt: new Date(now - 3600000), isPublic: true,
      },
      {
        title: 'American Football — Championship',
        description: 'Live American Football championship game',
        sport: 'Football', tags: ['Sports', 'American Football', 'Live'],
        thumbnail: THUMBNAILS.Football, streamKey: 'sk_live_002',
        streamer: streamer1._id, streamerName: 'SinePlax Multimedia',
        status: 'live', viewers: 5800, likes: 3200, channel: 'Fox Sports',
        teams: { home: 'Chiefs', away: 'Cowboys' }, startedAt: new Date(now - 7200000), isPublic: true,
      },
      {
        title: 'László vs Kamilla — Boxing',
        description: 'WBC World Championship Boxing Match',
        sport: 'Boxing', tags: ['Sports', 'Boxing', 'Live', 'Game'],
        thumbnail: THUMBNAILS.Boxing, streamKey: 'sk_live_003',
        streamer: streamer2._id, streamerName: 'Xpress Epose',
        status: 'live', viewers: 4100, likes: 2900, channel: 'DAZN',
        teams: { home: 'László', away: 'Kamilla' }, startedAt: new Date(now - 1800000), isPublic: true,
      },
      {
        title: 'NBA Playoffs — Lakers vs Celtics',
        description: 'Game 7 of the NBA Eastern Conference Finals',
        sport: 'Basketball', tags: ['Sports', 'Basketball', 'NBA', 'Live'],
        thumbnail: THUMBNAILS.Basketball, streamKey: 'sk_live_004',
        streamer: streamer1._id, streamerName: 'SinePlax Multimedia',
        status: 'live', viewers: 12400, likes: 8900, channel: 'ESPN',
        teams: { home: 'Lakers', away: 'Celtics' }, startedAt: new Date(now - 5400000), isPublic: true,
      },
      {
        title: 'IPL 2024 — MI vs RCB',
        description: 'Indian Premier League — Mumbai Indians vs Royal Challengers Bangalore',
        sport: 'Cricket', tags: ['Cricket', 'IPL', 'Live'],
        thumbnail: THUMBNAILS.Cricket, streamKey: 'sk_live_005',
        streamer: streamer2._id, streamerName: 'Star Sports',
        status: 'upcoming', viewers: 0, likes: 1200,
        teams: { home: 'MI', away: 'RCB' },
        scheduledAt: new Date(now.getTime() + 2 * 3600000), isPublic: true,
      },
      {
        title: 'Wimbledon Men\'s Final',
        description: 'The Wimbledon Championship Men\'s Singles Final',
        sport: 'Tennis', tags: ['Tennis', 'Wimbledon', 'Grand Slam'],
        thumbnail: THUMBNAILS.Tennis, streamKey: 'sk_live_006',
        streamer: streamer1._id, streamerName: 'Sky Sports',
        status: 'upcoming', viewers: 0, likes: 3100,
        teams: { home: 'Alcaraz', away: 'Djokovic' },
        scheduledAt: new Date(now.getTime() + 24 * 3600000), isPublic: true,
      },
    ]);

    console.log('📡 Created 6 streams (4 live, 2 upcoming)');
    console.log('\n✨ Seed complete! You can now run: npm run dev');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
