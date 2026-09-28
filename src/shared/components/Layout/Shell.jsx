import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../features/auth/hooks/useAuth';

export function Shell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function leave() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <Link className="brand" to="/"><span>◆</span> Stockwise</Link>
        <p className="workspace">INVENTORY WORKSPACE</p>
        <nav>
          <NavLink end to="/">Overview</NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/categories">Categories</NavLink>
          {user.role === 'ADMIN' && <NavLink to="/users">Team members</NavLink>}
        </nav>
        <div className="profile">
          <div className="avatar">{user.name?.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </div>
          <button className="icon-button" onClick={leave} title="Sign out">↪</button>
        </div>
      </aside>
      <main>
        <header className="mobile-head">
          <button onClick={() => setOpen(!open)} className="icon-button">☰</button>
          <Link className="brand" to="/">Stockwise</Link>
        </header>
        {children}
      </main>
    </div>
  );
}
