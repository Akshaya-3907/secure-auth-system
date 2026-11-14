import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, ShieldAlert, Lock, Mail, AlertTriangle, CheckCircle, ArrowRight, ShieldCheck, Key } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [isLocked, setIsLocked] = useState(false);
  const [lockUntil, setLockUntil] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transitionStatus, setTransitionStatus] = useState(null);

  const { login, fsmState } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTransitionStatus('Executing: δ(S0, SUBMIT_CREDENTIALS) → S1: AUTHENTICATING...');

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      setTransitionStatus('Success: δ(S1, CREDENTIALS_VALID) → S2 → δ(S2, SESSION_CREATED) → S3: ACTIVE_SESSION');
      setTimeout(() => navigate('/dashboard'), 800);
    } else {
      if (result.fsmState === 'ACCOUNT_LOCKED') {
        setIsLocked(true);
        setLockUntil(result.lockUntil);
        setError('CRITICAL: Account is locked due to 5 consecutive failed login attempts (HTTP 423 Locked).');
        setTransitionStatus('Defense Triggered: δ(S4, LOCKOUT_TRIGGERED) → S5: ACCOUNT_LOCKED');
      } else {
        setFailedAttempts(result.failedAttempts || 0);
        setRemainingAttempts(result.remainingAttempts !== undefined ? result.remainingAttempts : 5);
        setError(result.error || 'Authentication rejected by security monitor.');
        setTransitionStatus('Transition: δ(S1, CREDENTIALS_INVALID) → S4: FAILED_LOGIN');
      }
    }
  };

  // Helper for demo: Quick Fill Default Credentials
  const fillCredentials = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError('');
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-5 col-md-7">
          <div className="cyber-card p-4 p-md-5 mb-4">
            <div className="text-center mb-4">
              <div className="d-inline-flex p-3 rounded-circle bg-dark border border-cyan mb-3 shadow" style={{ boxShadow: '0 0 15px rgba(0, 245, 255, 0.25)' }}>
                <LogIn size={28} className="text-cyan" />
              </div>
              <h3 className="fw-bold text-white mb-1">Authentication Gate</h3>
              <p className="text-muted small">
                Monitored by FLAT State Transition Engine &amp; Brute Force Filter
              </p>
              <div className="d-inline-block">
                <span className={`state-badge ${fsmState}`}>{fsmState}</span>
              </div>
            </div>

            {/* FSM Transition Step Feedback */}
            {transitionStatus && (
              <div className="p-2 mb-3 rounded bg-dark border border-cyan border-opacity-30 font-monospace text-cyan small" style={{ fontSize: '0.72rem' }}>
                &gt; {transitionStatus}
              </div>
            )}

            {/* Error / Lockout Alert */}
            {error && (
              <div className={`alert ${isLocked ? 'alert-danger border-danger' : 'alert-warning border-warning'} bg-opacity-10 d-flex align-items-start small py-2 mb-3`}>
                <AlertTriangle size={18} className="me-2 mt-1 flex-shrink-0" />
                <div>
                  <div className="fw-bold">{isLocked ? 'S5: ACCOUNT_LOCKED' : 'S4: FAILED_LOGIN'}</div>
                  <div>{error}</div>
                  {!isLocked && remainingAttempts !== undefined && (
                    <div className="mt-1 font-monospace text-white">
                      Remaining attempts allowed: <strong className="text-danger">{remainingAttempts}</strong> / 5
                    </div>
                  )}
                  {isLocked && (
                    <div className="mt-1 font-monospace text-danger small">
                      Lock release time: {lockUntil ? new Date(lockUntil).toLocaleTimeString() : 'In 15 minutes'}
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="mb-3">
                <label className="form-label text-muted small">Registered Email</label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    className="form-control cyber-input"
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-4">
                <div className="d-flex justify-content-between">
                  <label className="form-label text-muted small">Password</label>
                  <span className="text-dim font-monospace small">Bcrypt Verification</span>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    className="form-control cyber-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-cyber-primary w-100 py-2 d-flex justify-content-center align-items-center mb-3"
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                ) : (
                  <LogIn size={18} className="me-2" />
                )}
                Verify Credentials (S0 → S1)
              </button>
            </form>

            {/* Quick Demo Credentials Panel for College Presentation */}
            <div className="p-3 rounded bg-dark border border-secondary border-opacity-25 mt-3">
              <div className="d-flex align-items-center mb-2">
                <Key size={14} className="text-warning me-2" />
                <span className="text-white fw-bold small">Demo Credentials (Quick-Fill):</span>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-xs btn-outline-warning py-1 px-2 font-monospace"
                  style={{ fontSize: '0.72rem' }}
                  onClick={() => fillCredentials('admin@secureauth.edu', 'Admin@Secure2026!')}
                >
                  Administrator Account
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-danger py-1 px-2 font-monospace"
                  style={{ fontSize: '0.72rem' }}
                  onClick={() => fillCredentials('testuser@college.edu', 'WrongPassword123!')}
                  title="Simulate failed attempt"
                >
                  Simulate Failed Login (S4)
                </button>
              </div>
            </div>

            <div className="text-center mt-3">
              <span className="text-muted small">Need an account? </span>
              <Link to="/register" className="text-purple text-decoration-none small fw-bold">
                Register New User (S0)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
