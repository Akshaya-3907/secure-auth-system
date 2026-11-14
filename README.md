# SECURE WEB AUTHENTICATION AND INTELLIGENT SESSION STATE MANAGEMENT SYSTEM

A full-stack cybersecurity web application integrating three core academic computer science subjects into a unified, mathematically governed, and production-ready system:

1. **Full Stack Web Development** (React.js, Vite, Bootstrap, Node.js, Express.js, MongoDB Atlas / Mongoose, bcrypt, express-session, connect-mongo)
2. **Formal Languages and Automata Theory - FLAT** (Deterministic Finite Automaton with 8 discrete states $S_0 \dots S_7$, transition function $\delta$, strict illegal transition rejection, Chomsky Type-3 Regular Grammars for Lexical Analysis)
3. **Computer Networks** (Client-Server REST architecture, OSI Layer 7 HTTP request/response telemetry, status codes, socket latency timers, cryptographic `HttpOnly` / `SameSite` / `Secure` cookies, and session lifecycle tracking)

---

## 🏛️ Academic Disciplines Integration Matrix

| Subject | Module Implemented | Technical & Theoretical Evidence |
| :--- | :--- | :--- |
| **Full Stack Web Dev** | User & Admin Portals, REST API, Database Schemas, Session Store | React 18 SPA (Vite), Express.js REST API, Mongoose Models (`User`, `SecurityLog`, `NetworkLog`, `FsmStateHistory`), Bcrypt (12 salt rounds), MongoDB session store (`connect-mongo`). |
| **FLAT (Automata Theory)** | Authentication Lifecycle State Machine, Regex Lexical Analysis | Formal 5-tuple DFA $M = (Q, \Sigma, \delta, q_0, F)$, 8 discrete states $S_0 - S_7$, strict transition table $\delta$, rejection of unmapped input symbols, Chomsky Type-3 regular grammars for input parsing. |
| **Computer Networks** | HTTP Protocol Inspection, Cookie Security, Network Telemetry | HTTP Status code handling (200, 201, 400, 401, 403, 423 Locked), high-resolution latency timers (`process.hrtime`), cookie security transport flags (`HttpOnly`, `SameSite=lax`, `Secure`), payload bandwidth tracking. |

---

## 📐 Formal Languages & Automata Theory (FLAT) Specification

### 1. Mathematical 5-Tuple Definition
$$M = (Q, \Sigma, \delta, q_0, F)$$

Where:
- **$Q$ (Finite Set of States)**:
  - $S_0$ - `LOGGED_OUT`: Initial resting state. No active credentials or tokens.
  - $S_1$ - `AUTHENTICATING`: Transient state. Regex parsing and bcrypt password hash verification in progress.
  - $S_2$ - `AUTHENTICATED`: Credentials valid. Session provisioning underway.
  - $S_3$ - `ACTIVE_SESSION`: **Accepting Operational State** ($q \in F$). HttpOnly signed cookie active in MongoDB.
  - $S_4$ - `FAILED_LOGIN`: Invalid credentials entered. Increments failed attempt counter.
  - $S_5$ - `ACCOUNT_LOCKED`: Defense state entered after 5 consecutive failed login attempts (HTTP 423 Locked).
  - $S_6$ - `SESSION_EXPIRED`: Inactivity timeout or 30-minute server TTL exceeded.
  - $S_7$ - `LOGGED_OUT_SUCCESSFULLY`: User-initiated clean session termination.
- **$\Sigma$ (Alphabet of Authentication Events)**:
  - `SUBMIT_CREDENTIALS`, `CREDENTIALS_VALID`, `CREDENTIALS_INVALID`, `SESSION_CREATED`, `LOCKOUT_TRIGGERED`, `TIMEOUT_TRIGGERED`, `LOGOUT_REQUESTED`, `ACKNOWLEDGE_RESET`, `UNLOCK_TRIGGERED`, `FORCE_TERMINATION`.
- **$q_0$ (Initial State)**: $S_0$ (`LOGGED_OUT`)
- **$F$ (Set of Accepting States)**: $\{ S_3 \}$ (`ACTIVE_SESSION`)
- **$\delta$ (State Transition Function $\delta : Q \times \Sigma \to Q$)**:

