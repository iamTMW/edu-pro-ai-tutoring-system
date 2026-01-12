"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('edupro_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load user from localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem('edupro_user', JSON.stringify(user));
      } catch (error) {
        console.error('Failed to save user to localStorage:', error);
      }
    } else {
      try {
        localStorage.removeItem('edupro_user');
      } catch (error) {
        console.error('Failed to remove user from localStorage:', error);
      }
    }
  }, [user]);

  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password);
      
      if (response.success) {
        const userData = {
          userid: response.userid,
          username: response.username,
          role: response.role,
        };
        setUser(userData);
        return { success: true, user: userData };
      } else {
        return { success: false, error: response.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);

      if (response.success) {
        const user = {
          userid: response.userid,
          username: response.username,
          role: response.role,
        };
        setUser(user);
        return { success: true, user };
      } else {
        return { success: false, error: response.message || 'Signup failed' };
      }
    } catch (error) {
      return { success: false, error: error.message || 'Signup failed' };
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('edupro_user');
      localStorage.removeItem('pp_mmr');
      localStorage.removeItem('pp_streak_ui');
      localStorage.removeItem('pp_diff_hidden');
    } catch (error) {
      console.error('Failed to clear localStorage on logout:', error);
    }
  };

  const forgotPasswordQuestion = async (username) => {
    try {
      const res = await authAPI.forgotPasswordQuestion(username);
      return res;
    } catch (error) {
      return { success: false, message: error.message || 'Failed to fetch question' };
    }
  };

  const resetPassword = async (username, answer, new_password) => {
    try {
      const res = await authAPI.resetPassword(username, answer, new_password);
      return res;
    } catch (error) {
      return { success: false, message: error.message || 'Failed to reset password' };
    }
  };

  const forgotUsername = async (userData) => {
    try {
      const res = await authAPI.forgotUsername(userData);
      return res;
    } catch (error) {
      return { success: false, message: error.message || 'Failed to recover username' };
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    forgotPasswordQuestion,
    resetPassword,
    forgotUsername,
    loading,
    isAuthenticated: !!user,
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
