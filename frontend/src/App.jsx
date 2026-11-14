import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FsmVisualizationPage from './pages/FsmVisualizationPage';
import NetworkMonitoringPage from './pages/NetworkMonitoringPage';
import SessionManagementPage from './pages/SessionManagementPage';
import SecurityEventLogsPage from './pages/SecurityEventLogsPage';
import UserProfilePage from './pages/UserProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100" style={{ background: '#070c18' }}>
          {/* Top Bar */}
          <Navbar />

          {/* Body with Sidebar & Content */}
          <div className="d-flex flex-grow-1">
            <Sidebar />

            <main className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
              <Routes>
                {/* 1. Home */}
                <Route path="/" element={<HomePage />} />

                {/* 2. Registration */}
                <Route path="/register" element={<RegisterPage />} />

                {/* 3. Login */}
                <Route path="/login" element={<LoginPage />} />

                {/* 4. User Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <UserDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 5. Admin Dashboard */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 6. FSM Visualization & Automata Laboratory */}
                <Route path="/fsm" element={<FsmVisualizationPage />} />

                {/* 7. Network Monitoring & Traffic Telemetry */}
                <Route path="/network" element={<NetworkMonitoringPage />} />

                {/* 8. Session Management & Cookie Inspector */}
                <Route
                  path="/sessions"
                  element={
                    <ProtectedRoute>
                      <SessionManagementPage />
                    </ProtectedRoute>
                  }
                />

                {/* 9. Security Event Logs & Audit Trail */}
                <Route
                  path="/logs"
                  element={
                    <ProtectedRoute>
                      <SecurityEventLogsPage />
                    </ProtectedRoute>
                  }
                />

                {/* 10. User Profile & Credential Rotation */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <UserProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