| Current State $Q$ | Input Symbol $\sigma \in \Sigma$ | Next State $Q'$ | Rule Enforced |
| :--- | :--- | :--- | :--- |
| **$S_0$ (LOGGED_OUT)** | `SUBMIT_CREDENTIALS` | **$S_1$ (AUTHENTICATING)** | User provides credentials |
| **$S_1$ (AUTHENTICATING)** | `CREDENTIALS_VALID` | **$S_2$ (AUTHENTICATED)** | Bcrypt hash matches |
| **$S_1$ (AUTHENTICATING)** | `CREDENTIALS_INVALID` | **$S_4$ (FAILED_LOGIN)** | Password mismatch (< 5 fails) |
| **$S_1$ (AUTHENTICATING)** | `LOCKOUT_TRIGGERED` | **$S_5$ (ACCOUNT_LOCKED)** | 5th consecutive failure |
| **$S_2$ (AUTHENTICATED)** | `SESSION_CREATED` | **$S_3$ (ACTIVE_SESSION)** | Session saved in MongoDB |
| **$S_3$ (ACTIVE_SESSION)** | `LOGOUT_REQUESTED` | **$S_7$ (LOGGED_OUT_SUCCESS)** | User clicks logout |
| **$S_3$ (ACTIVE_SESSION)** | `TIMEOUT_TRIGGERED` | **$S_6$ (SESSION_EXPIRED)** | Inactivity > 30 mins |
| **$S_4$ (FAILED_LOGIN)** | `SUBMIT_CREDENTIALS` | **$S_1$ (AUTHENTICATING)** | User retries login |
| **$S_4$ (FAILED_LOGIN)** | `LOCKOUT_TRIGGERED` | **$S_5$ (ACCOUNT_LOCKED)** | Failed attempts count $\ge 5$ |
| **$S_5$ (ACCOUNT_LOCKED)** | `UNLOCK_TRIGGERED` | **$S_0$ (LOGGED_OUT)** | Admin unlocks or TTL expires |
| **$S_6$ (SESSION_EXPIRED)** | `ACKNOWLEDGE_RESET` | **$S_0$ (LOGGED_OUT)** | Redirected to login gate |
| **$S_7$ (LOGGED_OUT_SUCCESS)**| `ACKNOWLEDGE_RESET`| **$S_0$ (LOGGED_OUT)** | Cookie cleared |

> **Invalid Transition Rejection**: Any input $\sigma$ not explicitly defined in $\delta(q, \sigma)$ is strictly rejected by the automata engine with error code `FSM_TRANSITION_REJECTED` (HTTP 400), preventing illegal state manipulation.

### 2. Chomsky Type-3 Regular Grammars (Lexical Analysis)
- **Username Language**: $L_{\text{user}} = \{ w \in \{a\text{-}z, A\text{-}Z, 0\text{-}9, \_\}^* \mid 3 \le |w| \le 20 \}$
- **Email Language**: $L_{\text{email}} = \{ u@d.t \mid u \in \Sigma_{\text{local}}^+, d \in \Sigma_{\text{domain}}^+, t \in \Sigma_{\text{alpha}}^{\{2,\}} \}$
- **Password Complexity Language**: Intersection of 5 regular languages:
  $$L_{\text{pass}} = L_{\text{length}\ge 8} \cap L_{\text{uppercase}} \cap L_{\text{lowercase}} \cap L_{\text{digit}} \cap L_{\text{special}}$$

---

## 🌐 Computer Networks Implementation

- **RESTful Architecture**: Clean separation between client frontend (React Vite SPA) and API backend (Node.js/Express).
- **HTTP Status Code Precision**:
  - `200 OK`: Successful authentication, data retrieval.
  - `201 Created`: User entity registered in MongoDB.
  - `400 Bad Request`: Automata transition rejection or regex lexical parsing error.
  - `401 Unauthorized`: Bad credentials or missing session cookie.
  - `403 Forbidden`: Role authorization restriction (non-admin accessing admin routes).
  - `423 Locked`: **WebDAV / HTTP 423 Resource Locked** returned when an account transitions to $S_5$ `ACCOUNT_LOCKED`.
