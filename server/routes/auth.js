const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateTokens = (userId, username, role) => {
  const accessToken = jwt.sign(
    { id: userId, username, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email ? 'Email already in use.' : 'Username already taken.',
      });
    }

    const user = await User.create({ username, email, password });
    const { accessToken, refreshToken } = generateTokens(user._id, user.username, user.role);

    // Store refresh token hash
    const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: hashedRefresh } });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      accessToken,
      refreshToken,
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil +refreshTokens');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.isLocked()) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ success: false, message: `Account locked. Try again in ${lockTime} minutes.` });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    await user.resetLoginAttempts();
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const { accessToken, refreshToken } = generateTokens(user._id, user.username, user.role);
    const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: hashedRefresh } });

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user._id, username: user.username, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required.' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const user = await User.findOne({
      _id: decoded.id,
      refreshTokens: hashedRefresh,
    }).select('+refreshTokens');

    if (!user) return res.status(401).json({ success: false, message: 'Invalid refresh token.' });

    // Rotate refresh token
    const { accessToken, refreshToken: newRefresh } = generateTokens(user._id, user.username, user.role);
    const newHashed = crypto.createHash('sha256').update(newRefresh).digest('hex');

    await User.findByIdAndUpdate(user._id, {
      $pull: { refreshTokens: hashedRefresh },
      $push: { refreshTokens: newHashed },
    });

    res.json({ success: true, accessToken, refreshToken: newRefresh });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
});

// POST /api/auth/logout
router.post('/logout', protect, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await User.findByIdAndUpdate(req.user._id, { $pull: { refreshTokens: hashedRefresh } });
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch {
    res.status(500).json({ success: false, message: 'Error logging out.' });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
