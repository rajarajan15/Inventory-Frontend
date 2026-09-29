import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAsync } from '../../../shared/hooks/useAsync';
import { formErrors } from '../../../shared/utils/errorUtils';
import { niceDate } from '../../../shared/utils/formatters';
import { Page } from '../../../shared/components/Layout/Page';
import { Alert } from '../../../shared/components/ui/Alert';
import { Empty } from '../../../shared/components/ui/Empty';
import { Field } from '../../../shared/components/ui/Field';
import { Modal } from '../../../shared/components/ui/Modal';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';

const TABS = [
  { key: 'PENDING', label: 'Awaiting approval' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'DISABLED', label: 'Disabled' },
  { key: '', label: 'All' },
];

export function Users() {
  const { api, user: me } = useAuth();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'ACTIVE';
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [inviting, setInviting] = useState(false);

  const members = useAsync(async () => {
    const [list, pending] = await Promise.all([api.users(status || undefined), api.users('PENDING')]);
    return { list, pendingCount: pending.length };
  }, [api, status]);
  const users = members.data?.list || [];
  const pendingCount = members.data?.pendingCount || 0;

  async function act(u, action, message) {
    setBusyId(u.id);
    setError('');
    setNotice('');
    try {
      await api[action](u.id);
      setNotice(message);
      members.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Page
      title="Team members"
      subtitle="Approve sign-up requests and manage who can access your inventory."
      action={<button className="button" onClick={() => setInviting(true)}>+ Invite member</button>}
    >
      <Alert text={error || members.error} />
      {notice && <div className="alert success-alert">{notice}</div>}

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key || 'all'} className={status === t.key ? 'tab active' : 'tab'} onClick={() => setParams(t.key ? { status: t.key } : { status: '' })}>
            {t.label}
            {t.key === 'PENDING' && pendingCount > 0 && <span className="nav-count">{pendingCount}</span>}
          </button>
        ))}
      </div>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="member">
                      <div className="avatar">{u.name?.[0]?.toUpperCase()}</div>
                      <strong>{u.name}{u.id === me.id && <small className="muted"> (you)</small>}</strong>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td><span className={`role ${u.role.toLowerCase()}`}>{u.role}</span></td>
                  <td><StatusBadge status={u.status} /></td>
                  <td>{niceDate(u.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      {(u.status === 'PENDING' || u.status === 'REJECTED') && (
                        <button className="link" disabled={busyId === u.id} onClick={() => act(u, 'approveUser', `${u.name} approved. They have been emailed and can sign in now.`)}>Approve</button>
                      )}
                      {u.status === 'PENDING' && (
                        <button className="link danger" disabled={busyId === u.id} onClick={() => confirm(`Reject ${u.name}'s request?`) && act(u, 'rejectUser', `${u.name}'s request was rejected.`)}>Reject</button>
                      )}
                      {u.status === 'ACTIVE' && u.id !== me.id && (
                        <button className="link danger" disabled={busyId === u.id} onClick={() => confirm(`Disable ${u.name}? They will be signed out immediately.`) && act(u, 'disableUser', `${u.name} was disabled.`)}>Disable</button>
                      )}
                      {u.status === 'DISABLED' && (
                        <button className="link" disabled={busyId === u.id} onClick={() => act(u, 'enableUser', `${u.name} was re-enabled.`)}>Enable</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!users.length && (
          <Empty
            title={status === 'PENDING' ? 'No pending requests' : 'No team members found'}
            text={status === 'PENDING' ? 'New sign-ups from your portal will appear here for approval.' : 'Invite your team or share your portal link so they can request access.'}
          />
        )}
      </section>

      {inviting && (
        <InviteModal
          onClose={() => setInviting(false)}
          onInvited={(email) => { setInviting(false); setNotice(`Invitation sent to ${email}.`); }}
        />
      )}
    </Page>
  );
}

function InviteModal({ onClose, onInvited }) {
  const { api } = useAuth();
  const [values, setValues] = useState({ name: '', email: '', role: 'STAFF' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await api.inviteUser(values);
      onInvited(values.email);
    } catch (err) {
      setErrors(formErrors(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal eyebrow="TEAM" title="Invite a team member" onClose={onClose}
      subtitle="They will receive an email with a link to set their password and join your organization.">
      <form onSubmit={submit} className="stack-form">
        <Alert text={errors.form} inlineFields={['name', 'email']} />
        <Field label="Name" value={values.name} error={errors.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
        <Field label="Email address" type="email" value={values.email} error={errors.email} onChange={(e) => setValues({ ...values, email: e.target.value })} required />
        <Field label="Role" as="select" value={values.role} onChange={(e) => setValues({ ...values, role: e.target.value })}>
          <option value="STAFF">Staff — inventory and stock operations</option>
          <option value="ADMIN">Admin — full access including team management</option>
        </Field>
        <div className="form-actions">
          <button type="button" className="button ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="button" disabled={busy}>{busy ? 'Sending…' : 'Send invitation'}</button>
        </div>
      </form>
    </Modal>
  );
}
