const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        'LOGIN_ATTEMPT',
        'LOGIN_SUCCESS',
        'LOGIN_FAILURE',
        'ACCOUNT_LOCKED',
        'ACCOUNT_UNLOCKED',
        'LOGOUT',
        'SESSION_EXPIRED',
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'PASSWORD_CHANGED',
        'REGISTRATION',
        'ADMIN_ACTION',
        'FSM_TRANSITION',
        'FSM_REJECTION',
      ],
    },
    severity: {
      type: String,
      required: true,
      enum: ['INFO', 'WARNING', 'DANGER', 'CRITICAL'],
      default: 'INFO',
    },
    outcome: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'BLOCKED'],
      default: 'SUCCESS',
    },
    userEmail: {
      type: String,
      default: 'anonymous',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    ipAddress: {
      type: String,
      default: 'unknown',
    },
    userAgent: {
      type: String,
      default: 'unknown',
    },
    fsmState: {
      type: String,
      default: 'LOGGED_OUT',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for efficient querying by event type and timestamp
securityLogSchema.index({ createdAt: -1 });
securityLogSchema.index({ eventType: 1 });
securityLogSchema.index({ severity: 1 });

module.exports = mongoose.model('SecurityLog', securityLogSchema);
