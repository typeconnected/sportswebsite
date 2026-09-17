const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Stream title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: '',
  },
  sport: {
    type: String,
    required: [true, 'Sport category is required'],
    enum: ['Baseball', 'Cricket', 'Basketball', 'Golf', 'Soccer', 'Lacrosse', 'Boxing', 'Football', 'Hockey', 'Motor Sports', 'Tennis', 'Swimming', 'Athletics'],
  },
  tags: [{ type: String }],
  thumbnail: { type: String, default: '' },
  streamKey: { type: String, unique: true, select: false },
  streamUrl: { type: String, default: '' },
  hlsUrl: { type: String, default: '' },
  streamer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  streamerName: { type: String, required: true },
  status: {
    type: String,
    enum: ['live', 'upcoming', 'ended', 'offline'],
    default: 'offline',
  },
  viewers: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  peakViewers: { type: Number, default: 0 },
  scheduledAt: { type: Date },
  startedAt: { type: Date },
  endedAt: { type: Date },
  duration: { type: Number, default: 0 }, // seconds
  isPublic: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
  channel: { type: String, default: '' },
  teams: {
    home: { type: String, default: '' },
    away: { type: String, default: '' },
  },
}, { timestamps: true });

streamSchema.index({ status: 1 });
streamSchema.index({ sport: 1 });
streamSchema.index({ streamer: 1 });
streamSchema.index({ scheduledAt: 1 });

module.exports = mongoose.model('Stream', streamSchema);
