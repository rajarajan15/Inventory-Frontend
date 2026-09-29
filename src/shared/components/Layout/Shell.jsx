import { useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { OrganizationSetupModal } from '../../../features/organization';

/** Organization portal layout (/o/:slug). */
export function Shell({ children }) {
  const { user, orgStatus, organization, slug, api, path, logout, refreshOrgStatus, showOrgModal, setShowOrgModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // The mobile menu is open for the page it was opened on, so navigating closes it
  const [openOn, setOpenOn] = useState(null);
  const open = openOn === location.pathname;
  const [setupDismissed, setSetupDismissed] = useState(false);
  const isAdmin = user?.role === 'ADMIN';

  // Admins see how many sign-ups await approval; refreshed on navigation
  const pending = useAsync(() => (isAdmin ? api.users('PENDING') : []), [api, isAdmin, location.pathname]);
  const pendingCount = pending.data?.length || 0;

  async function leave() {
    await logout();
    navigate(path('/login'));
  }

  const isPendingSetup = isAdmin && orgStatus && !orgStatus.setupCompleted;
  const orgName = orgStatus?.name || organization?.name || 'Stockwise';

  return (
    <div className="app-shell">
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <Link className="brand" to={path()}><span>◆</span> {orgName}</Link>
        <p className="workspace">STOCKWISE · {slug.toUpperCase()}</p>

        {isPendingSetup && (
          <div className="setup-alert-badge">
            <p>Setup incomplete</p>
            <button className="button button-sm full" onClick={() => setShowOrgModal(true)}>
              Finish setup
            </button>
          </div>
        )}

        <nav>
          <NavLink end to={path()}>Overview</NavLink>
          <NavLink to={path('/products')}>Products</NavLink>
          <NavLink to={path('/categories')}>Categories</NavLink>
          {isAdmin && (
            <NavLink to={path('/users')}>
              Team members {pendingCount > 0 && <span className="nav-count" title="Awaiting approval">{pendingCount}</span>}
            </NavLink>
          )}
        </nav>

        <div className="profile">
          <div className="avatar">{user?.name?.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{user?.name}</strong>
            <small>{user?.role}</small>
          </div>
          <button className="icon-button" onClick={leave} title="Sign out">↪</button>
        </div>
      </aside>

      <main>
        <header className="mobile-head">
          <button onClick={() => setOpenOn(open ? null : location.pathname)} className="icon-button">☰</button>
          <Link className="brand" to={path()}>{orgName}</Link>
        </header>
        {children}
        <OrganizationSetupModal
          isOpen={Boolean(showOrgModal || (isPendingSetup && !setupDismissed))}
          onClose={() => { setShowOrgModal(false); setSetupDismissed(true); }}
          onSuccess={() => {
            refreshOrgStatus();
            setShowOrgModal(false);
          }}
        />
      </main>
    </div>
  );
}
