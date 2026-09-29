import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { platformApi } from '../../../shared/api/api';
import { useAsync } from '../../../shared/hooks/useAsync';
import { niceDate } from '../../../shared/utils/formatters';
import { Page } from '../../../shared/components/Layout/Page';
import { Alert } from '../../../shared/components/ui/Alert';
import { Empty } from '../../../shared/components/ui/Empty';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { CreateOrganizationModal } from './CreateOrganizationModal';

export function Organizations() {
  const organizations = useAsync(() => platformApi.organizations(), []);
  const orgs = organizations.data || [];
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();


  return (
    <Page title="Organizations" subtitle="Every client organization and its portal."
      action={<button className="button" onClick={() => setCreating(true)}>+ New organization</button>}>
      <Alert text={organizations.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Portal</th>
                <th>Status</th>
                <th>Setup</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link className="product-name" to={`/platform/organizations/${o.id}`}>{o.name}</Link>
                    {o.contactEmail && <small>{o.contactEmail}</small>}
                  </td>
                  <td><code>/o/{o.slug}</code></td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>{o.setupCompleted ? 'Completed' : 'Pending'}</td>
                  <td>{niceDate(o.createdAt)}</td>
                  <td className="row-actions"><Link to={`/platform/organizations/${o.id}`}>Manage</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!orgs.length && <Empty title="No organizations yet" text="Approve a subscription request or create an organization directly." />}
      </section>

      {creating && (
        <CreateOrganizationModal
          onClose={() => setCreating(false)}
          onCreated={(org) => { setCreating(false); navigate(`/platform/organizations/${org.id}`); }}
        />
      )}
    </Page>
  );
}
