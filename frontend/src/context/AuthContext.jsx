
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  fetchCollection, listenToCollection, getDatabase, getDocumentPath, saveDocument 
} from '../api-client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [userStatus, setUserStatus] = useState('online');
  const [loading, setLoading] = useState(true);

  const appId = 'hubify';
  const db = getDatabase();

  useEffect(() => {
    const savedUser = localStorage.getItem('hubify_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setCurrentUserProfile(null);
      return;
    }

    // Ao logar, já definimos um perfil básico baseado no que recebemos do login
    setCurrentUserProfile({
      name: user.displayName || user.username,
      avatarUrl: user.avatarUrl,
      status: user.status || 'online'
    });

    const unsub = listenToCollection(`artifacts/${appId}/public/data/users`, (snap) => {
      const found = snap.docs.find(d => d.id === user.id);
      if (found) {
        setCurrentUserProfile(found.data());
        setUserStatus(found.data().status || 'online');
      }
    });

    // Marcar como offline ao fechar a aba/navegador
    const handleUnload = () => {
      if (user?.id) {
        const API_URL = import.meta.env.VITE_API_URL || 'https://hubify-backend-358184322842.us-central1.run.app';
        const url = `${API_URL}/auth/users/${user.id}`;
        const data = JSON.stringify({ status: 'offline', isOnline: false });
        
        // fetch com keepalive é ideal para garantir o envio no encerramento da aba
        fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true
        });
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      unsub();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [user?.id]);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('hubify_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setCurrentUserProfile(null);
    localStorage.removeItem('hubify_user');
  };

  const value = {
    user,
    currentUserProfile,
    userStatus,
    setUserStatus: (status) => {
      setUserStatus(status);
      if (user) {
        saveDocument(`artifacts/${appId}/public/data/users/${user.id}`, { status }, { merge: true });
      }
    },
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
