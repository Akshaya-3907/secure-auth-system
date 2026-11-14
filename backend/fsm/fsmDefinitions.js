/**
 * FORMAL LANGUAGES AND AUTOMATA THEORY (FLAT)
 * Formal Finite State Machine (FSM) Specification
 * 
 * Mathematical Model: M = (Q, Σ, δ, q0, F)
 * Where:
 *  - Q: Finite set of states { S0, S1, S2, S3, S4, S5, S6, S7 }
 *  - Σ: Finite set of input symbols (Authentication Events)
 *  - δ: State Transition Function δ: Q × Σ → Q
 *  - q0: Initial State (S0 - LOGGED_OUT)
 *  - F: Set of accepting / target operational states { S3 - ACTIVE_SESSION }
 */

const FSM_STATES = {
  S0: 'LOGGED_OUT',
  S1: 'AUTHENTICATING',
  S2: 'AUTHENTICATED',
  S3: 'ACTIVE_SESSION',
  S4: 'FAILED_LOGIN',
  S5: 'ACCOUNT_LOCKED',
  S6: 'SESSION_EXPIRED',
  S7: 'LOGGED_OUT_SUCCESSFULLY',
};

const FSM_EVENTS = {
  SUBMIT_CREDENTIALS: 'SUBMIT_CREDENTIALS',
  CREDENTIALS_VALID: 'CREDENTIALS_VALID',
  CREDENTIALS_INVALID: 'CREDENTIALS_INVALID',
  SESSION_CREATED: 'SESSION_CREATED',
  LOCKOUT_TRIGGERED: 'LOCKOUT_TRIGGERED',
  TIMEOUT_TRIGGERED: 'TIMEOUT_TRIGGERED',
  LOGOUT_REQUESTED: 'LOGOUT_REQUESTED',
  ACKNOWLEDGE_RESET: 'ACKNOWLEDGE_RESET',
  UNLOCK_TRIGGERED: 'UNLOCK_TRIGGERED',
  FORCE_TERMINATION: 'FORCE_TERMINATION',
};

// State Metadata for Visualization & Explanation
const STATE_METADATA = {
  LOGGED_OUT: {
    id: 'S0',
    name: 'LOGGED_OUT',
    label: 'S0: Logged Out',
    description: 'Initial resting state. No active credentials or session cookies exist.',
    type: 'initial',
    color: '#64748b', // Slate
    badgeClass: 'badge-secondary',
    isAccepting: false,
  },
  AUTHENTICATING: {
    id: 'S1',
    name: 'AUTHENTICATING',
    label: 'S1: Authenticating',
    description: 'Transient state. Regex parsing and bcrypt password hash verification in progress.',
    type: 'transient',
    color: '#38bdf8', // Cyan
    badgeClass: 'badge-info',
    isAccepting: false,
  },
  AUTHENTICATED: {
    id: 'S2',
    name: 'AUTHENTICATED',
    label: 'S2: Authenticated',
    description: 'Credentials successfully validated. Session generation and cookie signing underway.',
    type: 'transient',
    color: '#a855f7', // Purple
    badgeClass: 'badge-primary',
    isAccepting: false,
  },
  ACTIVE_SESSION: {
    id: 'S3',
    name: 'ACTIVE_SESSION',
    label: 'S3: Active Session',
    description: 'Operational accepting state. Valid HttpOnly signed session exists with rolling TTL.',
    type: 'accepting',
    color: '#10b981', // Emerald green
    badgeClass: 'badge-success',
    isAccepting: true,
  },
  FAILED_LOGIN: {
    id: 'S4',
    name: 'FAILED_LOGIN',
    label: 'S4: Failed Login',
    description: 'Authentication failed due to invalid credentials. Increments failed attempt counter.',
    type: 'error',
    color: '#f59e0b', // Amber
    badgeClass: 'badge-warning',
    isAccepting: false,
  },
  ACCOUNT_LOCKED: {
    id: 'S5',
    name: 'ACCOUNT_LOCKED',
    label: 'S5: Account Locked',
    description: 'Security defense state entered after 5 consecutive failed login attempts.',
    type: 'locked',
    color: '#ef4444', // Red
    badgeClass: 'badge-danger',
    isAccepting: false,
  },
  SESSION_EXPIRED: {
    id: 'S6',
    name: 'SESSION_EXPIRED',
    label: 'S6: Session Expired',
    description: 'Session TTL exceeded or inactivity timeout reached. Session destroyed in MongoDB.',
    type: 'warning',
    color: '#ec4899', // Pink
    badgeClass: 'badge-secondary',
    isAccepting: false,
  },
  LOGGED_OUT_SUCCESSFULLY: {
    id: 'S7',
    name: 'LOGGED_OUT_SUCCESSFULLY',
    label: 'S7: Logged Out Successfully',
    description: 'User-initiated clean session termination. Cookie cleared from client and database.',
    type: 'terminal',
    color: '#06b6d4', // Bright cyan
    badgeClass: 'badge-info',
    isAccepting: false,
  },
};

