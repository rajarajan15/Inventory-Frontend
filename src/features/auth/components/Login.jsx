import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AlreadySignedIn } from './AlreadySignedIn';
import { AuthLayout } from '../../../shared/components/Layout/AuthLayout';
import { Alert } from '../../../shared/components/ui/Alert';
import { Field } from '../../../shared/components/ui/Field';

export function Login() {
  const { user, login, organization, path } = useAuth();
  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (user) return <AlreadySignedIn switchLabel="Sign in as a different user" />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(values);
      navigate(path());
    } catch (err) {
      // 401: wrong credentials; 403: pending approval / rejected / disabled (message comes from the server)
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title={`Sign in to ${organization?.name}`}
      subtitle="Enter your details to manage your inventory."
      eyebrow="WELCOME BACK"
      heading={organization?.name}
      tagline="Your organization's inventory workspace on StockWise."
    >
      <form onSubmit={submit}>
        <Alert text={error} />
        <Field label="Email address" type="email" autoComplete="username" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} required />
        <Field label="Password" type="password" autoComplete="current-password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} required />
        <button className="button full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="auth-switch">New to {organization?.name}? <Link to={path('/register')}>Request an account</Link></p>
    </AuthLayout>
  );
}
