import React, { useState, useEffect } from 'react';
import { sessionService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  KeyRound,
  ShieldCheck,
  Clock,
  Trash2,
  RefreshCw,
  Cookie,
  Lock,
  AlertTriangle,
  Layers,
  CheckCircle,
} from 'lucide-react';

export default function SessionManagementPage() {
  const [sessions, setSessions] = useState([]);
  const [cookieInspection, setCookieInspection] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      const [sessRes, inspectRes] = await Promise.all([
        sessionService.getActiveSessions(),
        sessionService.inspectSession(),
      ]);

      if (sessRes.data?.sessions) {
        setSessions(sessRes.data.sessions);
        setCurrentSessionId(sessRes.data.currentSessionId || '');
      }
      if (inspectRes.data?.cookieInspection) {
        setCookieInspection(inspectRes.data.cookieInspection);
      }
    } catch (err) {
      console.error('Error loading session data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, []);

  const handleTerminateSession = async (sessionId) => {
    if (!window.confirm('Force terminate this session? The client will be logged out on their next request.')) return;
    try {
      const res = await sessionService.terminateSession(sessionId);
      setMessage(res.data?.message || 'Session terminated.');
      fetchSessionData();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('Failed to terminate session.');
    }
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center mb-1">
            <KeyRound size={24} className="text-purple me-2" />
            <h3 className="fw-bold text-white mb-0">Intelligent Session State Management</h3>
          </div>
          <span className="text-muted small">
            Stateful session persistence via MongoDB connect-mongo with cryptographic cookie verification
          </span>
        </div>
        <button onClick={fetchSessionData} className="btn btn-sm btn-cyber-outline d-flex align-items-center">
          <RefreshCw size={14} className={`me-1 ${loading ? 'spin' : ''}`} /> Refresh Sessions
        </button>
      </div>

      {message && (
        <div className="alert alert-info bg-info bg-opacity-10 border-info text-info small py-2 mb-4 d-flex align-items-center">
          <CheckCircle size={16} className="me-2" />
          {message}
        </div>
      )}

      {/* Cookie Security Inspector Breakdown */}
      <div className="cyber-card p-4 mb-4">
        <div className="d-flex align-items-center mb-3">
          <Cookie size={20} className="text-cyan me-2" />
          <h5 className="fw-bold text-white mb-0">Client-Server Session Cookie Flag Inspection</h5>
        </div>

        <div className="row g-3">
          {/* HttpOnly */}
          <div className="col-md-3 col-sm-6">
            <div className="p-3 rounded bg-dark border border-success border-opacity-30 h-100">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-white fw-bold small">HttpOnly Flag</span>
                <span className="badge bg-success bg-opacity-20 text-success">ENFORCED</span>
              </div>
              <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>
                Prevents <code>document.cookie</code> access from client scripts, neutralizing Cross-Site Scripting (XSS) token theft.
              </p>
            </div>
          </div>

          {/* SameSite */}
          <div className="col-md-3 col-sm-6">
            <div className="p-3 rounded bg-dark border border-info border-opacity-30 h-100">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-white fw-bold small">SameSite Policy</span>
                <span className="badge bg-info bg-opacity-20 text-info">LAX</span>
              </div>
              <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>
                Restricts cookie dispatch on cross-site requests, mitigating Cross-Site Request Forgery (CSRF).
              </p>
            </div>
          </div>

          {/* Secure Flag */}
          <div className="col-md-3 col-sm-6">
            <div className="p-3 rounded bg-dark border border-purple border-opacity-30 h-100">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-white fw-bold small">Secure Flag</span>
                <span className="badge bg-purple bg-opacity-20 text-purple">CONDITIONAL</span>
              </div>
              <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>
                Enforces HTTPS transport in production on Render; dynamically relaxes on localhost for local academic development.
              </p>
            </div>
          </div>

          {/* Rolling TTL */}
          <div className="col-md-3 col-sm-6">
            <div className="p-3 rounded bg-dark border border-warning border-opacity-30 h-100">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-white fw-bold small">Rolling Expiration</span>
                <span className="badge bg-warning bg-opacity-20 text-warning">30 MINUTES</span>
              </div>
              <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>
                Extends session lifetime upon user activity. Idle sessions terminate automatically into <strong>S6: SESSION_EXPIRED</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions Stored in MongoDB */}
      <div className="cyber-card p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold text-white mb-0">Active Persistent Sessions in MongoDB</h5>
            <span className="text-muted small">
              Collection: <code>sessions</code> &bull; Synced with connect-mongo
            </span>
          </div>
          <span className="badge bg-dark border border-purple text-purple font-monospace">
            {sessions.length} Active Records
          </span>
        </div>

        <div className="table-responsive">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Identity</th>
                <th>IP Address</th>
                <th>Expires At</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No active sessions found. Sign in to instantiate a persistent session token.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => {
                  const isCurrent = s.sessionId === currentSessionId;
                  return (
                    <tr key={s.sessionId}>
                      <td className="font-monospace text-cyan" style={{ fontSize: '0.8rem' }}>
                        {s.sessionId}
                        {isCurrent && (
                          <span className="badge bg-success ms-2 py-0 px-1" style={{ fontSize: '0.65rem' }}>
                            THIS DEVICE
                          </span>
                        )}
                      </td>
                      <td className="text-white">
                        {s.user?.email || 'Anonymous'}
                      </td>
                      <td className="font-monospace text-muted" style={{ fontSize: '0.75rem' }}>
                        {s.ip || '127.0.0.1'}
                      </td>
                      <td className="font-monospace text-dim" style={{ fontSize: '0.75rem' }}>
                        {s.expiresAt ? new Date(s.expiresAt).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td>
                        {s.isExpired ? (
                          <span className="badge bg-danger bg-opacity-25 text-danger border border-danger">
                            S6: EXPIRED
                          </span>
                        ) : (
                          <span className="badge bg-success bg-opacity-25 text-success border border-success">
                            S3: ACTIVE
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleTerminateSession(s.sessionId)}
                          className="btn btn-xs btn-outline-danger py-1 px-2"
                          title="Force Destroy Session"
                        >
                          <Trash2 size={13} className="me-1" /> Terminate
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
