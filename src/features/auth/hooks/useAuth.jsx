import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { orgApi, publicApi, sessions } from '../../../shared/api/api';
import { useAsync } from '../../../shared/hooks/useAsync';

const AuthContext = createContext(null);

/** The stored org session only counts for the organization in the URL. */
function sessionUserFor(slug) {
  const user = sessions.get('org')?.user;
  return user && user.organizationSlug === slug ? user : null;
}

/**
 * Organization portal context for everything under /o/:slug.
 * Provides the organization, the signed-in member, an API client scoped to /api/orgs/{slug},
 * and path() to build links inside this portal.
 */
export function AuthProvider({ children }) {
  const { slug } = useParams();
  // A different organization in the URL gets a fresh provider (and so fresh state)
  return <OrgAuthProvider key={slug.toLowerCase()} slug={slug.toLowerCase()}>{children}</OrgAuthProvider>;
}

function OrgAuthProvider({ slug, children }) {
  const api = useMemo(() => orgApi(slug), [slug]);
  const [user, setUser] = useState(() => sessionUserFor(slug));
  const [showOrgModal, setShowOrgModal] = useState(false);

  // Resolve the organization from the URL (404/suspended → "not found" screen)
  const lookup = useAsync(() => publicApi.organization(slug), [slug]);
  // Organization profile for signed-in members; failures just hide the profile card
  const status = useAsync(() => (user ? api.organization().catch(() => null) : null), [api, user]);

  const path = useCallback((p = '') => `/o/${slug}${p}`, [slug]);

  useEffect(() => {
    const handleUnauthorized = (e) => {
      if (e.detail?.scope === 'org') setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Another tab signed in (possibly as someone else) or out: follow the stored session
  useEffect(() => sessions.watch('org', () => setUser(sessionUserFor(slug))), [slug]);

  const login = async (credentials) => {
    const currentUser = await api.login(credentials);
    setUser(currentUser);
    return currentUser;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const value = {
    slug,
    api,
    path,
    organization: lookup.data || null,
    orgMissing: Boolean(lookup.error),
    user,
    orgStatus: user ? status.data || null : null,
    ready: !lookup.loading,
    showOrgModal,
    setShowOrgModal,
    refreshOrgStatus: status.reload,
    login,
    register: api.register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
