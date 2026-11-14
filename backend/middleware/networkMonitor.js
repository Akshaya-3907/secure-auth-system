const NetworkLog = require('../models/NetworkLog');

// In-memory buffer of recent network events for instant real-time dashboard feed
const recentNetworkRequests = [];
const MAX_BUFFER_SIZE = 100;

function networkMonitorMiddleware(req, res, next) {
  // Ignore static assets if any
  if (req.url.startsWith('/static') || req.url.startsWith('/assets') || req.url.endsWith('.ico')) {
    return next();
  }

  const startTime = process.hrtime();
  const requestTimestamp = new Date();
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Client';
  const protocol = req.protocol ? req.protocol.toUpperCase() : 'HTTP/1.1';
  const hasCookie = Boolean(req.headers.cookie);

  // Approximate incoming request size
  const requestSize =
    (req.headers['content-length'] ? parseInt(req.headers['content-length'], 10) : 0) +
    (req.url.length || 0) +
    JSON.stringify(req.headers).length;

  let responseSize = 0;
  const originalWrite = res.write;
  const originalEnd = res.end;

  res.write = function (chunk, ...args) {
    if (chunk) {
      responseSize += Buffer.byteLength(chunk);
    }
    return originalWrite.apply(res, [chunk, ...args]);
  };

  res.end = function (chunk, ...args) {
    if (chunk) {
      responseSize += Buffer.byteLength(chunk);
    }

    const diff = process.hrtime(startTime);
    const responseTimeMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6); // In milliseconds
    const statusCode = res.statusCode;

    let statusCategory = '2xx';
    if (statusCode >= 300 && statusCode < 400) statusCategory = '3xx';
    else if (statusCode >= 400 && statusCode < 500) statusCategory = '4xx';
    else if (statusCode >= 500) statusCategory = '5xx';

    const userEmail = req.session?.user?.email || 'anonymous';

    const logItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode,
      statusCategory,
      responseTimeMs,
      ip,
      userAgent,
      requestSize,
      responseSize,
      protocol,
      hasCookie,
      userEmail,
      timestamp: requestTimestamp.toISOString(),
    };

    // Keep in-memory buffer limited to 100 recent entries
    recentNetworkRequests.unshift(logItem);
    if (recentNetworkRequests.length > MAX_BUFFER_SIZE) {
      recentNetworkRequests.pop();
    }

    // Asynchronously save to MongoDB (do not block the response cycle)
    NetworkLog.create(logItem).catch(() => {
      // Silently ignore log write errors
    });

    return originalEnd.apply(res, [chunk, ...args]);
  };

  next();
}

function getRecentNetworkRequests() {
  return recentNetworkRequests;
}

module.exports = {
  networkMonitorMiddleware,
  getRecentNetworkRequests,
};
