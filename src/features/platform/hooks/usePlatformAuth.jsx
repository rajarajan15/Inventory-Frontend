import { createContext, useContext, useEffect, useState } from 'react';
import { platformApi, sessions } from '../../../shared/api/api';

const PlatformAuthContext = createContext(null);

function storedSuperAdmin() {
  const user = sessions.get('platform')?.user;
  return user?.role === 'SUPER_ADMIN' ? user : null;
}

/** Session for the StockWise super admin portal (/platform), independent from organization sessions. */
export function PlatformAuthProvider({ children }) {
  const [user, setUser] = useState(storedSuperAdmin);

  useEffect(() => {
    const handleUnauthorized = (e) => {
      if (e.detail?.scope === 'platform') setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Another tab signed in or out: follow the stored session
  useEffect(() => sessions.watch('platform', () => setUser(storedSuperAdmin())), []);

  const login = async (credentials) => {
    const signedIn = await platformApi.login(credentials);
    setUser(signedIn);
    return signedIn;
  };

  const logout = async () => {
    await platformApi.logout();
    setUser(null);
  };

  return <PlatformAuthContext.Provider value={{ user, login, logout }}>{children}</PlatformAuthContext.Provider>;
}

export const usePlatformAuth = () => useContext(PlatformAuthContext);
