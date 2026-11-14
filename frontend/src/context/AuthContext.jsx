import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fsmState, setFsmState] = useState('LOGGED_OUT');
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [networkPing, setNetworkPing] = useState(null);

  // Check current session state on initial load
  const checkAuth = useCallback(async () => {
    const startTime = performance.now();
    try {
      const res = await authService.getCurrentUser();
      const latency = Math.round(performance.now() - startTime);
      setNetworkPing(latency);

      if (res.data && res.data.isAuthenticated) {
        setUser(res.data.user);
        setIsAuthenticated(true);
        setFsmState(res.data.fsmState || 'ACTIVE_SESSION');
        setSessionInfo(res.data.session);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setFsmState(res.data?.fsmState || 'LOGGED_OUT');
        setSessionInfo(null);
      }
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      setFsmState('LOGGED_OUT');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async (email, password) => {
    setFsmState('AUTHENTICATING');
    try {
      const res = await authService.login({ email, password });
      if (res.data && res.data.success) {
        setUser(res.data.user);
        setIsAuthenticated(true);
        setFsmState(res.data.fsmState || 'ACTIVE_SESSION');
        await checkAuth();
        return { success: true, data: res.data };
      }
      return { success: false, data: res.data };
    } catch (err) {
      const errorData = err.response?.data || {};
      const newFsmState = errorData.fsmState || 'FAILED_LOGIN';
      setFsmState(newFsmState);
      return {
        success: false,
        error: errorData.message || 'Login failed. Network or server error.',
        fsmState: newFsmState,
        lockUntil: errorData.lockUntil,
        failedAttempts: errorData.failedAttempts,
        remainingAttempts: errorData.remainingAttempts,
      };
    }
  };

  // Register handler
  const register = async (formData) => {
    try {
      const res = await authService.register(formData);
      return { success: true, data: res.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Registration failed.',
        regexGrammar: err.response?.data?.regexGrammar,
      };
    }
  };

  // Logout handler
  const logout = async () => {
    setFsmState('LOGGED_OUT_SUCCESSFULLY');
    try {
      await authService.logout();
    } catch (err) {
      // Continue client cleanup regardless
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setFsmState('LOGGED_OUT');
      setSessionInfo(null);
    }
  };

  const value = {
    user,
    isAuthenticated,
    fsmState,
    setFsmState,
    sessionInfo,
    loading,
    networkPing,
    login,
    register,
    logout,
    refreshUser: checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