- **Cookie Security Transport**:
  - `HttpOnly: true` (Shields against cross-site scripting token theft).
  - `SameSite: 'lax'` (Shields against cross-site request forgery).
  - `Secure: true` in production (Transmits exclusively over HTTPS).
  - `name: 'cybersec.sid'` (Obscures framework identity).
- **Live Network Telemetry Middleware**: Records timestamps, IP address, user-agent, request & response payload sizes (bytes), status categories (2xx, 4xx, 5xx), and microsecond-level socket latency using `process.hrtime()`.

---

## 🛡️ Cybersecurity Defense Features

1. **Brute-Force Lockout Defense**: 5 consecutive failed login attempts automatically lock the account for 15 minutes, shifting the user to state $S_5$ (`ACCOUNT_LOCKED`) and returning HTTP 423.
2. **Administrative Override**: System administrators can manually unlock locked accounts or lock suspicious entities.
3. **Strict Audit Trail Sanitization**: Sensitive keys (`password`, `confirmPassword`, `token`, `sessionToken`, `cookie`, `secret`) are recursively purged and replaced with `[REDACTED_BY_SECURITY_POLICY]` before committing to MongoDB `SecurityLog`.
4. **Persistent MongoDB Session Store**: Built on `connect-mongo` with native MongoDB TTL indexes for automated server-side expiration.
5. **Rolling Inactivity Timeout**: Active users have their session duration refreshed; idle sessions expire after 30 minutes into state $S_6$ (`SESSION_EXPIRED`).

---

## 💻 10 Application Pages Breakdown

| # | Page Name | Route | Core Functionality |
| :--- | :--- | :--- | :--- |
| 1 | **Home Page** | `/` | Academic integration overview, system architecture, interactive feature cards, live automata status. |
| 2 | **Registration Page** | `/register` | User signup with real-time Chomsky Type-3 Regex & DFA validator, password strength checklist, role choice. |
| 3 | **Login Page** | `/login` | FSM authentication gate ($S_0 \to S_1 \to S_2 \to S_3$ or $S_4/S_5$), failed attempt counter, lockout countdown, quick-fill demo accounts. |
| 4 | **User Dashboard** | `/dashboard` | Authenticated user hub, active session TTL countdown timer (MM:SS), current FSM state card, user transition history. |
| 5 | **Admin Dashboard** | `/admin` | System-wide telemetry (users, sessions, lockouts, packets), user management table with lock/unlock actions and role switches. |
| 6 | **FSM Visualization** | `/fsm` | Full 5-tuple mathematical definition, interactive SVG automata graph with pulsing nodes, live transition simulator, invalid rejection tester. |
| 7 | **Network Monitoring** | `/network` | Real-time HTTP packet traffic stream, status code distribution (2xx, 4xx, 5xx), average latency meters, payload sizes. |
| 8 | **Session Management** | `/sessions` | Inspection of `HttpOnly`/`SameSite`/`Secure` cookie flags, live MongoDB sessions list, remote session force-kill. |
| 9 | **Security Event Logs** | `/logs` | Filterable audit logs by severity (`INFO`, `WARNING`, `DANGER`, `CRITICAL`), event type, IP address, modal payload inspector. |
| 10 | **User Profile** | `/profile` | Profile telemetry, password change form with live DFA validation, personal session details. |

---

## 📂 Project Directory Structure

