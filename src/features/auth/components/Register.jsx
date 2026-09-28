import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { errorText } from '../../../shared/utils/errorUtils';
import { AuthLayout } from '../../../shared/components/Layout/AuthLayout';
import { Alert } from '../../../shared/components/ui/Alert';
import { Field } from '../../../shared/components/ui/Field';

export function Register() {
  const { user, register } = useAuth();
  const [values, setValues] = useState({ name: '', email: '', password: '', role: 'STAFF' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (user) return <Navigate to="/" />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(values);
      navigate('/');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Create your workspace" subtitle="Start keeping your inventory in sync." eyebrow="WELCOME BACK">
      <form onSubmit={submit}>
        <Alert text={error} />
        <Field label="Full name" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} required />
        <Field label="Email address" type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} required />
        <Field label="Password" type="password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} required />
        <button className="button full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  );
}
