import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  UserPlus,
  LogIn,
  LayoutDashboard,
  ShieldAlert,
  GitCommit,
  Radio,
  KeyRound,
  FileText,
  UserCircle,
  Cpu,
  Layers,
} from 'lucide-react';

export default function Sidebar() {
  const { user, isAuthenticated } = useAuth();

  const navItems = [
    { to: '/', label: '1. Home Page', icon: Home, category: 'General' },
    { to: '/register', label: '2. Registration', icon: UserPlus, category: 'Authentication', publicOnly: true },
    { to: '/login', label: '3. Login (FSM Gate)', icon: LogIn, category: 'Authentication', publicOnly: true },
    { to: '/dashboard', label: '4. User Dashboard', icon: LayoutDashboard, category: 'Operational', authRequired: true },
    { to: '/admin', label: '5. Admin Dashboard', icon: ShieldAlert, category: 'Management', adminOnly: true },
    { to: '/fsm', label: '6. FSM Automata Graph', icon: GitCommit, category: 'FLAT Theory' },
    { to: '/network', label: '7. Network Traffic', icon: Radio, category: 'Computer Networks' },
    { to: '/sessions', label: '8. Session Management', icon: KeyRound, category: 'Full Stack & Net' },
    { to: '/logs', label: '9. Security Event Logs', icon: FileText, category: 'Cyber Audit', authRequired: true },
    { to: '/profile', label: '10. User Profile', icon: UserCircle, category: 'Operational', authRequired: true },
  ];

  return (
    <aside className="cyber-sidebar d-flex flex-column py-3">
      {/* Subject Trio Header */}
      <div className="px-3 pb-3 mb-2 border-bottom border-secondary border-opacity-25">
        <div className="d-flex align-items-center mb-1">
          <Cpu size={16} className="text-cyan me-2" />
          <span className="fw-semibold text-white fs-7 text-uppercase tracking-wider" style={{ fontSize: '0.72rem' }}>
            Integrated Academic Trio
          </span>
        </div>
        <div className="text-muted font-monospace" style={{ fontSize: '0.68rem', lineHeight: '1.3' }}>
          • Full Stack Web Dev<br />
          • Computer Networks<br />
          • Automata Theory (FLAT)
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-grow-1 overflow-auto">
        <ul className="list-unstyled mb-0">
          {navItems.map((item) => {
            // Role and Auth Visibility Filters
            if (item.authRequired && !isAuthenticated) return null;
            if (item.adminOnly && (!isAuthenticated || user?.role !== 'admin')) return null;
            if (item.publicOnly && isAuthenticated) return null;

            const Icon = item.icon;

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `cyber-sidebar-link ${isActive ? 'active' : ''}`
                  }
                  end={item.to === '/'}
                >
                  <Icon size={17} className="me-2 text-cyan" />
                  <span className="flex-grow-1">{item.label}</span>
                  {item.adminOnly && (
                    <span className="badge bg-danger py-0 px-1 text-uppercase" style={{ fontSize: '0.6rem' }}>
                      Admin
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer Info Badge */}
      <div className="p-3 mt-auto border-top border-secondary border-opacity-25">
        <div className="p-2 rounded bg-dark border border-secondary border-opacity-25 text-center">
          <span className="d-block text-cyan fw-bold font-monospace" style={{ fontSize: '0.75rem' }}>
            DFA: M = (Q, Σ, δ, q₀, F)
          </span>
          <span className="text-dim font-monospace" style={{ fontSize: '0.65rem' }}>
            8 States | Strict Rejection
          </span>
        </div>
      </div>
    </aside>
  );
}
