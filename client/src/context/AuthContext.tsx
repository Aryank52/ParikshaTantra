import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { fetchApi, getAuthToken, setAuthToken, clearAuthSession } from '../services/api';

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
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [user, setUser] = useState<User | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  // Global listener for 401 unauthorized session invalidation
  useEffect(() => {
    const handleAuthError = () => {
      setToken(null);
      setUser(null);
      setWsConnected(false);
    };

    window.addEventListener('pt:auth_error', handleAuthError);
    return () => window.removeEventListener('pt:auth_error', handleAuthError);
  }, []);

  // Fetch demo users for UI evaluation mode (public endpoint)
  useEffect(() => {
    fetchApi('/auth/demo-users')
      .then((data) => {
        if (Array.isArray(data)) setDemoUsers(data);
      })
      .catch(() => {});
  }, []);

  // Synchronize user profile when token changes
  useEffect(() => {
    const currentToken = getAuthToken();
    if (!currentToken) {
      setUser(null);
      return;
    }

    fetchApi('/auth/me')
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          logout();
        }
      })
      .catch(() => {
        logout();
      });
  }, [token]);

  // Authenticated WebSocket Lifecycle
  useEffect(() => {
    if (!user || !token) {
      setWsConnected(false);
      return;
    }

    let socket: WebSocket | null = null;
    let isDisposed = false;

    try {
      const wsUrl =
        import.meta.env.VITE_WS_URL ||
        (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
          ? 'wss://parikshatantra.onrender.com/ws'
          : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);

      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (isDisposed) return;
        setWsConnected(true);
        // Transmit cryptographically verified JWT identity
        socket?.send(
          JSON.stringify({
            type: 'IDENTIFY',
            token,
            role: user.role,
            userId: user.id,
            username: user.username,
          })
        );
      };

      socket.onmessage = (event) => {
        if (isDisposed) return;
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'EXAM_RELEASED' || parsed.type === 'EXAM_FROZEN' || parsed.type === 'SECURITY_ALERT') {
            setSecurityNotice(parsed.payload?.message || parsed.payload?.title || 'Security alert received.');
          }
        } catch (e) {}
      };

      socket.onerror = () => {
        if (!isDisposed) setWsConnected(false);
      };

      socket.onclose = () => {
        if (!isDisposed) setWsConnected(false);
      };
    } catch (err) {
      setWsConnected(false);
    }

    return () => {
      isDisposed = true;
      if (socket) {
        try {
          socket.close();
        } catch (e) {}
      }
      setWsConnected(false);
    };
  }, [user, token]);

  const login = async (username: string, password = 'Password123!') => {
    const data = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (data?.token && data?.user) {
      setAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
    }
  };

  const switchUser = async (username: string) => {
    await login(username, 'Password123!');
  };

  const logout = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setWsConnected(false);
  }, []);

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

