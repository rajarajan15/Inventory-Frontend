import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { usePlatformAuth } from '../hooks/usePlatformAuth';
import { AuthLayout } from '../../../shared/components/Layout/AuthLayout';
import { Alert } from '../../../shared/components/ui/Alert';
import { Field } from '../../../shared/components/ui/Field';

export function PlatformLogin() {
  const { user, login } = usePlatformAuth();
  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (user) return <Navigate to="/platform" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(values);
      navigate('/platform');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout eyebrow="STOCKWISE OWNER" title="Platform administration" subtitle="Restricted area. Sign in with the StockWise super admin account."
      heading="Run StockWise." tagline="Review requests, onboard organizations and invite their administrators.">
      <form onSubmit={submit}>
        <Alert text={error} />
        <Field label="Email address" type="email" autoComplete="username" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} required />
        <Field label="Password" type="password" autoComplete="current-password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} required />
        <button className="button full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </AuthLayout>
  );
}
