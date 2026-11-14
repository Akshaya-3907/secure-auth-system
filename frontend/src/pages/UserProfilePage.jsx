import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UserCircle,
  Key,
  ShieldCheck,
  Clock,
  CheckCircle,
  AlertCircle,
  Lock,
  Layers,
  Activity,
} from 'lucide-react';
import RegexValidator from '../components/RegexValidator';

export default function UserProfilePage() {
  const { user, fsmState, sessionInfo } = useAuth();
  const [profile, setProfile] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await userService.getProfile();
      if (res.data?.user) setProfile(res.data.user);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await userService.changePassword({
        currentPassword,
        newPassword,
      });
      if (res.data?.success) {
        setSuccess('Password updated successfully! Salted bcrypt hash regenerated in MongoDB.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Header */}
      <div className="cyber-card p-4 mb-4">
        <div className="d-flex align-items-center">
          <div className="p-3 rounded-circle bg-dark border border-cyan me-3 shadow">
            <UserCircle size={32} className="text-cyan" />
          </div>
          <div>
            <h3 className="fw-bold text-white mb-0">{user?.username}</h3>
            <span className="text-muted small">
              Identity Profile &bull; <span className="text-cyan font-monospace">{user?.email}</span> &bull; Role:{' '}
              <span className="badge bg-secondary font-monospace">{user?.role?.toUpperCase()}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Account Details */}
        <div className="col-lg-5">
          <div className="cyber-card p-4 mb-4">
            <h5 className="fw-bold text-white mb-3 d-flex align-items-center">
              <ShieldCheck size={18} className="text-cyan me-2" />
              Security Telemetry &amp; State
            </h5>

            <ul className="list-group list-group-flush bg-transparent">
              <li className="list-group-item bg-transparent text-white px-0 py-2 d-flex justify-content-between border-secondary border-opacity-25">
                <span className="text-muted small">Current FSM State</span>
                <span className={`state-badge ${fsmState}`}>{fsmState}</span>
              </li>
              <li className="list-group-item bg-transparent text-white px-0 py-2 d-flex justify-content-between border-secondary border-opacity-25">
                <span className="text-muted small">Account Privilege</span>
                <span className="badge bg-purple font-monospace" style={{ backgroundColor: '#7c3aed' }}>
                  {profile?.role || user?.role}
                </span>
              </li>
              <li className="list-group-item bg-transparent text-white px-0 py-2 d-flex justify-content-between border-secondary border-opacity-25">
                <span className="text-muted small">Failed Login Counter</span>
                <span className="font-monospace text-muted">{profile?.failedLoginAttempts || 0} / 5</span>
              </li>
              <li className="list-group-item bg-transparent text-white px-0 py-2 d-flex justify-content-between border-secondary border-opacity-25">
                <span className="text-muted small">Lockout Status</span>
                <span className={`badge ${profile?.isLocked ? 'bg-danger' : 'bg-success bg-opacity-20 text-success'}`}>
                  {profile?.isLocked ? 'LOCKED' : 'NORMAL'}
                </span>
              </li>
              <li className="list-group-item bg-transparent text-white px-0 py-2 d-flex justify-content-between border-secondary border-opacity-25">
                <span className="text-muted small">Account Created</span>
                <span className="font-monospace text-dim small">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </li>
            </ul>
          </div>

          <RegexValidator />
        </div>

        {/* Right Column: Change Password */}
        <div className="col-lg-7">
          <div className="cyber-card cyber-card-purple p-4">
            <h5 className="fw-bold text-white mb-2 d-flex align-items-center">
              <Key size={18} className="text-purple me-2" />
              Cryptographic Credential Rotation
            </h5>
            <p className="text-muted small mb-3">
              Requires validation against FLAT Regular Language Grammar prior to 12-round bcrypt hashing.
            </p>

            {error && (
              <div className="alert alert-danger bg-danger bg-opacity-10 border-danger text-danger d-flex align-items-center small py-2 mb-3">
                <AlertCircle size={16} className="me-2 flex-shrink-0" />
                <div>{error}</div>
              </div>
            )}

            {success && (
              <div className="alert alert-success bg-success bg-opacity-10 border-success text-success d-flex align-items-center small py-2 mb-3">
                <CheckCircle size={16} className="me-2 flex-shrink-0" />
                <div>{success}</div>
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="mb-3">
                <label className="form-label text-muted small">Current Password</label>
                <input
                  type="password"
                  className="form-control cyber-input"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small">New Password (DFA Grammar Enforced)</label>
                <input
                  type="password"
                  className="form-control cyber-input"
                  placeholder="Min 8 chars, uppercase, lowercase, digit, special symbol"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-muted small">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control cyber-input"
                  placeholder="Repeat new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-cyber-purple w-100 py-2 d-flex justify-content-center align-items-center"
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                ) : (
                  <Key size={16} className="me-2" />
                )}
                Rotate Credential &amp; Hash
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
