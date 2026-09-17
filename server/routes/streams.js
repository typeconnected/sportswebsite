const express = require('express');
const crypto = require('crypto');
const Stream = require('../models/Stream');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/streams - Get all live/public streams
router.get('/', async (req, res) => {
  try {
    const { sport, status = 'live', page = 1, limit = 12, sort = '-viewers' } = req.query;
    const query = { isPublic: true };
    if (sport) query.sport = sport;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const streams = await Stream.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('streamer', 'username avatar');

    const total = await Stream.countDocuments(query);

    res.json({
      success: true,
      data: streams,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching streams.' });
  }
});

// GET /api/streams/:id - Get single stream
router.get('/:id', async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id).populate('streamer', 'username avatar');
    if (!stream) return res.status(404).json({ success: false, message: 'Stream not found.' });
    if (!stream.isPublic) return res.status(403).json({ success: false, message: 'Private stream.' });

    // Increment viewer count
    await Stream.findByIdAndUpdate(req.params.id, { $inc: { viewers: 1 } });

    res.json({ success: true, data: stream });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching stream.' });
  }
});

// POST /api/streams - Create a new stream (streamer/admin only)
router.post('/', protect, authorize('streamer', 'admin'), async (req, res) => {
  try {
    const { title, description, sport, tags, thumbnail, scheduledAt, isPublic, isPremium, teams, channel } = req.body;

    const streamKey = crypto.randomBytes(32).toString('hex');

    const stream = await Stream.create({
      title,
      description,
      sport,
      tags,
      thumbnail,
      scheduledAt,
      isPublic: isPublic !== undefined ? isPublic : true,
      isPremium: isPremium || false,
      teams: teams || {},
      channel: channel || '',
      streamKey,
      streamer: req.user._id,
      streamerName: req.user.username,
      status: scheduledAt ? 'upcoming' : 'offline',
    });

    res.status(201).json({ success: true, data: stream, streamKey });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    res.status(500).json({ success: false, message: 'Error creating stream.' });
  }
});

// PATCH /api/streams/:id/go-live
router.patch('/:id/go-live', protect, authorize('streamer', 'admin'), async (req, res) => {
  try {
    const stream = await Stream.findOne({ _id: req.params.id, streamer: req.user._id });
    if (!stream) return res.status(404).json({ success: false, message: 'Stream not found or unauthorized.' });

    stream.status = 'live';
    stream.startedAt = new Date();
    await stream.save();

    res.json({ success: true, data: stream });
  } catch {
    res.status(500).json({ success: false, message: 'Error going live.' });
  }
});

// PATCH /api/streams/:id/end
router.patch('/:id/end', protect, authorize('streamer', 'admin'), async (req, res) => {
  try {
    const stream = await Stream.findOne({ _id: req.params.id, streamer: req.user._id });
    if (!stream) return res.status(404).json({ success: false, message: 'Stream not found.' });

    const now = new Date();
    stream.status = 'ended';
    stream.endedAt = now;
    if (stream.startedAt) {
      stream.duration = Math.floor((now - stream.startedAt) / 1000);
    }
    await stream.save();

    res.json({ success: true, data: stream });
  } catch {
    res.status(500).json({ success: false, message: 'Error ending stream.' });
  }
});

// DELETE /api/streams/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    if (!stream) return res.status(404).json({ success: false, message: 'Stream not found.' });
    if (stream.streamer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    await stream.deleteOne();
    res.json({ success: true, message: 'Stream deleted.' });
  } catch {
    res.status(500).json({ success: false, message: 'Error deleting stream.' });
  }
});

module.exports = router;
