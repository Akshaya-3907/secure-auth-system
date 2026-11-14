const { logSecurityEvent } = require('../logging/securityLogger');

/**
 * Authentication verification middleware
 * Rejects unauthenticated requests with HTTP 401 Unauthorized
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    // Session is active
    return next();
  }

  // Log unauthorized access attempt
  logSecurityEvent({
    eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    severity: 'WARNING',
    outcome: 'BLOCKED',
    userEmail: 'anonymous',
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    fsmState: 'LOGGED_OUT',
    details: {
      attemptedPath: req.originalUrl,
      method: req.method,
      reason: 'No valid active session cookie provided',
    },
  });

  return res.status(401).json({
    success: false,
    message: 'Access denied: Authentication required. Session is either expired or missing.',
    fsmState: 'LOGGED_OUT',
    code: 'UNAUTHENTICATED',
  });
}

/**
 * Role-based authorization middleware for Admin
 * Rejects non-admin users with HTTP 403 Forbidden
 */
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: Please sign in first.',
      code: 'UNAUTHENTICATED',
    });
  }

  if (req.session.user.role !== 'admin') {
    logSecurityEvent({
      eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      severity: 'DANGER',
      outcome: 'BLOCKED',
      userEmail: req.session.user.email,
      userId: req.session.user.id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      fsmState: 'ACTIVE_SESSION',
      details: {
        attemptedPath: req.originalUrl,
        userRole: req.session.user.role,
        requiredRole: 'admin',
        reason: 'Insufficient privileges for administrative operation',
      },
    });

    return res.status(403).json({
      success: false,
      message: 'Forbidden: Administrative privileges required.',
      code: 'FORBIDDEN_ROLE',
    });
  }

  return next();
}

module.exports = {
  requireAuth,
  requireAdmin,
};
