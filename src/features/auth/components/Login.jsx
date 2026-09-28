import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { errorText } from '../../../shared/utils/errorUtils';
import { AuthLayout } from '../../../shared/components/Layout/AuthLayout';
import { Alert } from '../../../shared/components/ui/Alert';
import { Field } from '../../../shared/components/ui/Field';

export function Login() {
  const { user, login } = useAuth();
  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (user) return <Navigate to="/" />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(values);
      navigate('/');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Sign in to your workspace" subtitle="Enter your details to manage your inventory." eyebrow="WELCOME BACK">
      <form onSubmit={submit}>
        <Alert text={error} />
        <Field label="Email address" type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} required />
        <Field label="Password" type="password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} required />
        <button className="button full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="auth-switch">New to Stockwise? <Link to="/register">Create an account</Link></p>
    </AuthLayout>
  );
}
