import { useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../../../shared/api/api';
import { formErrors } from '../../../shared/utils/errorUtils';
import { AuthLayout } from '../../../shared/components/Layout/AuthLayout';
import { Alert } from '../../../shared/components/ui/Alert';
import { Field } from '../../../shared/components/ui/Field';

/** Public subscription request: emails StockWise, which then sets up the organization. */
export function RequestAccess() {
  const [values, setValues] = useState({
    organizationName: '', contactName: '', contactEmail: '', contactPhone: '', hasExistingData: false, message: '',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (key) => (e) => setValues({ ...values, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await publicApi.requestAccess(values);
      setSent(true);
    } catch (err) {
      setErrors(formErrors(err));
    } finally {
      setBusy(false);
    }
  }

  const layoutProps = {
    heading: 'Bring your inventory to StockWise.',
    tagline: 'Tell us about your organization. We will set up a private workspace for your team and email you the details.',
  };

  if (sent) {
    return (
      <AuthLayout {...layoutProps} eyebrow="REQUEST RECEIVED" title="Thank you!"
        subtitle={`We have received the request for ${values.organizationName}.`}>
        <div className="alert success-alert">
          The StockWise team will review it and contact you at <strong>{values.contactEmail}</strong>.
          Once approved, you will receive an email invitation to set up your organization&apos;s admin account.
        </div>
        <p className="auth-switch"><Link to="/">Back to home</Link></p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout {...layoutProps} eyebrow="GET STARTED" title="Request StockWise" subtitle="Takes less than a minute.">
      <form onSubmit={submit}>
        <Alert text={errors.form} inlineFields={['organizationName', 'contactName', 'contactEmail', 'contactPhone', 'message']} />
        <Field label="Organization name" value={values.organizationName} error={errors.organizationName} onChange={set('organizationName')} required />
        <Field label="Your name" value={values.contactName} error={errors.contactName} onChange={set('contactName')} required />
        <Field label="Work email" type="email" value={values.contactEmail} error={errors.contactEmail} onChange={set('contactEmail')} required />
        <Field label="Phone (optional)" type="tel" value={values.contactPhone} error={errors.contactPhone} onChange={set('contactPhone')} />
        <label className="checkbox-label">
          <input type="checkbox" checked={values.hasExistingData} onChange={set('hasExistingData')} />
          <span>We already have inventory data to bring over (CSV)</span>
        </label>
        <Field label="Anything we should know? (optional)" as="textarea" rows="3" value={values.message} error={errors.message} onChange={set('message')} />
        <button className="button full" disabled={busy}>{busy ? 'Sending…' : 'Send request'}</button>
      </form>
      <p className="auth-switch">Already have a portal? <Link to="/">Find your organization</Link></p>
    </AuthLayout>
  );
}
