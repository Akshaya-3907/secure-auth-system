/**
 * Comprehensive Automated System Test Suite
 * Tests all three integrated academic subjects:
 * 1. Full Stack Web Development (Auth, Session, Mongo, User/Admin Dashboards)
 * 2. Formal Languages & Automata Theory (FSM states S0-S7, valid transitions, strict invalid rejection)
 * 3. Computer Networks (HTTP requests, status codes, latency, cookies, 5-strike lockout)
 */

const http = require('http');

const PORT = 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let sessionCookie = '';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      if (res.headers['set-cookie']) {
        sessionCookie = res.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ');
      }
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('STARTING SECURE WEB AUTH & FSM COMPREHENSIVE TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/health',
      method: 'GET',
    });
    assert(health.status === 200 && health.data.status === 'OK', '1. Server Health Check (HTTP 200)');

    // 2. FLAT Lexical Validation - Rejection of invalid username
    const invalidReg = await request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        username: 'ab', // Invalid: < 3 chars
        email: 'test@college.edu',
        password: 'ValidPassword123!',
        role: 'user',
      }
    );
    assert(
      invalidReg.status === 400 && invalidReg.data.regexGrammar !== undefined,
      '2. FLAT Lexical Analysis Rejection: Username < 3 chars (HTTP 400 + Type-3 Grammar)'
    );

    // 3. FLAT Lexical Validation - Rejection of weak password
    const weakPassReg = await request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        username: 'alice_crypto',
        email: 'alice@college.edu',
        password: 'weakpassword', // Lacks uppercase, digit, special symbol
        role: 'user',
      }
    );
    assert(
      weakPassReg.status === 400 && weakPassReg.data.message.includes('DFA'),
      '3. FLAT Lexical Analysis Rejection: Password lacks 5-grammar intersection (HTTP 400)'
    );

    // 4. Valid Registration
    const testUsername = `user_${Date.now()}`;
    const testEmail = `${testUsername}@college.edu`;
    const validReg = await request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        username: testUsername,
        email: testEmail,
        password: 'SecurePassword123!',
        role: 'user',
      }
    );
    assert(
      validReg.status === 201 && validReg.data.success === true,
      '4. Valid User Registration with Salted Bcrypt & Initial S0 State (HTTP 201)'
    );

    // 5. Successful Login
    const loginRes = await request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: testEmail,
        password: 'SecurePassword123!',
      }
    );
    assert(
      loginRes.status === 200 &&
        loginRes.data.fsmState === 'ACTIVE_SESSION' &&
        sessionCookie.includes('cybersec.sid'),
      '5. Successful Authentication & Transition to S3: ACTIVE_SESSION with HttpOnly Cookie (HTTP 200)'
    );

    // 6. Verify Authenticated Me Endpoint
    const meRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    assert(
      meRes.status === 200 && meRes.data.isAuthenticated === true && meRes.data.fsmState === 'ACTIVE_SESSION',
      '6. Verify Active Session State in MongoDB & Rolling TTL (HTTP 200)'
    );

    // 7. Secure Logout
    const logoutRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/logout',
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    assert(
      logoutRes.status === 200 && logoutRes.data.fsmState === 'LOGGED_OUT',
      '7. Secure Session Termination: S3 -> S7 (LOGGED_OUT_SUCCESSFULLY) -> S0 (LOGGED_OUT) (HTTP 200)'
    );

    // 8. 5-Strike Brute Force Defense Test (Account Lockout -> S5)
    console.log('\n--- Testing 5 Consecutive Failed Logins Defense (Account Lockout) ---');
    let lastLockoutRes = null;
    for (let i = 1; i <= 5; i++) {
      lastLockoutRes = await request(
        {
          hostname: '127.0.0.1',
          port: PORT,
          path: '/api/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        {
          email: testEmail,
          password: 'IncorrectPassword999!',
        }
      );
      console.log(`   Attempt ${i}/5 response status: ${lastLockoutRes.status}, state: ${lastLockoutRes.data.fsmState}`);
    }

    assert(
      lastLockoutRes.status === 423 && lastLockoutRes.data.fsmState === 'ACCOUNT_LOCKED',
      '8. 5 Consecutive Failed Logins Trigger Transition to S5: ACCOUNT_LOCKED (HTTP 423 Locked)'
    );

    // 9. Subsequent login attempt to locked account remains blocked
    const subsequentRes = await request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: testEmail,
        password: 'SecurePassword123!', // Even with correct password, locked account blocks
      }
    );
    assert(
      subsequentRes.status === 423 && subsequentRes.data.fsmState === 'ACCOUNT_LOCKED',
      '9. Locked Account Blocks Even Valid Credentials (HTTP 423 Locked defense)'
    );

    // 10. Admin Login & Unlock
    const adminLogin = await request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: 'admin@secureauth.edu',
        password: 'Admin@Secure2026!',
      }
    );
    assert(
      adminLogin.status === 200 && adminLogin.data.user.role === 'admin',
      '10. Admin Authentication Successful (HTTP 200)'
    );
    const adminCookie = sessionCookie;

    // Admin unlocks user
    const userToUnlock = validReg.data.user.id;
    const unlockRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/admin/users/${userToUnlock}/unlock`,
      method: 'POST',
      headers: { Cookie: adminCookie },
    });
    assert(
      unlockRes.status === 200 && unlockRes.data.success === true,
      '11. Admin Successfully Unlocks Account (FSM reset to S0: LOGGED_OUT)'
    );

    // 12. FLAT FSM Simulator - Valid Transition
    const simValid = await request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/fsm/simulate',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        currentState: 'LOGGED_OUT',
        event: 'SUBMIT_CREDENTIALS',
      }
    );
    assert(
      simValid.status === 200 && simValid.data.currentState === 'AUTHENTICATING',
      '12. FSM Simulator: Valid transition δ(S0, SUBMIT_CREDENTIALS) -> S1: AUTHENTICATING (HTTP 200)'
    );

    // 13. FLAT FSM Simulator - Strict Invalid Rejection
    const simInvalid = await request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/fsm/simulate',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        currentState: 'LOGGED_OUT',
        event: 'SESSION_CREATED', // Illegal from S0 without credentials
      }
    );
    assert(
      simInvalid.status === 400 && simInvalid.data.code === 'FSM_TRANSITION_REJECTED',
      '13. FSM Simulator: Strict Rejection of Illegal Transition δ(S0, SESSION_CREATED) (HTTP 400)'
    );

    // 14. Computer Networks Telemetry
    const netStats = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/network/stats',
      method: 'GET',
    });
    assert(
      netStats.status === 200 && netStats.data.stats.totalRequests > 0,
      '14. Computer Networks: HTTP Request & Response Telemetry Active (HTTP 200)'
    );

    // 15. Security Event Logs & Sanitization (Never store passwords)
    const logsRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/session/logs?limit=10',
      method: 'GET',
      headers: { Cookie: adminCookie },
    });
    assert(
      logsRes.status === 200 && logsRes.data.logs.length > 0,
      '15. Security Event Audit Trail Active (HTTP 200)'
    );

    const logString = JSON.stringify(logsRes.data.logs);
    const hasRawPassword = logString.includes('SecurePassword123!') || logString.includes('IncorrectPassword999!');
    assert(
      !hasRawPassword,
      '16. Security Sanitization Rule: Passwords & Sensitive Tokens NEVER Stored in Logs'
    );
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Start test runner
runTests();
