const SecurityLog = require('../models/SecurityLog');

// Sensitive keys that must NEVER be written to logs
const SENSITIVE_KEYS = [
  'password',
  'confirmPassword',
  'newPassword',
  'oldPassword',
  'token',
  'sessionToken',
  'secret',
  'cookie',
  'authorization',
  'connect.sid',
];

/**
 * Deep recursive sanitizer to scrub sensitive data
 */
function sanitizePayload(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizePayload);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some((sensitive) =>
      lowerKey.includes(sensitive.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED_BY_SECURITY_POLICY]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizePayload(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Log a security event to MongoDB and console
 */
async function logSecurityEvent({
  eventType,
  severity = 'INFO',
  outcome = 'SUCCESS',
  userEmail = 'anonymous',
  userId = null,
  ipAddress = 'unknown',
  userAgent = 'unknown',
  fsmState = 'LOGGED_OUT',
  details = {},
}) {
  try {
    const cleanDetails = sanitizePayload(details);

    const logEntry = await SecurityLog.create({
      eventType,
      severity,
      outcome,
      userEmail,
      userId,
      ipAddress,
      userAgent,
      fsmState,
      details: cleanDetails,
    });

    return logEntry;
  } catch (err) {
    console.error('Failed to write security log:', err.message);
    return null;
  }
}

module.exports = {
  logSecurityEvent,
  sanitizePayload,
};
