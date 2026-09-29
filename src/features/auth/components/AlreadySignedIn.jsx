import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from '../../../shared/components/Layout/AuthLayout';

/**
 * Shown on the login/register pages when this browser already has a session, instead of silently
 * redirecting: on a shared browser the person at the keyboard may not be the one who is signed in.
 */
export function AlreadySignedIn({ switchLabel }) {
  const { user, organization, path, logout } = useAuth();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await logout();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="ALREADY SIGNED IN"
      title={`You're signed in as ${user.name}`}
      subtitle={`${user.email} is signed in to ${organization?.name || 'this organization'} in this browser.`}
      heading={organization?.name}
      tagline="Your organization's inventory workspace on StockWise."
    >
      <Link className="button full" to={path()}>Continue as {user.name}</Link>
      <button type="button" className="button secondary full" onClick={signOut} disabled={busy}>
        {busy ? 'Signing out…' : switchLabel}
      </button>
    </AuthLayout>
  );
}
