import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User } from '../types';
import { fetchApi, getAuthToken, setAuthToken, clearAuthSession } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  demoUsers: User[];
  wsConnected: boolean;
  securityNotice: string | null;
  lastWsMessage: any | null;
  sendWsMessage: (msg: any) => boolean;
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
  const [lastWsMessage, setLastWsMessage] = useState<any | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

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
      .catch((err) => {
        if (err?.status === 401 || err?.isAuthError) {
          logout();
        }
      });
  }, [token]);

  // Transmit message over WebSocket
  const sendWsMessage = useCallback((msg: any): boolean => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const payload = typeof msg === 'string' ? msg : JSON.stringify(msg);
      socketRef.current.send(payload);
      return true;
    }
    return false;
  }, []);

  // Authenticated WebSocket Lifecycle with Reconnect
  useEffect(() => {
    if (!user || !token) {
      setWsConnected(false);
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (e) {}
        socketRef.current = null;
      }
      return;
    }

    let isDisposed = false;
    let reconnectTimer: any = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 8;

    const connect = () => {
      if (isDisposed) return;
      try {
        const wsUrl =
          import.meta.env.VITE_WS_URL ||
          (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
            ? 'wss://parikshatantra.onrender.com/ws'
            : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);

        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          if (isDisposed) return;
          reconnectAttempts = 0;
          setWsConnected(true);
          // Transmit cryptographically verified JWT identity
          socket.send(
            JSON.stringify({
              type: 'IDENTIFY',
              token,
              role: user.role,
              userId: user.id,
              username: user.username,
            })
          );
          // Auto-join authorized rooms according to authority hierarchy
          if (['SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'EXAM_CONTROLLER', 'SECURITY_OFFICER', 'AUDITOR'].includes(user.role)) {
            socket.send(JSON.stringify({ type: 'JOIN', room: 'national', token }));
          }
        };

        socket.onmessage = (event) => {
          if (isDisposed) return;
          try {
            const parsed = JSON.parse(event.data);
            setLastWsMessage(parsed);
            window.dispatchEvent(new CustomEvent('pt:ws_message', { detail: parsed }));
            if (parsed.type === 'EXAM_RELEASED' || parsed.type === 'EXAM_FROZEN' || parsed.type === 'SECURITY_ALERT' || parsed.type === 'OPERATIONAL_ALERT') {
              setSecurityNotice(parsed.payload?.message || parsed.payload?.title || parsed.alert?.title || 'Security notice received.');
            }
          } catch (e) {}
        };

        socket.onerror = () => {
          if (!isDisposed) setWsConnected(false);
        };

        socket.onclose = () => {
          if (isDisposed) return;
          setWsConnected(false);
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 20000);
            reconnectAttempts++;
            reconnectTimer = setTimeout(connect, delay);
          }
        };
      } catch (err) {
        if (!isDisposed) {
          setWsConnected(false);
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 20000);
            reconnectAttempts++;
            reconnectTimer = setTimeout(connect, delay);
          }
        }
      }
    };

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (e) {}
        socketRef.current = null;
      }
      setWsConnected(false);
    };
  }, [user, token]);

  const login = async (username: string, password = 'Password123!') => {
    const data = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      skipDedupe: true,
    });
    if (data.token) {
      setAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
    }
  };

  const switchUser = async (username: string) => {
    const data = await fetchApi('/auth/switch-user', {
      method: 'POST',
      body: JSON.stringify({ username }),
      skipDedupe: true,
    });
    if (data.token) {
      setAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
    }
  };

  const logout = useCallback(() => {
    clearAuthSession('USER_LOGOUT');
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
        lastWsMessage,
        sendWsMessage,
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
