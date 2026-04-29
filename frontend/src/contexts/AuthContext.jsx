import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data));
      setUser(response.data);
    }
    return response.data;
  };

  const updateUser = (nextUser) => {
    setUser((currentUser) => {
      const resolvedUser = typeof nextUser === 'function' ? nextUser(currentUser) : { ...currentUser, ...nextUser };
      localStorage.setItem('user', JSON.stringify(resolvedUser));
      return resolvedUser;
    });
  };

  const register = async (username, email, password, displayName) => {
    return await api.post('/auth/register', { username, displayName, email, password });
  };

  const logout = async () => {
    try {
      await api.put('/users/me/status', { status: 'OFFLINE' });
    } catch (error) {
      console.error('Error marking user offline', error);
    } finally {
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
