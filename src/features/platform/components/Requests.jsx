import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { platformApi } from '../../../shared/api/api';
import { useAsync } from '../../../shared/hooks/useAsync';
import { niceDate } from '../../../shared/utils/formatters';
import { Page } from '../../../shared/components/Layout/Page';
import { Alert } from '../../../shared/components/ui/Alert';
import { Empty } from '../../../shared/components/ui/Empty';
import { Field } from '../../../shared/components/ui/Field';
import { Modal } from '../../../shared/components/ui/Modal';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { CreateOrganizationModal } from './CreateOrganizationModal';

const TABS = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: '', label: 'All' },
];

export function Requests() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'PENDING';
  const list = useAsync(() => platformApi.requests(status || undefined), [status]);
  const requests = list.data || [];
  const [notice, setNotice] = useState('');
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);


  return (
    <Page title="Subscription requests" subtitle="Organizations asking to use StockWise. Approve one by creating its organization.">
      <Alert text={list.error} />
      {notice && <div className="alert success-alert">{notice}</div>}

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key || 'all'} className={status === t.key ? 'tab active' : 'tab'} onClick={() => setParams({ status: t.key })}>{t.label}</button>
        ))}
      </div>

      {requests.length ? (
        <div className="request-list">
          {requests.map((r) => (
            <article className="card request-card" key={r.id}>
              <div className="section-head">
                <div>
                  <h3>{r.organizationName}</h3>
                  <p>{r.contactName} · <a className="link" href={`mailto:${r.contactEmail}`}>{r.contactEmail}</a>{r.contactPhone && ` · ${r.contactPhone}`}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              {r.message && <p className="description">“{r.message}”</p>}
              <div className="request-meta">
                <span>Requested {niceDate(r.createdAt)}</span>
                <span>{r.hasExistingData ? 'Has existing data (CSV import)' : 'Starting fresh'}</span>
                {r.reviewNote && <span>Note: {r.reviewNote}</span>}
                {r.organizationId && <Link className="link" to={`/platform/organizations/${r.organizationId}`}>Open organization /o/{r.organizationSlug} →</Link>}
              </div>
              {r.status === 'PENDING' && (
                <div className="form-actions">
                  <button className="button ghost" onClick={() => setRejecting(r)}>Reject</button>
                  <button className="button" onClick={() => setApproving(r)}>Approve & create organization</button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <section className="card"><Empty title="Nothing here" text={status === 'PENDING' ? 'No requests are waiting for review.' : 'No requests in this list.'} /></section>
      )}

      {approving && (
        <CreateOrganizationModal
          request={approving}
          onClose={() => setApproving(null)}
          onCreated={(org) => { setApproving(null); setNotice(`${org.name} is live at ${org.portalUrl}`); list.reload(); }}
        />
      )}
      {rejecting && (
        <RejectModal
          request={rejecting}
          onClose={() => setRejecting(null)}
          onRejected={() => { setNotice(`Request from ${rejecting.organizationName} rejected; they have been emailed.`); setRejecting(null); list.reload(); }}
        />
      )}
    </Page>
  );
}

function RejectModal({ request, onClose, onRejected }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await platformApi.rejectRequest(request.id, note.trim() || null);
      onRejected();
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <Modal eyebrow="REJECT REQUEST" title={request.organizationName} onClose={onClose}
      subtitle={`${request.contactEmail} will be emailed that the request was not approved.`}>
      <form onSubmit={submit} className="stack-form">
        <Alert text={error} />
        <Field label="Note to include in the email (optional)" as="textarea" rows="3" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="form-actions">
          <button type="button" className="button ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="button danger-button" disabled={busy}>{busy ? 'Rejecting…' : 'Reject request'}</button>
        </div>
      </form>
    </Modal>
  );
}
