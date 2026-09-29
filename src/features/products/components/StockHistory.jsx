import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAsync } from '../../../shared/hooks/useAsync';
import { dateTime } from '../../../shared/utils/formatters';
import { Alert } from '../../../shared/components/ui/Alert';
import { Empty } from '../../../shared/components/ui/Empty';
import { Pagination } from '../../../shared/components/ui/Pagination';

const TYPE_LABELS = {
  INITIAL: 'Opening stock',
  STOCK_IN: 'Stock in',
  STOCK_OUT: 'Stock out',
  ADJUSTMENT: 'Adjustment',
  IMPORT: 'CSV import',
};

/** Stock ledger for one product. `refreshKey` changes after a stock operation to show the new entry. */
export function StockHistory({ productId, refreshKey }) {
  const { api } = useAuth();
  const [page, setPage] = useState(0);
  const history = useAsync(() => api.movements(productId, { page, size: 10 }), [api, productId, page, refreshKey]);

  return (
    <section className="card">
      <div className="section-head">
        <div>
          <h3>Stock history</h3>
          <p>Every change to this product's quantity, newest first.</p>
        </div>
      </div>
      <Alert text={history.error} />
      {history.data && (history.data.content.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>When</th><th>Type</th><th>Change</th><th>Stock after</th><th>By</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {history.data.content.map((m) => (
                <tr key={m.id}>
                  <td>{dateTime(m.createdAt)}</td>
                  <td>{TYPE_LABELS[m.type] || m.type}</td>
                  <td className={m.quantityChange < 0 ? 'danger' : 'positive'}>{m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}</td>
                  <td>{m.quantityAfter}</td>
                  <td>{m.performedBy || '—'}</td>
                  <td>{m.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty title="No stock changes yet" text="Stock received or removed will appear here." />)}
      <Pagination page={history.data} onChange={setPage} label="changes" />
    </section>
  );
}