```
├── backend/
│   ├── fsm/
│   │   ├── AuthFSM.js              # Real Finite State Machine JavaScript engine
│   │   └── fsmDefinitions.js       # Formal 5-tuple, states, transitions & regex definitions
│   ├── logging/
│   │   └── securityLogger.js       # Zero-trust audit logger with sensitive payload sanitization
│   ├── middleware/
│   │   ├── authMiddleware.js       # requireAuth, requireAdmin RBAC guards
│   │   └── networkMonitor.js       # Layer 7 network telemetry & latency measurement
│   ├── models/
│   │   ├── User.js                 # User schema with bcrypt, lockout methods & FSM state
│   │   ├── SecurityLog.js          # Audit log schema with indexed severity & event types
│   │   ├── NetworkLog.js           # Network packet log schema
│   │   └── FsmStateHistory.js      # Global state transition history
│   ├── routes/
│   │   ├── authRoutes.js           # /register, /login, /logout, /me
│   │   ├── userRoutes.js           # /profile, /change-password, /fsm-history
│   │   ├── adminRoutes.js          # /dashboard-stats, /users, lock/unlock, role toggle
│   │   ├── fsmRoutes.js            # /definition, /simulate, /history, /regex-test
│   │   ├── networkRoutes.js        # /stats, /live-stream, /clear
│   │   └── sessionRoutes.js        # /active, /terminate, /inspect, /logs
│   ├── session/
│   │   └── sessionConfig.js        # connect-mongo + express-session configuration
│   └── server.js                   # Main Express application entrypoint
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Top bar with live FSM badge and network ping
│   │   │   ├── Sidebar.jsx         # 10-page cybersecurity navigation
│   │   │   ├── Footer.jsx          # Academic disciplines banner
│   │   │   ├── FsmGraph.jsx        # Interactive SVG DFA graph with active pulse aura
│   │   │   ├── RegexValidator.jsx  # Chomsky Type-3 lexical analysis interactive tester
│   │   │   ├── NetworkPacketInspector.jsx # Live HTTP packet stream table
│   │   │   └── ProtectedRoute.jsx  # Client-side authentication & RBAC router guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global authentication & FSM state provider
│   │   ├── pages/                  # All 10 Application Pages
│   │   ├── services/
│   │   │   └── api.js              # Axios REST client with credentials/cookie support
│   │   ├── styles/
│   │   │   └── cybersecurity.css   # Dark navy (#070c18), purple & cyan glowing styling
│   │   ├── App.jsx                 # Routing across all 10 pages
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── scratch/
│   ├── test_system.js              # Automated 16-point integration test suite
│   └── run_all_tests.js            # In-process test runner
├── .env.example                    # Environment variable template
├── .gitignore                      # Excludes .env and node_modules
├── package.json                    # Root scripts for build, dev, start, render-build
└── README.md                       # Comprehensive documentation
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js >= 18.x (Tested on v24.21.0)
- MongoDB (Local `mongod` on `127.0.0.1:27017` or MongoDB Atlas URI)

### Step 1: Clone and Configure Environment
```bash
git clone <repository-url>
cd online-survey-app
```

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure your `.env` contains:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/secure_web_auth_fsm
SESSION_SECRET=cybersecurity_formal_automata_session_key_ultra_secure_2026
```

### Step 2: Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
npm install --prefix frontend
```

### Step 3: Build & Run
You can run both backend and frontend or start them individually:

**Option A — Run Both in Development:**
```bash
# Terminal 1: Backend API Server
npm run dev:backend

# Terminal 2: Frontend Vite Server
npm run dev:frontend
```
The frontend will be available at: `http://localhost:5173` (proxied to port 5000).

**Option B — Production Build & Unified Server:**
```bash
# Build React frontend
npm run build:frontend

# Start production server (serves frontend build directly on port 5000)
npm start
```
The full application will be accessible at: `http://localhost:5000`.

---

## 🧪 Automated Testing Verification

The project includes an automated 16-point verification suite covering all modules:
```bash
node scratch/run_all_tests.js
```

