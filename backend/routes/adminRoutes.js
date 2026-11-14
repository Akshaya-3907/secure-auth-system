const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');
const NetworkLog = require('../models/NetworkLog');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const { getActiveSessions, terminateSessionById } = require('../session/sessionConfig');
const { logSecurityEvent } = require('../logging/securityLogger');

// All routes require authenticated Admin
router.use(requireAuth, requireAdmin);

/**
 * GET /api/admin/dashboard-stats
 * Aggregates all system metrics across Full Stack, Networks, and FLAT
 */
router.get('/dashboard-stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const lockedAccounts = await User.countDocuments({
      lockUntil: { $gt: new Date() },
    });

    const successfulLogins = await SecurityLog.countDocuments({
      eventType: 'LOGIN_SUCCESS',
    });
    const failedLoginAttempts = await SecurityLog.countDocuments({
      eventType: 'LOGIN_FAILURE',
    });

    // Query active sessions from MongoStore
    const sessionsList = await getActiveSessions();
    const activeSessionsCount = sessionsList.filter((s) => !s.isExpired).length;
    const expiredSessionsCount = sessionsList.filter((s) => s.isExpired).length;

    // FSM State Distribution among users
    const fsmStateAggregation = await User.aggregate([
      { $group: { _id: '$currentFsmState', count: { $sum: 1 } } },
    ]);

    // Network request counts
    const totalNetworkRequests = await NetworkLog.countDocuments();
    const networkSummary = await NetworkLog.aggregate([
      {
        $group: {
          _id: '$statusCategory',
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTimeMs' },
        },
      },
    ]);

    // Recent 10 security events
    const recentSecurityLogs = await SecurityLog.find()
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      success: true,
      stats: {
        totalUsers,
        successfulLogins,
        failedLoginAttempts,
        activeSessions: activeSessionsCount,
        lockedAccounts,
        expiredSessions: expiredSessionsCount,
        totalNetworkRequests,
        fsmStateDistribution: fsmStateAggregation,
        networkSummary,
        recentSecurityLogs,
      },
    });
  } catch (err) {
    console.error('Error fetching admin dashboard stats:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/admin/users
 * List all registered users
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    const enrichedUsers = users.map((u) => {
      const obj = u.toObject();
      obj.isCurrentlyLocked = u.isLocked();
      return obj;
    });

    return res.json({ success: true, users: enrichedUsers });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/admin/users/:id/lock
 * Administratively lock an account
 */
router.post('/users/:id/lock', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.lockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour admin lock
    user.currentFsmState = 'ACCOUNT_LOCKED';
    user.fsmHistory.push({
      fromState: user.currentFsmState,
      toState: 'ACCOUNT_LOCKED',
      event: 'LOCKOUT_TRIGGERED',
      timestamp: new Date(),
      valid: true,
      reason: `Account locked manually by admin (${req.session.user.email}).`,
    });
    await user.save();

    await logSecurityEvent({
      eventType: 'ADMIN_ACTION',
      severity: 'WARNING',
      outcome: 'SUCCESS',
      userEmail: req.session.user.email,
      userId: req.session.user.id,
      details: { action: 'MANUAL_ACCOUNT_LOCK', targetUser: user.email },
    });

    return res.json({ success: true, message: `User ${user.email} has been locked.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/admin/users/:id/unlock
 * Administratively unlock an account
 */
router.post('/users/:id/unlock', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await user.unlockAccount(req.session.user.email);

    await logSecurityEvent({
      eventType: 'ACCOUNT_UNLOCKED',
      severity: 'INFO',
      outcome: 'SUCCESS',
      userEmail: req.session.user.email,
      userId: req.session.user.id,
      details: { action: 'ACCOUNT_UNLOCKED', targetUser: user.email },
    });

    return res.json({ success: true, message: `User ${user.email} has been unlocked.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * Change user role
 */
router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role specified.' });
  }

  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select(
      '-password'
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await logSecurityEvent({
      eventType: 'ADMIN_ACTION',
      severity: 'WARNING',
      outcome: 'SUCCESS',
      userEmail: req.session.user.email,
      userId: req.session.user.id,
      details: { action: 'ROLE_MODIFIED', targetUser: user.email, newRole: role },
    });

    return res.json({ success: true, message: `Role updated to ${role}`, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await logSecurityEvent({
      eventType: 'ADMIN_ACTION',
      severity: 'DANGER',
      outcome: 'SUCCESS',
      userEmail: req.session.user.email,
      userId: req.session.user.id,
      details: { action: 'USER_DELETED', targetUser: user.email },
    });

    return res.json({ success: true, message: `User ${user.email} was removed.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
