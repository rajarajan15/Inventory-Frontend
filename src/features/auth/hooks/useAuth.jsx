import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../../../shared/api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.initializeCsrf().catch(() => {}).finally(() => setReady(true));
  }, []);

  const value = {
    user,
    ready,
    login: async (values) => {
      const u = await api.login(values);
      setUser(u);
      return u;
    },
    register: async (values) => {
      const u = await api.register(values);
      setUser(u);
      return u;
    },
    logout: async () => {
      try {
        await api.logout();
      } finally {
        setUser(null);
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
