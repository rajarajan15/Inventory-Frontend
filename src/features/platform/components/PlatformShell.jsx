import { useState } from 'react';
import { useAsync } from '../../../shared/hooks/useAsync';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { usePlatformAuth } from '../hooks/usePlatformAuth';
import { platformApi } from '../../../shared/api/api';

/** Super admin portal layout (/platform). */
export function PlatformShell({ children }) {
  const { user, logout } = usePlatformAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // The mobile menu is open for the page it was opened on, so navigating closes it
  const [openOn, setOpenOn] = useState(null);
  const open = openOn === location.pathname;
  const pending = useAsync(() => platformApi.requests('PENDING'), [location.pathname, location.search]);
  const pendingCount = pending.data?.length || 0;

  async function leave() {
    await logout();
    navigate('/platform/login');
  }

  return (
    <div className="app-shell platform">
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <Link className="brand" to="/platform"><span>◆</span> Stockwise</Link>
        <p className="workspace">PLATFORM ADMIN</p>
        <nav>
          <NavLink to="/platform/requests">
            Subscription requests {pendingCount > 0 && <span className="nav-count">{pendingCount}</span>}
          </NavLink>
          <NavLink to="/platform/organizations">Organizations</NavLink>
        </nav>
        <div className="profile">
          <div className="avatar">{user?.name?.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{user?.name}</strong>
            <small>SUPER ADMIN</small>
          </div>
          <button className="icon-button" onClick={leave} title="Sign out">↪</button>
        </div>
      </aside>
      <main>
        <header className="mobile-head">
          <button onClick={() => setOpenOn(open ? null : location.pathname)} className="icon-button">☰</button>
          <Link className="brand" to="/platform">Stockwise admin</Link>
        </header>
        {children}
      </main>
    </div>
  );
}
