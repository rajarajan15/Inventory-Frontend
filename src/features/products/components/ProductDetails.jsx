import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAsync } from '../../../shared/hooks/useAsync';
import { formErrors } from '../../../shared/utils/errorUtils';
import { money, niceDate } from '../../../shared/utils/formatters';
import { Page } from '../../../shared/components/Layout/Page';
import { Alert } from '../../../shared/components/ui/Alert';
import { Field } from '../../../shared/components/ui/Field';
import { Loading } from '../../../shared/components/ui/Loading';
import { StockBadge } from './StockBadge';
import { StockHistory } from './StockHistory';

export function ProductDetails() {
  const { id } = useParams();
  const { user, api, path } = useAuth();
  const product = useAsync(() => api.product(id), [api, id]);
  const [operation, setOperation] = useState('in');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  async function stock(e) {
    e.preventDefault();
    const quantity = Number(amount);
    if (!Number.isInteger(quantity) || quantity <= 0) return setErrors({ quantity: 'Enter a whole number greater than zero.' });
    setBusy(true);
    setErrors({});
    try {
      product.setData(await api.stock(id, operation, quantity, notes.trim()));
      setAmount('');
      setNotes('');
      setHistoryKey((k) => k + 1);
    } catch (err) {
      setErrors(formErrors(err));
    } finally {
      setBusy(false);
    }
  }

  const p = product.data;
  if (!p && !product.error) return <Loading />;
  if (!p) return <Page title="Product unavailable"><Alert text={product.error} /><Link to={path('/products')}>← Back to products</Link></Page>;

  return (
    <Page back={path('/products')} title={p.name} subtitle={`${p.categoryName || 'Uncategorised'} · SKU ${p.sku}`} action={user.role === 'ADMIN' && <Link className="button secondary" to={path(`/products/${id}/edit`)}>Edit product</Link>}>
      <Alert text={product.error} />
      <div className="detail-grid">
        <section className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">CURRENT STOCK</p>
              <h2>{p.quantity} <span className="muted">units</span></h2>
            </div>
            <StockBadge product={p} />
          </div>
          <div className="divider" />
          <dl>
            <div><dt>Minimum stock</dt><dd>{p.minimumStock} units</dd></div>
            <div><dt>Unit price</dt><dd>{money.format(p.price)}</dd></div>
            <div><dt>Inventory value</dt><dd>{money.format(p.price * p.quantity)}</dd></div>
            <div><dt>Last updated</dt><dd>{niceDate(p.updatedAt)}</dd></div>
          </dl>
          {p.description && (
            <>
              <div className="divider" />
              <p className="description">{p.description}</p>
            </>
          )}
        </section>
        <section className="card stock-card">
          <p className="eyebrow">STOCK OPERATION</p>
          <h3>Update inventory</h3>
          <p className="muted">Record stock received or stock removed. Every change is kept in the stock history.</p>
          <form onSubmit={stock}>
            <Alert text={errors.form} inlineFields={['quantity', 'notes']} />
            <div className="segmented">
              <button type="button" className={operation === 'in' ? 'selected' : ''} onClick={() => setOperation('in')}>+ Stock in</button>
              <button type="button" className={operation === 'out' ? 'selected' : ''} onClick={() => setOperation('out')}>− Stock out</button>
            </div>
            <Field label="Quantity" type="number" min="1" step="1" value={amount} error={errors.quantity} onChange={(e) => setAmount(e.target.value)} required />
            <Field label="Notes (optional)" maxLength={500} placeholder={operation === 'in' ? 'e.g. Delivery from supplier, invoice #' : 'e.g. Sold, damaged, returned'} value={notes} error={errors.notes} onChange={(e) => setNotes(e.target.value)} />
            <button className="button full" disabled={busy}>{busy ? 'Saving…' : `Confirm stock ${operation}`}</button>
          </form>
        </section>
      </div>
      <StockHistory productId={id} refreshKey={historyKey} />
    </Page>
  );
}
