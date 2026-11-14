const mongoose = require('mongoose');

const networkLogSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: true,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    },
    url: {
      type: String,
      required: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    statusCategory: {
      type: String, // '2xx', '3xx', '4xx', '5xx'
    },
    responseTimeMs: {
      type: Number,
      required: true,
    },
    ip: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: '',
    },
    requestSize: {
      type: Number,
      default: 0,
    },
    responseSize: {
      type: Number,
      default: 0,
    },
    protocol: {
      type: String,
      default: 'HTTP/1.1',
    },
    hasCookie: {
      type: Boolean,
      default: false,
    },
    userEmail: {
      type: String,
      default: 'anonymous',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

networkLogSchema.index({ createdAt: -1 });
networkLogSchema.index({ statusCode: 1 });

module.exports = mongoose.model('NetworkLog', networkLogSchema);
