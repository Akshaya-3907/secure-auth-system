const session = require('express-session');
const connectMongo = require('connect-mongo');
const MongoStore = connectMongo.default || connectMongo.MongoStore || connectMongo;
const mongoose = require('mongoose');

const SESSION_SECRET = process.env.SESSION_SECRET || 'cybersecurity_super_secret_session_key_2026';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes session duration

/**
 * Configure express-session with connect-mongo
 */
function createSessionMiddleware(mongoUri) {
  const store = MongoStore.create({
    mongoUrl: mongoUri,
    collectionName: 'sessions',
    ttl: 30 * 60, // 30 minutes TTL in seconds for MongoStore
    autoRemove: 'native',
    touchAfter: 24 * 3600, // Lazy session update every 24h unless session data modified
    crypto: {
      secret: SESSION_SECRET,
    },
  });

  return session({
    name: 'cybersec.sid', // Custom session cookie name (avoids default connect.sid footprint)
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // Don't create empty sessions until login
    rolling: true, // Refresh cookie expiration on each authenticated request
    store,
    cookie: {
      httpOnly: true, // Prevents client-side JavaScript access (XSS defense)
      secure: process.env.NODE_ENV === 'production', // Transmit only over HTTPS in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // CSRF mitigation
      maxAge: SESSION_TTL_MS, // 30 minutes
      path: '/',
    },
  });
}

/**
 * Query active sessions directly from MongoDB
 */
async function getActiveSessions() {
  try {
    const db = mongoose.connection.db;
    if (!db) return [];

    const sessionsCollection = db.collection('sessions');
    const rawSessions = await sessionsCollection.find({}).toArray();

    const now = new Date();
    const activeList = [];

    for (const item of rawSessions) {
      try {
        let sessionData = {};
        if (typeof item.session === 'string') {
          sessionData = JSON.parse(item.session);
        } else {
          sessionData = item.session;
        }

        const expiresAt = item.expires ? new Date(item.expires) : null;
        const isExpired = expiresAt && expiresAt < now;

        activeList.push({
          sessionId: item._id,
          user: sessionData.user || null,
          expiresAt: expiresAt ? expiresAt.toISOString() : null,
          isExpired: Boolean(isExpired),
          createdAt: item.createdAt || null,
          ip: sessionData.ip || 'unknown',
          userAgent: sessionData.userAgent || 'unknown',
          lastActivity: sessionData.lastActivity || null,
        });
      } catch (err) {
        // Skip corrupted session
      }
    }

    return activeList;
  } catch (err) {
    console.error('Error fetching active sessions:', err.message);
    return [];
  }
}

/**
 * Destroy a specific session in MongoDB by ID
 */
async function terminateSessionById(sessionId) {
  try {
    const db = mongoose.connection.db;
    if (!db) return false;
    const result = await db.collection('sessions').deleteOne({ _id: sessionId });
    return result.deletedCount > 0;
  } catch (err) {
    console.error('Error terminating session:', err.message);
    return false;
  }
}

module.exports = {
  createSessionMiddleware,
  getActiveSessions,
  terminateSessionById,
  SESSION_TTL_MS,
};
