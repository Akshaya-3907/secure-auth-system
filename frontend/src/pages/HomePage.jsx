import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Cpu,
  Radio,
  Layers,
  Lock,
  GitCommit,
  CheckCircle2,
  ArrowRight,
  Database,
  KeyRound,
  Terminal,
} from 'lucide-react';
import FsmGraph from '../components/FsmGraph';

export default function HomePage() {
  const { isAuthenticated, fsmState, user } = useAuth();

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Hero Header */}
      <div className="cyber-card p-4 p-md-5 mb-4 position-relative overflow-hidden">
        <div className="row align-items-center">
          <div className="col-lg-7">
            <div className="d-inline-flex align-items-center px-3 py-1 rounded-pill bg-dark border border-cyan mb-3">
              <Shield size={14} className="text-cyan me-2" />
              <span className="text-cyan font-monospace small fw-bold">ACADEMIC CAPSTONE DEMONSTRATION</span>
            </div>
            <h1 className="display-6 fw-bold text-white mb-3">
              SECURE WEB AUTHENTICATION &amp; <br />
              <span className="text-cyan glow-cyan">INTELLIGENT SESSION STATE</span> <br />
              <span className="text-purple glow-purple">MANAGEMENT SYSTEM</span>
            </h1>
            <p className="text-muted lead fs-6 mb-4">
              A unified full-stack architecture harmonizing <strong>Full Stack Web Development</strong>,{' '}
              <strong>Computer Networks</strong>, and <strong>Formal Languages &amp; Automata Theory (FLAT)</strong>{' '}
              into one rigorous, mathematically validated security platform.
            </p>
            <div className="d-flex flex-wrap gap-3">
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="btn btn-cyber-primary px-4 py-2 d-flex align-items-center">
                    Launch Login Gate <ArrowRight size={16} className="ms-2" />
                  </Link>
                  <Link to="/register" className="btn btn-cyber-purple px-4 py-2">
                    Create Account (Regex DFA)
                  </Link>
                </>
              ) : (
                <Link to="/dashboard" className="btn btn-cyber-primary px-4 py-2 d-flex align-items-center">
                  Open User Dashboard <ArrowRight size={16} className="ms-2" />
                </Link>
              )}
              <Link to="/fsm" className="btn btn-cyber-outline px-4 py-2 d-flex align-items-center">
                <GitCommit size={16} className="me-2 text-cyan" /> Explore FSM Automata
              </Link>
            </div>
          </div>

          <div className="col-lg-5 mt-4 mt-lg-0 text-center">
            <div className="p-3 rounded-3 bg-dark border border-secondary border-opacity-25 shadow">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted font-monospace small">Live Automata Monitor</span>
                <span className={`state-badge ${fsmState}`}>{fsmState}</span>
              </div>
              <FsmGraph activeState={fsmState} />
            </div>
          </div>
        </div>
      </div>

      {/* The Three Academic Disciplines Grid */}
      <div className="row g-4 mb-4">
        {/* Module 1: Full Stack Web Development */}
        <div className="col-md-4">
          <div className="cyber-card h-100 p-4 border-cyan">
            <div className="d-flex align-items-center mb-3">
              <div className="p-2 rounded bg-cyan bg-opacity-10 text-cyan me-3">
                <Layers size={24} />
              </div>
              <div>
                <span className="badge bg-dark text-cyan font-monospace" style={{ fontSize: '0.65rem' }}>MODULE 1</span>
                <h5 className="mb-0 text-white fw-bold">Full Stack Web Dev</h5>
              </div>
            </div>
            <p className="text-muted small mb-3">
              Modern client-server web engineering with asynchronous data flow, state stores, and robust database layers.
            </p>
            <ul className="list-unstyled small text-muted mb-4">
              <li className="mb-1"><CheckCircle2 size={13} className="text-cyan me-2 inline" /> React 18, Vite &amp; Bootstrap 5 SPA</li>
              <li className="mb-1"><CheckCircle2 size={13} className="text-cyan me-2 inline" /> Node.js &amp; Express RESTful API</li>
              <li className="mb-1"><CheckCircle2 size={13} className="text-cyan me-2 inline" /> MongoDB Atlas &amp; Mongoose Schemas</li>
              <li className="mb-1"><CheckCircle2 size={13} className="text-cyan me-2 inline" /> Bcrypt 12-Round Password Hashing</li>
            </ul>
            <Link to="/dashboard" className="btn btn-sm btn-cyber-outline w-100">
              Explore User &amp; Admin Dashboards
            </Link>
          </div>
        </div>

        {/* Module 2: FLAT */}
        <div className="col-md-4">
          <div className="cyber-card cyber-card-purple h-100 p-4">
            <div className="d-flex align-items-center mb-3">
              <div className="p-2 rounded bg-purple bg-opacity-10 text-purple me-3">
                <Cpu size={24} />
              </div>
              <div>
                <span className="badge bg-dark text-purple font-monospace" style={{ fontSize: '0.65rem' }}>MODULE 2</span>
                <h5 className="mb-0 text-white fw-bold">Automata Theory (FLAT)</h5>
              </div>
            </div>
            <p className="text-muted small mb-3">
              Formal language specification via Deterministic Finite Automata (DFA) governing authentication state legality.
            </p>
            <ul className="list-unstyled small text-muted mb-4">
              <li className="mb-1"><CheckCircle2 size={13} className="text-purple me-2 inline" /> Formal 5-Tuple: M = (Q, Σ, δ, q₀, F)</li>
              <li className="mb-1"><CheckCircle2 size={13} className="text-purple me-2 inline" /> 8 Discrete Authentication States (S0 - S7)</li>
              <li className="mb-1"><CheckCircle2 size={13} className="text-purple me-2 inline" /> Rejection of Illegal Transitions</li>
              <li className="mb-1"><CheckCircle2 size={13} className="text-purple me-2 inline" /> Chomsky Type-3 Regex Lexical Analysis</li>
            </ul>
            <Link to="/fsm" className="btn btn-sm btn-cyber-purple w-100">
              Interactive FSM Simulator &amp; Graph
            </Link>
          </div>
        </div>

        {/* Module 3: Computer Networks */}
        <div className="col-md-4">
          <div className="cyber-card h-100 p-4 border-info">
            <div className="d-flex align-items-center mb-3">
              <div className="p-2 rounded bg-info bg-opacity-10 text-info me-3">
                <Radio size={24} />
              </div>
              <div>
                <span className="badge bg-dark text-info font-monospace" style={{ fontSize: '0.65rem' }}>MODULE 3</span>
                <h5 className="mb-0 text-white fw-bold">Computer Networks</h5>
              </div>
            </div>
            <p className="text-muted small mb-3">
              Network layer instrumentation, HTTP request-response tracking, socket-level latency, and cookie transport security.
            </p>
            <ul className="list-unstyled small text-muted mb-4">
              <li className="mb-1"><CheckCircle2 size={13} className="text-info me-2 inline" /> HTTP Status Codes (200, 401, 423 Locked)</li>
              <li className="mb-1"><CheckCircle2 size={13} className="text-info me-2 inline" /> HttpOnly, SameSite, Secure Cookie Flags</li>
              <li className="mb-1"><CheckCircle2 size={13} className="text-info me-2 inline" /> In-Flight Network Packet Inspection</li>
              <li className="mb-1"><CheckCircle2 size={13} className="text-info me-2 inline" /> Rolling 30-Minute Session Expiration</li>
            </ul>
            <Link to="/network" className="btn btn-sm btn-cyber-outline w-100">
              Inspect Network Traffic Stream
            </Link>
          </div>
        </div>
      </div>

      {/* Security Defense Posture Breakdown */}
      <div className="cyber-card p-4">
        <h5 className="text-white fw-bold mb-3 d-flex align-items-center">
          <Lock size={18} className="text-cyan me-2" />
          Active Cybersecurity Defense Architecture
        </h5>
        <div className="row g-3">
          <div className="col-md-3">
            <div className="p-3 rounded bg-dark border border-secondary border-opacity-25 h-100">
              <div className="text-danger fw-bold font-monospace small mb-1">5-STRIKE BRUTE FORCE LOCKOUT</div>
              <p className="text-muted small mb-0">
                5 consecutive failed logins trigger transition to state <strong>S5: ACCOUNT_LOCKED</strong> and HTTP 423 Locked response.
              </p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 rounded bg-dark border border-secondary border-opacity-25 h-100">
              <div className="text-cyan fw-bold font-monospace small mb-1">ZERO SENSITIVE DATA IN AUDIT</div>
              <p className="text-muted small mb-0">
                Strict sanitization filter recursively removes passwords, tokens, and hashes prior to writing event logs.
              </p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 rounded bg-dark border border-secondary border-opacity-25 h-100">
              <div className="text-purple fw-bold font-monospace small mb-1">MONGODB SESSION STORAGE</div>
              <p className="text-muted small mb-0">
                Sessions are persisted in MongoStore collection with native automatic TTL index removal and server-side invalidation.
              </p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 rounded bg-dark border border-secondary border-opacity-25 h-100">
              <div className="text-success fw-bold font-monospace small mb-1">ROLE-BASED AUTHORIZATION</div>
              <p className="text-muted small mb-0">
                Hierarchical RBAC distinguishes normal users from administrative security operators with fine-grained endpoint guards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
