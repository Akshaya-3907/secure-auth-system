import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import {
  ShieldAlert,
  Users,
  CheckCircle,
  XCircle,
  KeyRound,
  Lock,
  Unlock,
  Radio,
  Clock,
  RefreshCw,
  Trash2,
  Shield,
  Activity,
  AlertTriangle,
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getAllUsers(),
      ]);
      if (statsRes.data?.stats) setStats(statsRes.data.stats);
      if (usersRes.data?.users) setUsers(usersRes.data.users);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUnlockUser = async (userId) => {
    try {
      const res = await adminService.unlockUser(userId);
      setActionMessage(res.data.message);
      await fetchAdminData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionMessage('Failed to unlock user.');
    }
  };

  const handleLockUser = async (userId) => {
    try {
      const res = await adminService.lockUser(userId);
      setActionMessage(res.data.message);
      await fetchAdminData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionMessage('Failed to lock user.');
    }
  };

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await adminService.changeUserRole(userId, newRole);
      setActionMessage(res.data.message);
      await fetchAdminData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionMessage('Failed to change role.');
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to delete user ${email}?`)) return;
    try {
      const res = await adminService.deleteUser(userId);
      setActionMessage(res.data.message);
      await fetchAdminData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionMessage('Failed to delete user.');
    }
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center mb-1">
            <ShieldAlert size={24} className="text-danger me-2" />
            <h3 className="fw-bold text-white mb-0">Security Operations &amp; Administration</h3>
          </div>
          <span className="text-muted small">
            System-wide telemetry, user lockout management &amp; session surveillance
          </span>
        </div>
        <button onClick={fetchAdminData} className="btn btn-sm btn-cyber-outline d-flex align-items-center">
          <RefreshCw size={14} className={`me-1 ${loading ? 'spin' : ''}`} /> Refresh Telemetry
        </button>
      </div>

      {actionMessage && (
        <div className="alert alert-info bg-info bg-opacity-10 border-info text-info small py-2 mb-4 d-flex align-items-center">
          <Activity size={16} className="me-2" />
          {actionMessage}
        </div>
      )}

      {/* 6 Metric KPI Cards */}
      <div className="row g-3 mb-4">
        {/* Total Users */}
        <div className="col-md-2 col-sm-4 col-6">
          <div className="cyber-card p-3 text-center h-100">
            <Users size={20} className="text-cyan mb-2" />
            <div className="fs-3 fw-bold text-white font-monospace">{stats?.totalUsers || 0}</div>
            <div className="text-muted small font-monospace" style={{ fontSize: '0.7rem' }}>TOTAL USERS</div>
          </div>
        </div>

        {/* Successful Logins */}
        <div className="col-md-2 col-sm-4 col-6">
          <div className="cyber-card p-3 text-center h-100">
            <CheckCircle size={20} className="text-success mb-2" />
            <div className="fs-3 fw-bold text-success font-monospace">{stats?.successfulLogins || 0}</div>
            <div className="text-muted small font-monospace" style={{ fontSize: '0.7rem' }}>SUCCESSFUL LOGINS</div>
          </div>
        </div>

        {/* Failed Login Attempts */}
        <div className="col-md-2 col-sm-4 col-6">
          <div className="cyber-card p-3 text-center h-100">
            <XCircle size={20} className="text-warning mb-2" />
            <div className="fs-3 fw-bold text-warning font-monospace">{stats?.failedLoginAttempts || 0}</div>
            <div className="text-muted small font-monospace" style={{ fontSize: '0.7rem' }}>FAILED LOGINS</div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="col-md-2 col-sm-4 col-6">
          <div className="cyber-card cyber-card-purple p-3 text-center h-100">
            <KeyRound size={20} className="text-purple mb-2" />
            <div className="fs-3 fw-bold text-purple font-monospace">{stats?.activeSessions || 0}</div>
            <div className="text-muted small font-monospace" style={{ fontSize: '0.7rem' }}>ACTIVE SESSIONS</div>
          </div>
        </div>

        {/* Locked Accounts */}
        <div className="col-md-2 col-sm-4 col-6">
          <div className="cyber-card p-3 text-center h-100">
            <Lock size={20} className="text-danger mb-2" />
            <div className="fs-3 fw-bold text-danger font-monospace">{stats?.lockedAccounts || 0}</div>
            <div className="text-muted small font-monospace" style={{ fontSize: '0.7rem' }}>LOCKED (S5)</div>
          </div>
        </div>

        {/* Network Requests */}
        <div className="col-md-2 col-sm-4 col-6">
          <div className="cyber-card p-3 text-center h-100">
            <Radio size={20} className="text-info mb-2" />
            <div className="fs-3 fw-bold text-info font-monospace">{stats?.totalNetworkRequests || 0}</div>
            <div className="text-muted small font-monospace" style={{ fontSize: '0.7rem' }}>HTTP PACKETS</div>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="cyber-card p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-white mb-0">Registered User Entities &amp; Security State</h5>
          <span className="badge bg-dark border border-secondary text-dim font-monospace">
            {users.length} registered records
          </span>
        </div>

        <div className="table-responsive">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>FSM State</th>
                <th>Failed Logins</th>
                <th>Account Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isLocked = u.isCurrentlyLocked;
                return (
                  <tr key={u._id}>
                    <td className="fw-bold text-white">{u.username}</td>
                    <td className="font-monospace text-cyan" style={{ fontSize: '0.8rem' }}>
                      {u.email}
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'bg-danger' : 'bg-secondary'} font-monospace`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`state-badge ${u.currentFsmState || 'LOGGED_OUT'}`}>
                        {u.currentFsmState || 'LOGGED_OUT'}
                      </span>
                    </td>
                    <td className="font-monospace">
                      <span className={u.failedLoginAttempts > 0 ? 'text-warning fw-bold' : 'text-muted'}>
                        {u.failedLoginAttempts || 0} / 5
                      </span>
                    </td>
                    <td>
                      {isLocked ? (
                        <span className="badge bg-danger bg-opacity-25 text-danger border border-danger">
                          LOCKED (S5)
                        </span>
                      ) : (
                        <span className="badge bg-success bg-opacity-25 text-success border border-success">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        {isLocked ? (
                          <button
                            onClick={() => handleUnlockUser(u._id)}
                            className="btn btn-xs btn-outline-success py-1 px-2"
                            title="Unlock Account (Reset to S0)"
                          >
                            <Unlock size={13} className="me-1" /> Unlock
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLockUser(u._id)}
                            className="btn btn-xs btn-outline-warning py-1 px-2"
                            title="Force Account Lock (Transition to S5)"
                          >
                            <Lock size={13} className="me-1" /> Lock
                          </button>
                        )}
                        <button
                          onClick={() => handleRoleToggle(u._id, u.role)}
                          className="btn btn-xs btn-outline-info py-1 px-2"
                          title="Toggle Admin/User Role"
                        >
                          Role
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id, u.email)}
                          className="btn btn-xs btn-outline-danger py-1 px-2"
                          title="Delete User"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Security Logs Section */}
      <div className="cyber-card p-4">
        <h5 className="fw-bold text-white mb-3">Recent Security Event Stream</h5>
        <div className="table-responsive">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event Type</th>
                <th>Severity</th>
                <th>Target User</th>
                <th>IP Address</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentSecurityLogs?.map((log) => (
                <tr key={log._id}>
                  <td className="font-monospace text-dim" style={{ fontSize: '0.75rem' }}>
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </td>
                  <td className="font-monospace text-cyan" style={{ fontSize: '0.8rem' }}>
                    {log.eventType}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        log.severity === 'CRITICAL'
                          ? 'bg-danger'
                          : log.severity === 'DANGER'
                          ? 'bg-danger bg-opacity-50 text-white'
                          : log.severity === 'WARNING'
                          ? 'bg-warning text-dark'
                          : 'bg-info bg-opacity-25 text-info'
                      } font-monospace`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="font-monospace text-muted">{log.userEmail}</td>
                  <td className="font-monospace text-dim" style={{ fontSize: '0.75rem' }}>{log.ipAddress}</td>
                  <td>
                    <span
                      className={`badge ${
                        log.outcome === 'SUCCESS' ? 'text-success' : 'text-danger'
                      } bg-transparent border border-${log.outcome === 'SUCCESS' ? 'success' : 'danger'}`}
                    >
                      {log.outcome}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
