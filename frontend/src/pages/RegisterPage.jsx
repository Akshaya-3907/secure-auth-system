import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Shield, CheckCircle, XCircle, AlertCircle, Lock, Mail, User } from 'lucide-react';
import RegexValidator from '../components/RegexValidator';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Real-time DFA validations
  const usernameValid = /^[a-zA-Z0-9_]{3,20}$/.test(formData.username);
  const emailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email);
  const passwordLengthValid = formData.password.length >= 8;
  const passwordUpperValid = /[A-Z]/.test(formData.password);
  const passwordLowerValid = /[a-z]/.test(formData.password);
  const passwordDigitValid = /\d/.test(formData.password);
  const passwordSpecialValid = /[@$!%*?&]/.test(formData.password);
  const passwordAllValid =
    passwordLengthValid &&
    passwordUpperValid &&
    passwordLowerValid &&
    passwordDigitValid &&
    passwordSpecialValid;
  const passwordMatch =
    formData.password && formData.password === formData.confirmPassword;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!usernameValid) {
      setError('Username must be 3-20 alphanumeric characters or underscores.');
      return;
    }
    if (!emailValid) {
      setError('Please provide a valid email format.');
      return;
    }
    if (!passwordAllValid) {
      setError('Password does not fulfill the 5-point DFA regular expression requirements.');
      return;
    }
    if (!passwordMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });
    setLoading(false);

    if (result.success) {
      setSuccess('Account created successfully! Redirecting to login gate in 2 seconds...');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-6 col-md-8">
          <div className="cyber-card p-4 p-md-5 mb-4">
            <div className="text-center mb-4">
              <div className="d-inline-flex p-3 rounded-circle bg-dark border border-purple mb-3 shadow">
                <UserPlus size={28} className="text-purple" />
              </div>
              <h3 className="fw-bold text-white mb-1">User Registration Gate</h3>
              <p className="text-muted small">
                Regulated by Formal Languages &amp; Automata Theory (FLAT) Lexical DFA
              </p>
            </div>

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

            <form onSubmit={handleSubmit}>
              {/* Username Input */}
              <div className="mb-3">
                <label className="form-label text-muted small d-flex justify-content-between">
                  <span>Username</span>
                  <span className="font-monospace text-cyan" style={{ fontSize: '0.7rem' }}>
                    Type-3 Regex: ^[a-zA-Z0-9_]&#123;3,20&#125;$
                  </span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    name="username"
                    className="form-control cyber-input"
                    placeholder="Enter alphanumeric handle"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                  <span className="input-group-text bg-dark border-secondary border-opacity-25">
                    {formData.username && (
                      usernameValid ? (
                        <CheckCircle size={16} className="text-success" />
                      ) : (
                        <XCircle size={16} className="text-danger" />
                      )
                    )}
                  </span>
                </div>
              </div>

              {/* Email Input */}
              <div className="mb-3">
                <label className="form-label text-muted small d-flex justify-content-between">
                  <span>Email Address</span>
                  <span className="font-monospace text-cyan" style={{ fontSize: '0.7rem' }}>
                    RFC Grammar DFA
                  </span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    className="form-control cyber-input"
                    placeholder="student@university.edu"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <span className="input-group-text bg-dark border-secondary border-opacity-25">
                    {formData.email && (
                      emailValid ? (
                        <CheckCircle size={16} className="text-success" />
                      ) : (
                        <XCircle size={16} className="text-danger" />
                      )
                    )}
                  </span>
                </div>
              </div>

              {/* Password Input */}
              <div className="mb-3">
                <label className="form-label text-muted small d-flex justify-content-between">
                  <span>Password (Bcrypt Salted)</span>
                  <span className="font-monospace text-purple" style={{ fontSize: '0.7rem' }}>
                    Intersection of 5 Regular Grammars
                  </span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    name="password"
                    className="form-control cyber-input"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Password Live Checklist */}
                <div className="p-2 mt-2 rounded bg-dark border border-secondary border-opacity-25 small font-monospace">
                  <div className="row g-1 text-dim" style={{ fontSize: '0.72rem' }}>
                    <div className={`col-6 ${passwordLengthValid ? 'text-success' : ''}`}>
                      {passwordLengthValid ? '✓' : '○'} Min 8 Chars
                    </div>
                    <div className={`col-6 ${passwordUpperValid ? 'text-success' : ''}`}>
                      {passwordUpperValid ? '✓' : '○'} 1 Uppercase (A-Z)
                    </div>
                    <div className={`col-6 ${passwordLowerValid ? 'text-success' : ''}`}>
                      {passwordLowerValid ? '✓' : '○'} 1 Lowercase (a-z)
                    </div>
                    <div className={`col-6 ${passwordDigitValid ? 'text-success' : ''}`}>
                      {passwordDigitValid ? '✓' : '○'} 1 Digit (0-9)
                    </div>
                    <div className={`col-12 ${passwordSpecialValid ? 'text-success' : ''}`}>
                      {passwordSpecialValid ? '✓' : '○'} 1 Special Symbol (@$!%*?&amp;)
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="mb-3">
                <label className="form-label text-muted small">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control cyber-input"
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {formData.confirmPassword && (
                  <div className="mt-1 small font-monospace" style={{ fontSize: '0.72rem' }}>
                    {passwordMatch ? (
                      <span className="text-success">✓ Passwords match</span>
                    ) : (
                      <span className="text-danger">✗ Passwords do not match</span>
                    )}
                  </div>
                )}
              </div>

              {/* Role Selection */}
              <div className="mb-4">
                <label className="form-label text-muted small">Account Privilege Tier</label>
                <div className="d-flex gap-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="role"
                      id="roleUser"
                      value="user"
                      checked={formData.role === 'user'}
                      onChange={handleChange}
                    />
                    <label className="form-check-label text-white small" htmlFor="roleUser">
                      Standard User (Student/Staff)
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="role"
                      id="roleAdmin"
                      value="admin"
                      checked={formData.role === 'admin'}
                      onChange={handleChange}
                    />
                    <label className="form-check-label text-warning small fw-bold" htmlFor="roleAdmin">
                      Security Administrator
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-cyber-purple w-100 py-2 d-flex justify-content-center align-items-center"
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                ) : (
                  <UserPlus size={18} className="me-2" />
                )}
                Register User Identity (S0)
              </button>
            </form>

            <div className="text-center mt-4">
              <span className="text-muted small">Already have registered credentials? </span>
              <Link to="/login" className="text-cyan text-decoration-none small fw-bold">
                Sign In to FSM Gate
              </Link>
            </div>
          </div>

          {/* Interactive Regex Educational Inspector */}
          <RegexValidator />
        </div>
      </div>
    </div>
  );
}
