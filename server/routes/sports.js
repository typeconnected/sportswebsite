const express = require('express');
const Stream = require('../models/Stream');
const { protect } = require('../middleware/auth');

const sportsRouter = express.Router();
const scheduleRouter = express.Router();

const SPORTS_LIST = [
  { name: 'Baseball', icon: '⚾', color: '#4ade80' },
  { name: 'Cricket', icon: '🏏', color: '#22c55e' },
  { name: 'Basketball', icon: '🏀', color: '#16a34a' },
  { name: 'Golf', icon: '⛳', color: '#15803d' },
  { name: 'Soccer', icon: '⚽', color: '#166534' },
  { name: 'Lacrosse', icon: '🥍', color: '#14532d' },
  { name: 'Boxing', icon: '🥊', color: '#4ade80' },
  { name: 'Football', icon: '🏈', color: '#22c55e' },
  { name: 'Hockey', icon: '🏒', color: '#16a34a' },
  { name: 'Motor Sports', icon: '🏎️', color: '#15803d' },
  { name: 'Tennis', icon: '🎾', color: '#166534' },
  { name: 'Swimming', icon: '🏊', color: '#14532d' },
];

// GET /api/sports
sportsRouter.get('/', async (req, res) => {
  try {
    // Attach live count per sport
    const liveCounts = await Stream.aggregate([
      { $match: { status: 'live', isPublic: true } },
      { $group: { _id: '$sport', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    liveCounts.forEach(({ _id, count }) => { countMap[_id] = count; });

    const sports = SPORTS_LIST.map(s => ({
      ...s,
      liveCount: countMap[s.name] || 0,
    }));

    res.json({ success: true, data: sports });
  } catch {
    res.status(500).json({ success: false, message: 'Error fetching sports.' });
  }
});

// GET /api/sports/:name/streams
sportsRouter.get('/:name/streams', async (req, res) => {
  try {
    const streams = await Stream.find({
      sport: req.params.name,
      isPublic: true,
      status: { $in: ['live', 'upcoming'] },
    }).populate('streamer', 'username avatar').sort('-viewers').limit(20);

    res.json({ success: true, data: streams });
  } catch {
    res.status(500).json({ success: false, message: 'Error fetching sport streams.' });
  }
});

// GET /api/schedule
scheduleRouter.get('/', async (req, res) => {
  try {
    const { date, sport } = req.query;
    const query = { status: 'upcoming', isPublic: true };

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.scheduledAt = { $gte: start, $lt: end };
    } else {
      query.scheduledAt = { $gte: new Date() };
    }

    if (sport) query.sport = sport;

    const schedule = await Stream.find(query)
      .sort('scheduledAt')
      .limit(50)
      .populate('streamer', 'username avatar');

    res.json({ success: true, data: schedule });
  } catch {
    res.status(500).json({ success: false, message: 'Error fetching schedule.' });
  }
});

// GET /api/users routes placeholder
const usersRouter = express.Router();

usersRouter.get('/me/history', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id)
      .populate('watchHistory.streamId', 'title sport thumbnail status');
    res.json({ success: true, data: user.watchHistory });
  } catch {
    res.status(500).json({ success: false, message: 'Error fetching watch history.' });
  }
});

module.exports = { sportsRouter, scheduleRouter, usersRouter };
