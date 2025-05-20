import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user data on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  // Set up axios interceptors for token handling
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        // If error is 401 (unauthorized) and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Try to get a new token using the refresh token
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const res = await axios.post('/api/auth/refresh-token', { refreshToken });
            
            if (res.data.token) {
              localStorage.setItem('token', res.data.token);
              localStorage.setItem('refreshToken', res.data.refreshToken);
              
              // Update auth header for the original request
              originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            // If refresh fails, log out the user
            logout();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Clean up interceptors
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Fetch current user data
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/auth/me');
      setCurrentUser(res.data.user);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch user data');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  // Register a new user
  const register = async (userData) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/register', userData);
      setError(null);
      toast.success('Registration successful! Please login.');
      return res.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/login', { email, password });
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      
      await fetchUserData();
      toast.success('Login successful!');
      return res.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setCurrentUser(null);
    toast.info('You have been logged out');
  };

  // Request password reset
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/forgot-password', { email });
      setError(null);
      toast.success('Password reset instructions sent to your email');
      return res.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to process request';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset password with token
  const resetPassword = async (token, password) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/reset-password', { token, password });
      setError(null);
      toast.success('Password reset successful! Please login with your new password.');
      return res.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Password reset failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    if (!currentUser || !currentUser.roles) {
      return false;
    }
    return currentUser.roles.includes(role);
  };

  // Assign a role to a user (admin only)
  const assignRole = async (userId, role) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/assign-role', { userId, role });
      setError(null);
      toast.success(`Role '${role}' assigned successfully`);
      return res.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to assign role';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get all users (admin only)
  const getAllUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/users');
      setError(null);
      return res.data.users;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch users';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        error,
        register,
        login,
        logout,
        forgotPassword,
        resetPassword,
        hasRole,
        assignRole,
        getAllUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 