/**
 * Formal State Transition Table δ(Current_State, Event) -> Next_State
 */
const TRANSITION_TABLE = {
  // From S0: LOGGED_OUT
  LOGGED_OUT: {
    SUBMIT_CREDENTIALS: 'AUTHENTICATING',
  },

  // From S1: AUTHENTICATING
  AUTHENTICATING: {
    CREDENTIALS_VALID: 'AUTHENTICATED',
    CREDENTIALS_INVALID: 'FAILED_LOGIN',
    LOCKOUT_TRIGGERED: 'ACCOUNT_LOCKED',
  },

  // From S2: AUTHENTICATED
  AUTHENTICATED: {
    SESSION_CREATED: 'ACTIVE_SESSION',
    CREDENTIALS_INVALID: 'FAILED_LOGIN',
  },

  // From S3: ACTIVE_SESSION
  ACTIVE_SESSION: {
    LOGOUT_REQUESTED: 'LOGGED_OUT_SUCCESSFULLY',
    TIMEOUT_TRIGGERED: 'SESSION_EXPIRED',
    FORCE_TERMINATION: 'LOGGED_OUT_SUCCESSFULLY',
  },

  // From S4: FAILED_LOGIN
  FAILED_LOGIN: {
    SUBMIT_CREDENTIALS: 'AUTHENTICATING',
    LOCKOUT_TRIGGERED: 'ACCOUNT_LOCKED',
    ACKNOWLEDGE_RESET: 'LOGGED_OUT',
  },

  // From S5: ACCOUNT_LOCKED
  ACCOUNT_LOCKED: {
    UNLOCK_TRIGGERED: 'LOGGED_OUT',
    ACKNOWLEDGE_RESET: 'LOGGED_OUT',
  },

  // From S6: SESSION_EXPIRED
  SESSION_EXPIRED: {
    ACKNOWLEDGE_RESET: 'LOGGED_OUT',
    SUBMIT_CREDENTIALS: 'AUTHENTICATING',
  },

  // From S7: LOGGED_OUT_SUCCESSFULLY
  LOGGED_OUT_SUCCESSFULLY: {
    ACKNOWLEDGE_RESET: 'LOGGED_OUT',
    SUBMIT_CREDENTIALS: 'AUTHENTICATING',
  },
};

// Formal FLAT Regular Expressions for Lexical Analysis & Validation
const FLAT_REGEX_PATTERNS = {
  USERNAME: {
    pattern: '^[a-zA-Z0-9_]{3,20}$',
    regex: /^[a-zA-Z0-9_]{3,20}$/,
    description: 'Alphanumeric with underscores only, length 3 to 20 characters (Chomsky Type-3 Regular Language).',
    grammar: 'L = { w ∈ {a-z, A-Z, 0-9, _}* | 3 ≤ |w| ≤ 20 }',
  },
  EMAIL: {
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    description: 'Standard RFC-compliant email structure with local-part, @ domain delimiter, and valid TLD.',
    grammar: 'L = { u@d.t | u ∈ Σ_local+, d ∈ Σ_domain+, t ∈ Σ_alpha{2,} }',
  },
  PASSWORD_COMPLEXITY: {
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    description: 'Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special symbol.',
    grammar: 'Intersection of 5 Regular Languages: L_len ∩ L_lower ∩ L_upper ∩ L_digit ∩ L_special',
  },
};

module.exports = {
  FSM_STATES,
  FSM_EVENTS,
  STATE_METADATA,
  TRANSITION_TABLE,
  FLAT_REGEX_PATTERNS,
};
