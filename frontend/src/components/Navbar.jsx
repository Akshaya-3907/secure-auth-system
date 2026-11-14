import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Activity, LogOut, User as UserIcon, Lock, Terminal } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, fsmState, logout, networkPing } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg px-3 py-2 border-bottom border-secondary border-opacity-25" style={{ background: '#080d1a' }}>
      <div className="container-fluid">
        {/* Brand */}
        <Link to="/" className="navbar-brand d-flex align-items-center text-decoration-none">
          <div className="me-2 p-1 rounded-2 bg-dark border border-cyan" style={{ boxShadow: '0 0 10px rgba(0, 245, 255, 0.3)' }}>
            <ShieldCheck size={22} className="text-cyan" />
          </div>
          <div>
            <span className="fw-bold tracking-wide text-white fs-6">SECURE<span className="text-cyan">AUTH</span></span>
            <span className="badge ms-2 bg-purple text-white px-2 py-0" style={{ fontSize: '0.68rem', backgroundColor: '#7c3aed' }}>FSM &bull; NET</span>
          </div>
        </Link>

        {/* Live Network & FSM Status Badges */}
        <div className="d-flex align-items-center ms-auto me-3 gap-2">
          {/* Network Latency Indicator */}
          <div className="d-none d-md-flex align-items-center px-2 py-1 rounded bg-dark border border-secondary border-opacity-25 text-muted" style={{ fontSize: '0.78rem' }}>
            <Activity size={14} className="text-cyan me-1" />
            <span className="text-muted me-1">Ping:</span>
            <span className="fw-semibold text-white font-monospace">{networkPing !== null ? `${networkPing}ms` : '--'}</span>
          </div>

          {/* Current FSM State Badge */}
          <div className="d-flex align-items-center px-2 py-1 rounded bg-dark border border-secondary border-opacity-25" style={{ fontSize: '0.78rem' }}>
            <span className="text-dim me-2 d-none d-sm-inline">FSM State:</span>
            <span className={`state-badge ${fsmState}`}>{fsmState}</span>
          </div>
        </div>

        {/* Auth CTA / User Profile */}
        <div className="d-flex align-items-center gap-2">
          {isAuthenticated ? (
            <div className="dropdown">
              <button
                className="btn btn-sm btn-cyber-outline dropdown-toggle d-flex align-items-center py-1 px-3"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <UserIcon size={15} className="me-1 text-cyan" />
                <span className="text-white fw-medium">{user?.username}</span>
                {user?.role === 'admin' && (
                  <span className="badge bg-danger ms-2 py-0 px-1" style={{ fontSize: '0.65rem' }}>ADMIN</span>
                )}
              </button>
              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-dark border-secondary shadow-lg">
                <li>
                  <Link to="/profile" className="dropdown-item d-flex align-items-center py-2">
                    <UserIcon size={14} className="me-2 text-cyan" /> User Profile
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="dropdown-item d-flex align-items-center py-2">
                    <Terminal size={14} className="me-2 text-purple" /> User Dashboard
                  </Link>
                </li>
                {user?.role === 'admin' && (
                  <li>
                    <Link to="/admin" className="dropdown-item d-flex align-items-center py-2 text-warning">
                      <Lock size={14} className="me-2" /> Admin Dashboard
                    </Link>
                  </li>
                )}
                <li><hr className="dropdown-divider border-secondary" /></li>
                <li>
                  <button onClick={handleLogout} className="dropdown-item d-flex align-items-center text-danger py-2">
                    <LogOut size={14} className="me-2" /> Secure Logout (S7)
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <Link to="/login" className="btn btn-sm btn-cyber-outline py-1 px-3">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-sm btn-cyber-primary py-1 px-3">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
