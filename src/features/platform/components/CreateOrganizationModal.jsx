import { useState } from 'react';
import { platformApi } from '../../../shared/api/api';
import { formErrors } from '../../../shared/utils/errorUtils';
import { Alert } from '../../../shared/components/ui/Alert';
import { Field } from '../../../shared/components/ui/Field';
import { Modal } from '../../../shared/components/ui/Modal';
import { CopyButton } from './CopyButton';

export const slugify = (text) => text
  .toLowerCase()
  .normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 63);

/**
 * Creates an organization (its portal URL) and optionally emails an admin invitation.
 * When `request` is given, the subscription request is approved and its details are prefilled.
 */
export function CreateOrganizationModal({ request, onClose, onCreated }) {
  const [values, setValues] = useState(() => ({
    name: request?.organizationName || '',
    slug: request ? slugify(request.organizationName) : '',
    description: request?.message || '',
    contactEmail: request?.contactEmail || '',
    adminName: request?.contactName || '',
    adminEmail: request?.contactEmail || '',
  }));
  const [slugEdited, setSlugEdited] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  function setName(name) {
    setValues((v) => ({ ...v, name, slug: slugEdited ? v.slug : slugify(name) }));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const body = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim() || null]));
    if (request) body.subscriptionRequestId = request.id;
    try {
      setCreated(await platformApi.createOrganization(body));
    } catch (err) {
      setErrors(formErrors(err));
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <Modal eyebrow="ORGANIZATION CREATED" title={created.name} onClose={() => onCreated(created)}>
        <div className="alert success-alert">
          {values.adminEmail
            ? <>An admin invitation was emailed to <strong>{values.adminEmail}</strong>.</>
            : <>No admin was invited yet. Invite one from the organization page.</>}
        </div>
        <div className="field">
          <label>Portal URL</label>
          <div className="copy-row">
            <code className="url">{created.portalUrl}</code>
            <CopyButton text={created.portalUrl} />
          </div>
        </div>
        <div className="form-actions"><button className="button" onClick={() => onCreated(created)}>Done</button></div>
      </Modal>
    );
  }

  return (
    <Modal wide eyebrow={request ? 'APPROVE REQUEST' : 'NEW ORGANIZATION'} title="Create organization" onClose={onClose}
      subtitle="This creates the organization's private portal. The admin you enter gets an email to set their password.">
      <form onSubmit={submit}>
        <Alert text={errors.form} inlineFields={['name', 'slug', 'contactEmail', 'description', 'adminName', 'adminEmail']} />
        <div className="form-grid">
          <Field label="Organization name" value={values.name} error={errors.name} onChange={(e) => setName(e.target.value)} required />
          <Field label="Portal URL slug" value={values.slug} error={errors.slug}
            onChange={(e) => { setSlugEdited(true); setValues({ ...values, slug: e.target.value.toLowerCase() }); }}
            pattern="[a-z0-9][a-z0-9-]{1,61}[a-z0-9]" title="3-63 lowercase letters, digits or hyphens" required />
          <p className="muted wide slug-preview">Portal: <code>{window.location.origin}/o/{values.slug || 'your-slug'}</code></p>
          <Field label="Contact email" type="email" value={values.contactEmail} error={errors.contactEmail} onChange={(e) => setValues({ ...values, contactEmail: e.target.value })} />
          <Field label="Description (optional)" value={values.description} error={errors.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
          <p className="eyebrow wide form-section">ORGANIZATION ADMIN</p>
          <Field label="Admin name" value={values.adminName} error={errors.adminName} onChange={(e) => setValues({ ...values, adminName: e.target.value })} />
          <Field label="Admin email (invitation is sent here)" type="email" value={values.adminEmail} error={errors.adminEmail} onChange={(e) => setValues({ ...values, adminEmail: e.target.value })} />
        </div>
        <div className="form-actions">
          <button type="button" className="button ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="button" disabled={busy}>{busy ? 'Creating…' : request ? 'Approve & create organization' : 'Create organization'}</button>
        </div>
      </form>
    </Modal>
  );
}
