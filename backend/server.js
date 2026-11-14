require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');

const { createSessionMiddleware } = require('./session/sessionConfig');
const { networkMonitorMiddleware } = require('./middleware/networkMonitor');
const User = require('./models/User');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const fsmRoutes = require('./routes/fsmRoutes');
const networkRoutes = require('./routes/networkRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secure_web_auth_fsm';

// Trust reverse proxy (e.g. Render, Heroku) for HTTPS cookies and accurate client IP
app.set('trust proxy', 1);

// CORS configuration supporting credentials/cookies
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'production') {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev/testing
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Computer Networks: Real-time network request logging middleware
app.use(networkMonitorMiddleware);

// Session State Management (express-session with connect-mongo)
app.use(createSessionMiddleware(MONGODB_URI));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    application: 'SECURE WEB AUTHENTICATION AND INTELLIGENT SESSION STATE MANAGEMENT SYSTEM',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/fsm', fsmRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/session', sessionRoutes);

// Seed default administrator if not present
async function seedDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ email: 'admin@secureauth.edu' });
    if (!adminExists) {
      await User.create({
        username: 'sysadmin',
        email: 'admin@secureauth.edu',
        password: 'Admin@Secure2026!',
        role: 'admin',
        currentFsmState: 'LOGGED_OUT',
        fsmHistory: [
          {
            fromState: null,
            toState: 'LOGGED_OUT',
            event: 'INITIALIZE',
            valid: true,
            reason: 'Default administrator initialized in S0: LOGGED_OUT.',
          },
        ],
      });
      console.log('Default administrator created: admin@secureauth.edu / Admin@Secure2026!');
    }
  } catch (err) {
    console.error('Error seeding admin user:', err.message);
  }
}

// Serve Frontend static assets in Production
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// SPA Catch-all fallback for client-side routing (Express 5 compatible)
app.use((req, res, next) => {
  // If API route not found, return JSON 404
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint '${req.originalUrl}' not found.`,
    });
  }
  // Otherwise serve React SPA index.html if it exists
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(`
        <html>
          <head><title>Secure Web Auth & FSM API Server</title></head>
          <body style="background:#0b0f19; color:#f8fafc; font-family:sans-serif; text-align:center; padding:50px;">
            <h1 style="color:#00f5ff;">SECURE WEB AUTHENTICATION AND INTELLIGENT SESSION STATE MANAGEMENT SYSTEM</h1>
            <p>API Server is active and operational on port ${PORT}.</p>
            <p>To view the full React application in development, run the frontend with <code>npm run dev</code> inside <code>frontend/</code>.</p>
          </body>
        </html>
      `);
    }
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

// Start Server & Connect MongoDB
async function startServer() {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI.replace(/:([^:@]{4})[^:@]*@/, ':****@'));
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully!');

    await seedDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
