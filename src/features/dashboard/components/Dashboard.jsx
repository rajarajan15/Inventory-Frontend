import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAsync } from '../../../shared/hooks/useAsync';
import { money } from '../../../shared/utils/formatters';
import { Page } from '../../../shared/components/Layout/Page';
import { Alert } from '../../../shared/components/ui/Alert';
import { Stat } from '../../../shared/components/ui/Stat';
import { ProductTable } from '../../products/components/ProductTable';
import { Empty } from '../../../shared/components/ui/Empty';
import { CsvImportModal } from '../../organization';

export function Dashboard() {
  const { user, api, path, orgStatus, refreshOrgStatus, setShowOrgModal } = useAuth();
  const [showCsvModal, setShowCsvModal] = useState(false);
  // Totals are computed by the server, so the dashboard never downloads the whole catalogue
  const overview = useAsync(async () => {
    const [summary, low] = await Promise.all([api.productSummary(), api.lowStock()]);
    return { summary, low };
  }, [api]);

  const handleCsvSuccess = () => {
    refreshOrgStatus();
    overview.reload();
  };

  const summary = overview.data?.summary;
  const low = overview.data?.low || [];
  const stat = (value, format = (v) => v.toLocaleString('en-IN')) => (summary ? format(value) : '…');

  return (
    <Page
      title={`Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${user?.name?.split(' ')[0] || 'there'}.`}
      subtitle="Here's what's happening in your inventory today."
      action={
        user?.role === 'ADMIN' && (
          <div className="action-button-group">
            <button className="button secondary" onClick={() => setShowCsvModal(true)}>
              📥 Import CSV
            </button>
            <Link className="button" to={path('/products/new')}>
              + Add product
            </Link>
          </div>
        )
      }
    >
      <Alert text={overview.error} />

      {orgStatus && (
        <section className="org-summary-card">
          <div className="org-card-content">
            <div className="org-meta">
              <span className="eyebrow">ORGANIZATION DETAILS</span>
              <h3>{orgStatus.name}</h3>
              <p>
                Portal: <a className="link" href={orgStatus.portalUrl}>{orgStatus.portalUrl}</a>
              </p>
            </div>
            <div className="org-status-badge-container">
              <span className={`status-tag ${orgStatus.setupCompleted ? 'completed' : 'pending'}`}>
                {orgStatus.setupCompleted ? '✓ Setup Completed' : '⚡ Setup Pending'}
              </span>
              {user?.role === 'ADMIN' && !orgStatus.setupCompleted && (
                <button className="button ghost button-sm" onClick={() => setShowOrgModal(true)}>
                  Finish setup
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="stats">
        <Stat label="Products" value={stat(summary?.totalProducts)} icon="□" tone="blue" />
        <Stat label="Units in stock" value={stat(summary?.totalUnits)} icon="▤" tone="purple" />
        <Stat label="Low-stock items" value={stat(summary?.lowStockCount)} icon="!" tone="orange" />
        <Stat label="Inventory value" value={stat(summary?.inventoryValue, (v) => money.format(v))} icon="₹" tone="green" />
      </div>

      <section className="card">
        <div className="section-head">
          <div>
            <h3>Needs attention</h3>
            <p>Products that are at or below their minimum stock level.</p>
          </div>
          <Link to={path('/products')}>View all products →</Link>
        </div>
        {low.length ? (
          <ProductTable products={low.slice(0, 5)} compact />
        ) : overview.data && (
          <Empty title="Everything is well stocked" text="No products currently need a reorder." />
        )}
      </section>

      <CsvImportModal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onSuccess={handleCsvSuccess}
      />
    </Page>
  );
}
