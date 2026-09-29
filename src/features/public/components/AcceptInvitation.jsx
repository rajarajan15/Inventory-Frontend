import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orgApi, publicApi, sessions } from '../../../shared/api/api';
import { formErrors } from '../../../shared/utils/errorUtils';
import { AuthLayout } from '../../../shared/components/Layout/AuthLayout';
import { Alert } from '../../../shared/components/ui/Alert';
import { Field } from '../../../shared/components/ui/Field';
import { PasswordRules, isStrongPassword } from '../../../shared/components/ui/PasswordRules';
import { Loading } from '../../../shared/components/ui/Loading';

/** /invite/:token — the invitee sets their name and password, then signs in on their organization portal. */
export function AcceptInvitation() {
  const { token } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [values, setValues] = useState({ name: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [signedIn, setSignedIn] = useState(() => sessions.get('org')?.user || null);

  useEffect(() => sessions.watch('org', (session) => setSignedIn(session?.user || null)), []);

  useEffect(() => {
    publicApi.invitation(token)
      .then((inv) => {
        setInvitation(inv);
        setValues((v) => ({ ...v, name: inv.name || '' }));
      })
      .catch((e) => setLoadError(e));
  }, [token]);

  async function submit(e) {
    e.preventDefault();
    if (!isStrongPassword(values.password)) return setErrors({ password: 'Your password does not meet all the requirements below.' });
    if (values.password !== values.confirm) return setErrors({ confirm: 'Passwords do not match' });
    setBusy(true);
    setErrors({});
    try {
      await publicApi.acceptInvitation(token, { name: values.name, password: values.password });
      // Whoever is signed in on this browser is not the invitee: sign them out so "Sign in now"
      // shows the login form instead of their dashboard
      const signedIn = sessions.get('org')?.user;
      if (signedIn) await orgApi(signedIn.organizationSlug || invitation.organizationSlug).logout();
      setAccepted(true);
    } catch (err) {
      setErrors(formErrors(err));
    } finally {
      setBusy(false);
    }
  }

  if (!invitation && !loadError) return <Loading text="Checking your invitation…" />;

  if (loadError) {
    return (
      <AuthLayout eyebrow="INVITATION" title="This link can't be used" subtitle="The invitation has expired or was already used.">
        <Alert text={loadError} />
        <p className="muted">Ask your organization administrator (or StockWise) to send you a new invitation.</p>
        <p className="auth-switch"><Link to="/">Back to home</Link></p>
      </AuthLayout>
    );
  }

  const loginPath = `/o/${invitation.organizationSlug}/login`;
  const layoutProps = { heading: invitation.organizationName, tagline: 'Your organization\'s inventory workspace on StockWise.' };

  if (accepted) {
    return (
      <AuthLayout {...layoutProps} eyebrow="ALL SET" title="Your account is ready" subtitle={`Welcome to ${invitation.organizationName}.`}>
        <div className="alert success-alert">
          Bookmark your portal: <strong>{window.location.origin}{loginPath}</strong>
        </div>
        <Link className="button full" to={loginPath}>Sign in now</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout {...layoutProps} eyebrow="YOU'RE INVITED"
      title={`Join ${invitation.organizationName}`}
      subtitle={`You've been invited as ${invitation.role === 'ADMIN' ? 'an administrator' : 'a team member'}. Choose a password to activate your account.`}>
      <form onSubmit={submit}>
        {signedIn && (
          <div className="alert info-alert">
            This browser is signed in as <strong>{signedIn.name}</strong> ({signedIn.email}). Activating this
            invitation will sign them out here so you can sign in as {invitation.email}.
          </div>
        )}
        <Alert text={errors.form} inlineFields={['name', 'password', 'confirm']} />
        <Field label="Email address" type="email" value={invitation.email} disabled readOnly />
        <Field label="Full name" value={values.name} error={errors.name} onChange={(e) => setValues({ ...values, name: e.target.value })} required />
        <Field label="Password" type="password" maxLength={64} autoComplete="new-password" value={values.password} error={errors.password} onChange={(e) => setValues({ ...values, password: e.target.value })} required />
        <PasswordRules password={values.password} />
        <Field label="Confirm password" type="password" autoComplete="new-password" value={values.confirm} error={errors.confirm} onChange={(e) => setValues({ ...values, confirm: e.target.value })} required />
        <button className="button full" disabled={busy}>{busy ? 'Activating…' : 'Activate account'}</button>
      </form>
    </AuthLayout>
  );
}
