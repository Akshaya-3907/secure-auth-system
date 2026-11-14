const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AuthFSM = require('../fsm/AuthFSM');
const { FSM_STATES, FSM_EVENTS, FLAT_REGEX_PATTERNS } = require('../fsm/fsmDefinitions');
const { logSecurityEvent } = require('../logging/securityLogger');
const FsmStateHistory = require('../models/FsmStateHistory');

/**
 * Helper to record global FSM transition in database
 */
async function recordFsmHistory({ userId, userEmail, fromState, toState, event, valid, reason, ip }) {
  try {
    await FsmStateHistory.create({
      userId,
      userEmail,
      fromState,
      toState,
      event,
      valid,
      reason,
      ipAddress: ip || '127.0.0.1',
    });
  } catch (err) {
    // Non-blocking log
  }
}

/**
 * POST /api/auth/register
 * Module 1 & 2: User Registration with Regular Expression Validation
 */
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    // 1. Lexical Analysis / Regular Expression Validation
    if (!username || !FLAT_REGEX_PATTERNS.USERNAME.regex.test(username.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid username: Must be 3-20 characters alphanumeric or underscore.',
        regexGrammar: FLAT_REGEX_PATTERNS.USERNAME.grammar,
      });
    }

    if (!email || !FLAT_REGEX_PATTERNS.EMAIL.regex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format according to RFC grammar.',
        regexGrammar: FLAT_REGEX_PATTERNS.EMAIL.grammar,
      });
    }

    if (!password || !FLAT_REGEX_PATTERNS.PASSWORD_COMPLEXITY.regex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          'Password does not meet complexity DFA rules: Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special symbol (@$!%*?&).',
        regexGrammar: FLAT_REGEX_PATTERNS.PASSWORD_COMPLEXITY.grammar,
      });
    }

    // 2. Check for duplicate account
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { username: username.trim() }],
    });

    if (existingUser) {
      await logSecurityEvent({
        eventType: 'REGISTRATION',
        severity: 'WARNING',
        outcome: 'FAILURE',
        userEmail: email,
        ipAddress: clientIp,
        userAgent,
        details: { reason: 'Duplicate username or email registration attempt' },
      });

      return res.status(409).json({
        success: false,
        message: 'A user with that email or username already exists.',
      });
    }

    // 3. Create User (password hashing handled by Mongoose pre-save hook)
    const newUser = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role === 'admin' ? 'admin' : 'user',
      currentFsmState: 'LOGGED_OUT',
      fsmHistory: [
        {
          fromState: null,
          toState: 'LOGGED_OUT',
          event: 'INITIALIZE',
          valid: true,
          reason: 'User created in S0: LOGGED_OUT state.',
        },
      ],
    });

    // 4. Log Security Event
    await logSecurityEvent({
      eventType: 'REGISTRATION',
      severity: 'INFO',
      outcome: 'SUCCESS',
      userEmail: newUser.email,
      userId: newUser._id,
      ipAddress: clientIp,
      userAgent,
      fsmState: 'LOGGED_OUT',
      details: { role: newUser.role, username: newUser.username },
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful! You may now sign in.',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        fsmState: newUser.currentFsmState,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/login
 * Modules 1, 2, 3: Authentication with FSM State Machine & Account Lockout
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both email and password.',
      fsmState: 'LOGGED_OUT',
    });
  }

  try {
    // FLAT FSM Initialization: S0 -> S1 (AUTHENTICATING)
    const fsm = new AuthFSM(FSM_STATES.S0);
    fsm.transition(FSM_EVENTS.SUBMIT_CREDENTIALS, { email });

    await recordFsmHistory({
      userEmail: email,
      fromState: 'LOGGED_OUT',
      toState: 'AUTHENTICATING',
      event: 'SUBMIT_CREDENTIALS',
      valid: true,
      reason: 'User submitted login credentials. Entered S1: AUTHENTICATING.',
      ip: clientIp,
    });

    // Lookup user in MongoDB (explicitly select password)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    // Case 1: User does not exist
    if (!user) {
      try {
        fsm.transition(FSM_EVENTS.CREDENTIALS_INVALID, { reason: 'User not found' });
      } catch (e) {}

      await logSecurityEvent({
        eventType: 'LOGIN_FAILURE',
        severity: 'WARNING',
        outcome: 'FAILURE',
        userEmail: email,
        ipAddress: clientIp,
        userAgent,
        fsmState: 'FAILED_LOGIN',
        details: { reason: 'Account does not exist' },
      });

      await recordFsmHistory({
        userEmail: email,
        fromState: 'AUTHENTICATING',
        toState: 'FAILED_LOGIN',
        event: 'CREDENTIALS_INVALID',
        valid: true,
        reason: 'User record not found in database.',
        ip: clientIp,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        fsmState: 'FAILED_LOGIN',
      });
    }

    // Case 2: Account is currently locked (S5 - ACCOUNT_LOCKED)
    if (user.isLocked()) {
      const lockRemainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));

      await logSecurityEvent({
        eventType: 'LOGIN_FAILURE',
        severity: 'DANGER',
        outcome: 'BLOCKED',
        userEmail: user.email,
        userId: user._id,
        ipAddress: clientIp,
        userAgent,
        fsmState: 'ACCOUNT_LOCKED',
        details: {
          reason: 'Attempted login to locked account',
          lockRemainingMinutes,
        },
      });

      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to 5 consecutive failed login attempts. Try again in ${lockRemainingMinutes} minute(s) or contact administrator.`,
        fsmState: 'ACCOUNT_LOCKED',
        lockUntil: user.lockUntil,
        lockRemainingMinutes,
      });
    }

    // Case 3: Compare password hash with bcrypt
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment failed attempts and potentially lock
      await user.incrementFailedAttempts();

      const isNowLocked = user.isLocked();
      const currentAttempts = user.failedLoginAttempts;
      const remainingAttempts = Math.max(0, 5 - currentAttempts);

      if (isNowLocked) {
        // State S5: ACCOUNT_LOCKED
        await logSecurityEvent({
          eventType: 'ACCOUNT_LOCKED',
          severity: 'CRITICAL',
          outcome: 'BLOCKED',
          userEmail: user.email,
          userId: user._id,
          ipAddress: clientIp,
          userAgent,
          fsmState: 'ACCOUNT_LOCKED',
          details: {
            reason: 'Exceeded maximum permitted failed login attempts (5)',
            lockDurationMinutes: 15,
          },
        });

        await recordFsmHistory({
          userId: user._id,
          userEmail: user.email,
          fromState: 'FAILED_LOGIN',
          toState: 'ACCOUNT_LOCKED',
          event: 'LOCKOUT_TRIGGERED',
          valid: true,
          reason: '5 failed login attempts exceeded. Transitioned to S5: ACCOUNT_LOCKED.',
          ip: clientIp,
        });

        return res.status(423).json({
          success: false,
          message:
            'Security Alert: Your account has been locked for 15 minutes due to 5 consecutive failed login attempts.',
          fsmState: 'ACCOUNT_LOCKED',
          failedAttempts: 5,
          lockUntil: user.lockUntil,
        });
      } else {
        // State S4: FAILED_LOGIN
        await logSecurityEvent({
          eventType: 'LOGIN_FAILURE',
          severity: 'WARNING',
          outcome: 'FAILURE',
          userEmail: user.email,
          userId: user._id,
          ipAddress: clientIp,
          userAgent,
          fsmState: 'FAILED_LOGIN',
          details: {
            failedAttempts: currentAttempts,
            remainingAttempts,
          },
        });

        await recordFsmHistory({
          userId: user._id,
          userEmail: user.email,
          fromState: 'AUTHENTICATING',
          toState: 'FAILED_LOGIN',
          event: 'CREDENTIALS_INVALID',
          valid: true,
          reason: `Password mismatch. Failed attempt ${currentAttempts} of 5.`,
          ip: clientIp,
        });

        return res.status(401).json({
          success: false,
          message: `Invalid credentials. ${remainingAttempts} attempt(s) remaining before account lockout.`,
          fsmState: 'FAILED_LOGIN',
          failedAttempts: currentAttempts,
          remainingAttempts,
        });
      }
    }

    // Case 4: Authentication SUCCESSFUL!
    // FSM Transitions: S1 -> S2 (AUTHENTICATED) -> S3 (ACTIVE_SESSION)
    await user.resetFailedAttempts();

    await recordFsmHistory({
      userId: user._id,
      userEmail: user.email,
      fromState: 'AUTHENTICATING',
      toState: 'AUTHENTICATED',
      event: 'CREDENTIALS_VALID',
      valid: true,
      reason: 'Bcrypt hash matched. User identity confirmed.',
      ip: clientIp,
    });

    await recordFsmHistory({
      userId: user._id,
      userEmail: user.email,
      fromState: 'AUTHENTICATED',
      toState: 'ACTIVE_SESSION',
      event: 'SESSION_CREATED',
      valid: true,
      reason: 'Session token provisioned in MongoDB and HttpOnly cookie dispatched to client.',
      ip: clientIp,
    });

    // Populate express-session with user payload
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    req.session.ip = clientIp;
    req.session.userAgent = userAgent;
    req.session.lastActivity = new Date().toISOString();

    // Log Successful Login
    await logSecurityEvent({
      eventType: 'LOGIN_SUCCESS',
      severity: 'INFO',
      outcome: 'SUCCESS',
      userEmail: user.email,
      userId: user._id,
      ipAddress: clientIp,
      userAgent,
      fsmState: 'ACTIVE_SESSION',
      details: { role: user.role, username: user.username },
    });

    return res.status(200).json({
      success: true,
      message: 'Authentication successful. Active session established.',
      fsmState: 'ACTIVE_SESSION',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
      },
      transitionSequence: [
        { from: 'S0', to: 'S1', event: 'SUBMIT_CREDENTIALS' },
        { from: 'S1', to: 'S2', event: 'CREDENTIALS_VALID' },
        { from: 'S2', to: 'S3', event: 'SESSION_CREATED' },
      ],
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/logout
 * Modules 1, 2, 3: Secure Session Termination
 * S3 (ACTIVE_SESSION) -> S7 (LOGGED_OUT_SUCCESSFULLY) -> S0 (LOGGED_OUT)
 */
router.post('/logout', async (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const user = req.session?.user;

  if (user) {
    // Record FSM transition
    await recordFsmHistory({
      userId: user.id,
      userEmail: user.email,
      fromState: 'ACTIVE_SESSION',
      toState: 'LOGGED_OUT_SUCCESSFULLY',
      event: 'LOGOUT_REQUESTED',
      valid: true,
      reason: 'User executed clean session logout.',
      ip: clientIp,
    });

    await recordFsmHistory({
      userId: user.id,
      userEmail: user.email,
      fromState: 'LOGGED_OUT_SUCCESSFULLY',
      toState: 'LOGGED_OUT',
      event: 'ACKNOWLEDGE_RESET',
      valid: true,
      reason: 'Session destroyed. FSM reset to S0: LOGGED_OUT initial state.',
      ip: clientIp,
    });

    // Update user currentFsmState in database
    await User.findByIdAndUpdate(user.id, { currentFsmState: 'LOGGED_OUT' });

    // Log security event
    await logSecurityEvent({
      eventType: 'LOGOUT',
      severity: 'INFO',
      outcome: 'SUCCESS',
      userEmail: user.email,
      userId: user.id,
      ipAddress: clientIp,
      fsmState: 'LOGGED_OUT',
      details: { reason: 'Normal user initiated logout' },
    });
  }

  // Destroy session from MongoDB store
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    // Clear client cookie
    res.clearCookie('cybersec.sid', { path: '/' });
    return res.json({
      success: true,
      message: 'Session terminated. You are logged out.',
      fsmState: 'LOGGED_OUT',
      transitionSequence: [
        { from: 'S3', to: 'S7', event: 'LOGOUT_REQUESTED' },
        { from: 'S7', to: 'S0', event: 'ACKNOWLEDGE_RESET' },
      ],
    });
  });
});

/**
 * GET /api/auth/me
 * Check current active session and FSM state
 */
router.get('/me', async (req, res) => {
  if (req.session && req.session.user) {
    try {
      const dbUser = await User.findById(req.session.user.id).select(
        'username email role currentFsmState lastLoginAt failedLoginAttempts lockUntil'
      );

      if (!dbUser) {
        req.session.destroy(() => {});
        res.clearCookie('cybersec.sid');
        return res.json({
          isAuthenticated: false,
          fsmState: 'LOGGED_OUT',
          user: null,
        });
      }

      // Check if session has expired or if account got locked
      if (dbUser.isLocked()) {
        return res.json({
          isAuthenticated: false,
          fsmState: 'ACCOUNT_LOCKED',
          user: null,
          lockUntil: dbUser.lockUntil,
        });
      }

      // Compute session TTL remaining in seconds
      const maxAgeMs = req.session.cookie.maxAge || 1800000;
      const ttlSeconds = Math.max(0, Math.floor(maxAgeMs / 1000));

      return res.json({
        isAuthenticated: true,
        fsmState: 'ACTIVE_SESSION',
        user: {
          id: dbUser._id,
          username: dbUser.username,
          email: dbUser.email,
          role: dbUser.role,
          lastLoginAt: dbUser.lastLoginAt,
        },
        session: {
          ttlSeconds,
          cookieName: 'cybersec.sid',
          httpOnly: true,
          sameSite: req.session.cookie.sameSite || 'lax',
          secure: Boolean(req.session.cookie.secure),
        },
      });
    } catch (err) {
      return res.status(500).json({ isAuthenticated: false, error: err.message });
    }
  }

  return res.json({
    isAuthenticated: false,
    fsmState: 'LOGGED_OUT',
    user: null,
  });
});

module.exports = router;
