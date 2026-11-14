const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes lockout

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric with underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password hash by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    currentFsmState: {
      type: String,
      default: 'LOGGED_OUT',
      enum: [
        'LOGGED_OUT',
        'AUTHENTICATING',
        'AUTHENTICATED',
        'ACTIVE_SESSION',
        'FAILED_LOGIN',
        'ACCOUNT_LOCKED',
        'SESSION_EXPIRED',
        'LOGGED_OUT_SUCCESSFULLY',
      ],
    },
    fsmHistory: [
      {
        fromState: String,
        toState: String,
        event: String,
        timestamp: { type: Date, default: Date.now },
        valid: Boolean,
        reason: String,
      },
    ],
    lastLoginAt: {
      type: Date,
    },
    lastActivityAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is currently locked
userSchema.methods.isLocked = function () {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

// Increment failed attempts and trigger lockout if >= 5
userSchema.methods.incrementFailedAttempts = async function () {
  // If lock already expired, reset counter to 1
  if (this.lockUntil && this.lockUntil.getTime() <= Date.now()) {
    this.failedLoginAttempts = 1;
    this.lockUntil = null;
    this.currentFsmState = 'FAILED_LOGIN';
  } else {
    this.failedLoginAttempts += 1;
    if (this.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      this.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
      this.currentFsmState = 'ACCOUNT_LOCKED';
    } else {
      this.currentFsmState = 'FAILED_LOGIN';
    }
  }

  this.fsmHistory.push({
    fromState: this.currentFsmState === 'ACCOUNT_LOCKED' ? 'AUTHENTICATING' : 'AUTHENTICATING',
    toState: this.currentFsmState,
    event: this.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS ? 'LOCKOUT_TRIGGERED' : 'CREDENTIALS_INVALID',
    timestamp: new Date(),
    valid: true,
    reason:
      this.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS
        ? `Exceeded 5 failed login attempts (${this.failedLoginAttempts}). Account locked for 15 minutes.`
        : `Failed login attempt ${this.failedLoginAttempts} of ${MAX_LOGIN_ATTEMPTS}.`,
  });

  return this.save();
};

// Reset login attempts after successful authentication
userSchema.methods.resetFailedAttempts = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  this.lastLoginAt = new Date();
  this.lastActivityAt = new Date();
  this.currentFsmState = 'ACTIVE_SESSION';

  this.fsmHistory.push({
    fromState: 'AUTHENTICATED',
    toState: 'ACTIVE_SESSION',
    event: 'SESSION_CREATED',
    timestamp: new Date(),
    valid: true,
    reason: 'Successful login; failed attempts counter reset and active session established.',
  });

  return this.save();
};

// Administrative unlock
userSchema.methods.unlockAccount = async function (adminEmail = 'system') {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  const prevState = this.currentFsmState;
  this.currentFsmState = 'LOGGED_OUT';

  this.fsmHistory.push({
    fromState: prevState,
    toState: 'LOGGED_OUT',
    event: 'UNLOCK_TRIGGERED',
    timestamp: new Date(),
    valid: true,
    reason: `Account unlocked by administrator (${adminEmail}).`,
  });

  return this.save();
};

module.exports = mongoose.model('User', userSchema);
