import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AlreadySignedIn } from './AlreadySignedIn';
import { formErrors } from '../../../shared/utils/errorUtils';
import { AuthLayout } from '../../../shared/components/Layout/AuthLayout';
import { Alert } from '../../../shared/components/ui/Alert';
import { Field } from '../../../shared/components/ui/Field';
import { PasswordRules, isStrongPassword } from '../../../shared/components/ui/PasswordRules';

/** Self-registration: the account stays pending until an organization admin approves it. */
export function Register() {
  const { user, register, organization, path } = useAuth();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <AlreadySignedIn switchLabel="Sign out to request a new account" />;

  async function submit(e) {
    e.preventDefault();
    if (!isStrongPassword(values.password)) return setErrors({ password: 'Your password does not meet all the requirements below.' });
    if (values.password !== values.confirm) return setErrors({ confirm: 'Passwords do not match' });
    setBusy(true);
    setErrors({});
    try {
      const res = await register({ name: values.name, email: values.email, password: values.password });
      setDone(res);
    } catch (err) {
      setErrors(formErrors(err));
    } finally {
      setBusy(false);
    }
  }

  const layoutProps = {
    heading: organization?.name,
    tagline: 'Your organization\'s inventory workspace on StockWise.',
  };

  if (done) {
    return (
      <AuthLayout {...layoutProps} eyebrow="REQUEST SENT" title="Waiting for approval" subtitle={done.message}>
        <div className="alert success-alert">
          We&apos;ll email <strong>{done.email}</strong> as soon as an administrator approves your account.
        </div>
        <p className="auth-switch"><Link to={path('/login')}>Back to sign in</Link></p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout {...layoutProps} eyebrow="JOIN YOUR TEAM" title={`Request access to ${organization?.name}`} subtitle="An administrator of your organization will review your request.">
      <form onSubmit={submit}>
        <Alert text={errors.form} inlineFields={['name', 'email', 'password', 'confirm']} />
        <Field label="Full name" value={values.name} error={errors.name} onChange={(e) => setValues({ ...values, name: e.target.value })} required />
        <Field label="Email address" type="email" value={values.email} error={errors.email} onChange={(e) => setValues({ ...values, email: e.target.value })} required />
        <Field label="Password" type="password" maxLength={64} autoComplete="new-password" value={values.password} error={errors.password} onChange={(e) => setValues({ ...values, password: e.target.value })} required />
        <PasswordRules password={values.password} />
        <Field label="Confirm password" type="password" autoComplete="new-password" value={values.confirm} error={errors.confirm} onChange={(e) => setValues({ ...values, confirm: e.target.value })} required />
        <button className="button full" disabled={busy}>{busy ? 'Sending request…' : 'Request access'}</button>
      </form>
      <p className="auth-switch">Already have an account? <Link to={path('/login')}>Sign in</Link></p>
    </AuthLayout>
  );
}
