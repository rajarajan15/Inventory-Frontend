import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { platformApi } from '../../../shared/api/api';
import { useAsync } from '../../../shared/hooks/useAsync';
import { niceDate } from '../../../shared/utils/formatters';
import { Page } from '../../../shared/components/Layout/Page';
import { Alert } from '../../../shared/components/ui/Alert';
import { Empty } from '../../../shared/components/ui/Empty';
import { Loading } from '../../../shared/components/ui/Loading';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { CopyButton } from './CopyButton';

/** One organization as the super admin sees it: profile, portal, status and admins (no inventory data). */
export function OrganizationDetail() {
  const { id } = useParams();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [invite, setInvite] = useState({ name: '', email: '' });
  const [busy, setBusy] = useState(false);

  const detail = useAsync(async () => {
    const [organization, admins] = await Promise.all([platformApi.organization(id), platformApi.admins(id)]);
    return { organization, admins };
  }, [id]);
  const org = detail.data?.organization;
  const admins = detail.data?.admins || [];
  const setOrg = (organization) => detail.setData((d) => ({ ...d, organization }));

  async function toggleStatus() {
    const next = org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (next === 'SUSPENDED' && !confirm(`Suspend ${org.name}? Its members will be unable to sign in or use the portal.`)) return;
    setError('');
    try {
      setOrg(await platformApi.setOrganizationStatus(id, next));
      setNotice(next === 'SUSPENDED' ? `${org.name} is suspended.` : `${org.name} is active again.`);
    } catch (e) {
      setError(e);
    }
  }

  async function sendInvite(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await platformApi.inviteAdmin(id, { name: invite.name.trim() || null, email: invite.email.trim() });
      setNotice(`Admin invitation sent to ${invite.email}.`);
      setInvite({ name: '', email: '' });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  if (!org && !detail.error) return <Loading />;
  if (!org) return <Page title="Organization unavailable" back="/platform/organizations"><Alert text={detail.error} /></Page>;

  return (
    <Page back="/platform/organizations" title={org.name} subtitle={org.description || `Created ${niceDate(org.createdAt)}`}
      action={
        <button className={org.status === 'ACTIVE' ? 'button danger-button' : 'button'} onClick={toggleStatus}>
          {org.status === 'ACTIVE' ? 'Suspend organization' : 'Reactivate organization'}
        </button>
      }>
      <Alert text={error} />
      {notice && <div className="alert success-alert">{notice}</div>}

      <div className="detail-grid">
        <section className="card">
          <p className="eyebrow">PORTAL</p>
          <div className="copy-row">
            <code className="url">{org.portalUrl}</code>
            <CopyButton text={org.portalUrl} />
          </div>
          <p className="muted">Send this link to the organization. Only its approved members can sign in.</p>
          <div className="divider" />
          <dl>
            <div><dt>Status</dt><dd><StatusBadge status={org.status} /></dd></div>
            <div><dt>Setup</dt><dd>{org.setupCompleted ? 'Completed' : 'Waiting for admin'}</dd></div>
            <div><dt>Slug</dt><dd><code>{org.slug}</code></dd></div>
            <div><dt>Contact</dt><dd>{org.contactEmail || '—'}</dd></div>
          </dl>
        </section>

        <section className="card">
          <p className="eyebrow">ORGANIZATION ADMINS</p>
          {admins.length ? (
            <ul className="admin-list">
              {admins.map((a) => (
                <li key={a.id}>
                  <div className="member">
                    <div className="avatar">{a.name?.[0]?.toUpperCase()}</div>
                    <div><strong>{a.name}</strong><small>{a.email}</small></div>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="No admin has joined yet" text="Invitations appear here once accepted." />
          )}
          <div className="divider" />
          <h3>Invite an admin</h3>
          <form onSubmit={sendInvite} className="stack-form">
            <input placeholder="Name (optional)" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} />
            <input type="email" placeholder="admin@theirstore.com" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} required />
            <button className="button" disabled={busy}>{busy ? 'Sending…' : 'Send invitation'}</button>
          </form>
        </section>
      </div>
    </Page>
  );
}
