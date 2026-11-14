const mongoose = require('mongoose');

const fsmStateHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userEmail: {
      type: String,
      default: 'anonymous',
    },
    fromState: {
      type: String,
      required: true,
    },
    toState: {
      type: String,
      default: null,
    },
    event: {
      type: String,
      required: true,
    },
    valid: {
      type: Boolean,
      required: true,
      default: true,
    },
    reason: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      enum: ['SYSTEM', 'USER', 'SIMULATION', 'ADMIN'],
      default: 'SYSTEM',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

fsmStateHistorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('FsmStateHistory', fsmStateHistorySchema);
