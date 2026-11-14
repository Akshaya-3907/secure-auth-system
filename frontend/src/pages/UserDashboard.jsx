import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import {
  LayoutDashboard,
  ShieldCheck,
  Clock,
  LogOut,
  RefreshCw,
  GitCommit,
  Radio,
  KeyRound,
  FileText,
  User,
  Activity,
  Layers,
} from 'lucide-react';
import FsmGraph from '../components/FsmGraph';

export default function UserDashboard() {
  const { user, fsmState, sessionInfo, logout, refreshUser } = useAuth();
  const [fsmHistory, setFsmHistory] = useState([]);
  const [ttlRemaining, setTtlRemaining] = useState(sessionInfo?.ttlSeconds || 1800);
  const [loading, setLoading] = useState(false);

  // Fetch user personal FSM state history
  const fetchUserData = async () => {
    setLoading(true);
    try {
      const res = await userService.getMyFsmHistory();
      if (res.data && res.data.history) {
        setFsmHistory(res.data.history);
      }
    } catch (err) {
      console.error('Error fetching user history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Decrement TTL countdown timer every second
  useEffect(() => {
    if (ttlRemaining <= 0) return;
    const timer = setInterval(() => {
      setTtlRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [ttlRemaining]);

  // Format seconds into MM:SS
  const formatTtl = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleRenewSession = async () => {
    await refreshUser();
    setTtlRemaining(1800); // 30 minutes
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Top Welcome Banner */}
      <div className="cyber-card p-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center">
          <div>
            <div className="d-flex align-items-center mb-1">
              <h3 className="fw-bold text-white mb-0 me-3">Welcome, {user?.username}</h3>
              <span className={`badge ${user?.role === 'admin' ? 'bg-danger' : 'bg-primary'} py-1 px-2`}>
                {user?.role?.toUpperCase()}
              </span>
            </div>
            <p className="text-muted small mb-0">
              Authenticated Session Identity: <span className="text-cyan font-monospace">{user?.email}</span>
            </p>
          </div>

          <div className="d-flex gap-2 mt-3 mt-md-0">
            <button onClick={handleRenewSession} className="btn btn-sm btn-cyber-outline d-flex align-items-center">
              <RefreshCw size={14} className="me-1" /> Touch / Renew Session
            </button>
            <button onClick={logout} className="btn btn-sm btn-outline-danger d-flex align-items-center">
              <LogOut size={14} className="me-1" /> Terminate Session (S7)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="row g-3 mb-4">
        {/* Card 1: FSM State */}
        <div className="col-md-4">
          <div className="cyber-card p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small font-monospace">AUTOMATA STATE</span>
              <GitCommit size={18} className="text-cyan" />
            </div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className={`state-badge ${fsmState}`} style={{ fontSize: '1rem', padding: '6px 14px' }}>
                {fsmState}
              </span>
            </div>
            <p className="text-dim small mb-0 font-monospace" style={{ fontSize: '0.75rem' }}>
              Accepting operational state (q ∈ F). Session verified against MongoStore.
            </p>
          </div>
        </div>

        {/* Card 2: Session TTL Countdown */}
        <div className="col-md-4">
          <div className="cyber-card cyber-card-purple p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small font-monospace">SESSION TTL TIMEOUT</span>
              <Clock size={18} className="text-purple" />
            </div>
            <div className="fs-3 fw-bold text-white font-monospace mb-1">
              {formatTtl(ttlRemaining)}
            </div>
            <div className="progress bg-dark mb-2" style={{ height: '5px' }}>
              <div
                className="progress-bar bg-purple"
                role="progressbar"
                style={{ width: `${(ttlRemaining / 1800) * 100}%`, backgroundColor: '#a855f7' }}
              />
            </div>
            <span className="text-dim small font-monospace" style={{ fontSize: '0.72rem' }}>
              Automatic S6: SESSION_EXPIRED on timeout. Rolling on activity.
            </span>
          </div>
        </div>

        {/* Card 3: Cookie Security Flags */}
        <div className="col-md-4">
          <div className="cyber-card p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small font-monospace">COOKIE TRANSPORT FLAGS</span>
              <ShieldCheck size={18} className="text-success" />
            </div>
            <div className="d-flex flex-wrap gap-1 mb-2 font-monospace" style={{ fontSize: '0.75rem' }}>
              <span className="badge bg-success bg-opacity-20 text-success border border-success">HttpOnly: TRUE</span>
              <span className="badge bg-info bg-opacity-20 text-info border border-info">SameSite: LAX</span>
              <span className="badge bg-purple bg-opacity-20 text-purple border border-purple">Signed: HMAC-SHA256</span>
            </div>
            <span className="text-dim small font-monospace" style={{ fontSize: '0.72rem' }}>
              Cookie token inaccessible to JavaScript (XSS Immune).
            </span>
          </div>
        </div>
      </div>

      {/* Automata Visualizer & Recent Transition History */}
      <div className="row g-4 mb-4">
        {/* Left: Interactive FSM Visualizer */}
        <div className="col-lg-7">
          <div className="cyber-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-white mb-0">Active Automata Topology</h5>
                <span className="text-muted small">Real-time DFA position highlighted in cyan glow</span>
              </div>
              <Link to="/fsm" className="btn btn-sm btn-cyber-outline">
                Full Theory &amp; Simulator &rarr;
              </Link>
            </div>
            <FsmGraph activeState={fsmState} />
          </div>
        </div>

        {/* Right: Personal Transition History */}
        <div className="col-lg-5">
          <div className="cyber-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-white mb-0">Transition Audit Log</h5>
              <button onClick={fetchUserData} className="btn btn-sm btn-cyber-outline py-0 px-2">
                <RefreshCw size={13} className={loading ? 'spin' : ''} />
              </button>
            </div>

            <div className="table-responsive" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Transition</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fsmHistory.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-3">
                        No recent transitions recorded.
                      </td>
                    </tr>
                  ) : (
                    fsmHistory.slice(0, 10).map((item, idx) => (
                      <tr key={idx}>
                        <td className="font-monospace text-cyan" style={{ fontSize: '0.75rem' }}>
                          {item.event}
                        </td>
                        <td className="font-monospace text-white" style={{ fontSize: '0.75rem' }}>
                          {item.fromState} &rarr; {item.toState || 'REJECTED'}
                        </td>
                        <td>
                          {item.valid ? (
                            <span className="badge bg-success bg-opacity-20 text-success" style={{ fontSize: '0.65rem' }}>
                              VALID
                            </span>
                          ) : (
                            <span className="badge bg-danger bg-opacity-20 text-danger" style={{ fontSize: '0.65rem' }}>
                              REJECTED
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
