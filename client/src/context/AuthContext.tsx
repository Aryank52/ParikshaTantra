import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { fetchApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  demoUsers: User[];
  wsConnected: boolean;
  securityNotice: string | null;
  login: (username: string, password?: string) => Promise<void>;
  switchUser: (username: string) => Promise<void>;
  logout: () => void;
  clearNotice: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('pt_token'));
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  useEffect(() => {
    // Fetch available demo users for quick role switching
    fetchApi('/auth/demo-users')
      .then((data) => setDemoUsers(data))
      .catch(() => {});

    if (token) {
      fetchApi('/auth/me')
        .then((data) => setUser(data.user))
        .catch(() => {
          localStorage.removeItem('pt_token');
          setToken(null);
          setUser(null);
        });
    }
  }, [token]);

  // WebSocket Connection
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setWsConnected(true);
      if (user) {
        socket.send(JSON.stringify({ type: 'IDENTIFY', role: user.role }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'EXAM_RELEASED' || parsed.type === 'EXAM_FROZEN' || parsed.type === 'SECURITY_ALERT') {
          setSecurityNotice(parsed.payload?.message || parsed.payload?.title || 'Security alert received.');
        }
      } catch (e) {}
    };

    socket.onclose = () => setWsConnected(false);

    return () => socket.close();
  }, [user]);

  const login = async (username: string, password = 'Password123!') => {
    const data = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    localStorage.setItem('pt_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const switchUser = async (username: string) => {
    await login(username, 'Password123!');
  };

  const logout = () => {
    localStorage.removeItem('pt_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        demoUsers,
        wsConnected,
        securityNotice,
        login,
        switchUser,
        logout,
        clearNotice: () => setSecurityNotice(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