### Verified Test Results:
```text
======================================================
STARTING SECURE WEB AUTH & FSM COMPREHENSIVE TEST SUITE
======================================================
[PASS] 1. Server Health Check (HTTP 200)
[PASS] 2. FLAT Lexical Analysis Rejection: Username < 3 chars (HTTP 400 + Type-3 Grammar)
[PASS] 3. FLAT Lexical Analysis Rejection: Password lacks 5-grammar intersection (HTTP 400)
[PASS] 4. Valid User Registration with Salted Bcrypt & Initial S0 State (HTTP 201)
[PASS] 5. Successful Authentication & Transition to S3: ACTIVE_SESSION with HttpOnly Cookie (HTTP 200)
[PASS] 6. Verify Active Session State in MongoDB & Rolling TTL (HTTP 200)
[PASS] 7. Secure Session Termination: S3 -> S7 (LOGGED_OUT_SUCCESSFULLY) -> S0 (LOGGED_OUT) (HTTP 200)
--- Testing 5 Consecutive Failed Logins Defense (Account Lockout) ---
   Attempt 1/5 response status: 401, state: FAILED_LOGIN
   Attempt 2/5 response status: 401, state: FAILED_LOGIN
   Attempt 3/5 response status: 401, state: FAILED_LOGIN
   Attempt 4/5 response status: 401, state: FAILED_LOGIN
   Attempt 5/5 response status: 423, state: ACCOUNT_LOCKED
[PASS] 8. 5 Consecutive Failed Logins Trigger Transition to S5: ACCOUNT_LOCKED (HTTP 423 Locked)
[PASS] 9. Locked Account Blocks Even Valid Credentials (HTTP 423 Locked defense)
[PASS] 10. Admin Authentication Successful (HTTP 200)
[PASS] 11. Admin Successfully Unlocks Account (FSM reset to S0: LOGGED_OUT)
[PASS] 12. FSM Simulator: Valid transition δ(S0, SUBMIT_CREDENTIALS) -> S1: AUTHENTICATING (HTTP 200)
[PASS] 13. FSM Simulator: Strict Rejection of Illegal Transition δ(S0, SESSION_CREATED) (HTTP 400)
[PASS] 14. Computer Networks: HTTP Request & Response Telemetry Active (HTTP 200)
[PASS] 15. Security Event Audit Trail Active (HTTP 200)
[PASS] 16. Security Sanitization Rule: Passwords & Sensitive Tokens NEVER Stored in Logs
======================================================
TEST RESULTS: 16 PASSED | 0 FAILED
======================================================
```

---

## 🔑 Default Credentials (College Academic Demonstration)

The server seeds a default administrator on startup:

- **Email**: `admin@secureauth.edu`
- **Password**: `Admin@Secure2026!`
- **Role**: `admin`
- *(Convenient "Quick-Fill" buttons are provided on the Login page for rapid demonstration)*

---

## ☁️ Deployment Guide (Render)

This application is engineered for deployment on [Render](https://render.com) as a single Web Service:

1. **Connect Repository**: Link your GitHub repository to Render.
2. **Environment**: Select `Node`.
3. **Build Command**:
   ```bash
   npm run render-build
   ```
   *(Installs root & frontend dependencies, then compiles the Vite production bundle into `frontend/dist`)*
4. **Start Command**:
   ```bash
   npm start
   ```
5. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or leave default assigned by Render)
   - `MONGODB_URI`: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/secure_web_auth_fsm?retryWrites=true&w=majority`
   - `SESSION_SECRET`: `<any_secure_random_string_32_chars>`

In production, Express automatically serves the compiled React application from `frontend/dist` and handles API requests and session cookies over HTTPS.

---

## 🎓 Viva & Academic Defense Q&A

**Q: How is Automata Theory (FLAT) connected to Web Security in this application?**  
*A: Authentication is fundamentally a discrete state problem. By modeling authentication as a Deterministic Finite Automaton $M = (Q, \Sigma, \delta, q_0, F)$, we formally define the exact sequence of legal transitions. Any attack pattern—such as attempting to establish an active session ($S_3$) without verifying credentials ($S_1 \to S_2$)—is treated as an undefined transition $\delta(S_0, \text{SESSION\_CREATED})$ and strictly rejected by the automata grammar with HTTP 400, eliminating bypass vulnerabilities.*

**Q: Why use HTTP 423 Locked instead of HTTP 401 on the 5th failed login?**  
*A: HTTP 401 denotes bad credentials for a repeatable request. HTTP 423 (WebDAV / RFC 4918) semantically conveys that the resource (the user entity) is locked server-side due to security policy enforcement, signaling the client and proxy caches not to resubmit until the lockout duration expires.*

**Q: How do `HttpOnly` and `SameSite` cookies function at the Computer Networks layer?**  
*A: When the server sends `Set-Cookie: cybersec.sid=...; HttpOnly; SameSite=lax`, the client's browser network stack stores the cookie in a protected store. `HttpOnly` directs the browser engine to block DOM scripts (`document.cookie`), preventing credential exfiltration during XSS attacks. `SameSite=lax` instructs the browser not to include the cookie on cross-site sub-requests, preventing CSRF forgery.*
