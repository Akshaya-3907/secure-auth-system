const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FsmStateHistory = require('../models/FsmStateHistory');
const { requireAuth } = require('../middleware/authMiddleware');
const { FLAT_REGEX_PATTERNS } = require('../fsm/fsmDefinitions');
const { logSecurityEvent } = require('../logging/securityLogger');

/**
 * GET /api/user/profile
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        currentFsmState: user.currentFsmState,
        failedLoginAttempts: user.failedLoginAttempts,
        isLocked: user.isLocked(),
        lockUntil: user.lockUntil,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/user/change-password
 */
router.put('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Both current and new password are required.',
    });
  }

  // FLAT Lexical Analysis / DFA check on new password
  if (!FLAT_REGEX_PATTERNS.PASSWORD_COMPLEXITY.regex.test(newPassword)) {
    return res.status(400).json({
      success: false,
      message:
        'New password does not satisfy DFA grammar: Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character (@$!%*?&).',
      grammar: FLAT_REGEX_PATTERNS.PASSWORD_COMPLEXITY.grammar,
    });
  }

  try {
    const user = await User.findById(req.session.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      await logSecurityEvent({
        eventType: 'PASSWORD_CHANGED',
        severity: 'WARNING',
        outcome: 'FAILURE',
        userEmail: user.email,
        userId: user._id,
        ipAddress: clientIp,
        details: { reason: 'Incorrect current password provided' },
      });

      return res.status(401).json({
        success: false,
        message: 'Incorrect current password.',
      });
    }

    // Set new password (will trigger pre-save bcrypt hash)
    user.password = newPassword;
    await user.save();

    await logSecurityEvent({
      eventType: 'PASSWORD_CHANGED',
      severity: 'INFO',
      outcome: 'SUCCESS',
      userEmail: user.email,
      userId: user._id,
      ipAddress: clientIp,
      details: { reason: 'Password updated successfully' },
    });

    return res.json({
      success: true,
      message: 'Password updated successfully!',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/user/fsm-history
 */
router.get('/fsm-history', requireAuth, async (req, res) => {
  try {
    const history = await FsmStateHistory.find({
      $or: [{ userId: req.session.user.id }, { userEmail: req.session.user.email }],
    })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({ success: true, history });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
