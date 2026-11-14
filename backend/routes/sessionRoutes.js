const express = require('express');
const router = express.Router();
const { getActiveSessions, terminateSessionById } = require('../session/sessionConfig');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const SecurityLog = require('../models/SecurityLog');
const { logSecurityEvent } = require('../logging/securityLogger');

/**
 * GET /api/session/active
 * View all active sessions stored in MongoDB
 */
router.get('/active', requireAuth, async (req, res) => {
  try {
    const sessions = await getActiveSessions();
    const isAdmin = req.session.user.role === 'admin';

    // If regular user, only show their own sessions; if admin, show all
    const filtered = isAdmin
      ? sessions
      : sessions.filter((s) => s.user && s.user.id === req.session.user.id);

    return res.json({
      success: true,
      count: filtered.length,
      currentSessionId: req.sessionID,
      sessions: filtered,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/session/terminate/:sessionId
 * Terminate a session by ID
 */
router.post('/terminate/:sessionId', requireAuth, async (req, res) => {
  const { sessionId } = req.params;
  const isAdmin = req.session.user.role === 'admin';

  try {
    const sessions = await getActiveSessions();
    const targetSession = sessions.find((s) => s.sessionId === sessionId);

    if (!targetSession) {
      return res.status(404).json({ success: false, message: 'Session not found or already expired.' });
    }

    // Authorization check
    if (!isAdmin && (!targetSession.user || targetSession.user.id !== req.session.user.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to terminate this session.' });
    }

    const terminated = await terminateSessionById(sessionId);

    if (targetSession.user) {
      await logSecurityEvent({
        eventType: 'LOGOUT',
        severity: 'INFO',
        outcome: 'SUCCESS',
        userEmail: targetSession.user.email,
        userId: targetSession.user.id,
        fsmState: 'LOGGED_OUT_SUCCESSFULLY',
        details: {
          action: 'SESSION_FORCE_TERMINATED',
          terminatedBy: req.session.user.email,
          sessionId,
        },
      });
    }

    return res.json({
      success: terminated,
      message: terminated ? 'Session terminated successfully.' : 'Failed to terminate session.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/session/inspect
 * Inspects client-server network cookie security flags
 */
router.get('/inspect', (req, res) => {
  const cookieHeader = req.headers.cookie || 'No cookie received';
  const hasCybersecSid = cookieHeader.includes('cybersec.sid');

  const cookieInspection = {
    cookieName: 'cybersec.sid',
    isCookiePresentInRequest: hasCybersecSid,
    rawCookieHeaderSanitized: hasCybersecSid ? 'cybersec.sid=s%3A[SIGNED_TOKEN_REDACTED]' : 'None',
    flags: {
      httpOnly: {
        enabled: true,
        description: 'Blocks document.cookie access from client scripts (defends against XSS credential theft).',
        status: 'SECURE',
      },
      sameSite: {
        value: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        description: 'Restricts cross-site request cookie transmission (defends against CSRF attacks).',
        status: 'ACTIVE',
      },
      secure: {
        enabled: process.env.NODE_ENV === 'production',
        description: 'Requires HTTPS transport (automatic in production deployment on Render).',
        status: process.env.NODE_ENV === 'production' ? 'HTTPS_ENFORCED' : 'HTTP_LOCAL_DEV',
      },
      rolling: {
        enabled: true,
        description: 'Resets session TTL timer on every authenticated interaction.',
        status: 'ENABLED',
      },
      maxAge: {
        durationMs: 30 * 60 * 1000,
        durationMinutes: 30,
        description: 'Automatic session timeout expiration.',
      },
    },
    sessionData: req.session?.user
      ? {
          user: req.session.user,
          ip: req.session.ip,
          lastActivity: req.session.lastActivity,
        }
      : null,
  };

  return res.json({ success: true, cookieInspection });
});

/**
 * GET /api/session/logs
 * Security Event Logs with filters and pagination
 */
router.get('/logs', requireAuth, async (req, res) => {
  try {
    const { eventType, severity, search, limit = 50, page = 1 } = req.query;
    const query = {};

    // Regular users can only see their own logs; admin can see all
    if (req.session.user.role !== 'admin') {
      query.userEmail = req.session.user.email;
    }

    if (eventType) query.eventType = eventType;
    if (severity) query.severity = severity;
    if (search) {
      query.$or = [
        { userEmail: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await SecurityLog.countDocuments(query);
    const logs = await SecurityLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    return res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / limit),
      logs,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
