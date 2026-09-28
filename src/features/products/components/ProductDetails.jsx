import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { api } from '../../../shared/api/api';
import { errorText } from '../../../shared/utils/errorUtils';
import { money, niceDate } from '../../../shared/utils/formatters';
import { Page } from '../../../shared/components/Layout/Page';
import { Alert } from '../../../shared/components/ui/Alert';
import { Field } from '../../../shared/components/ui/Field';
import { Loading } from '../../../shared/components/ui/Loading';
import { StockBadge } from './StockBadge';

export function ProductDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [operation, setOperation] = useState('in');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const loadProduct = async () => {
    try {
      const productData = await api.product(id);
      setProduct(productData);
    } catch (e) {
      setError(errorText(e));
    }
  };

  useEffect(() => loadProduct(), [id]);

  async function stock(e) {
    e.preventDefault();
    const quantity = Number(amount);
    if (!Number.isFinite(quantity) || quantity <= 0) return setError('Enter a positive stock quantity.');
    setBusy(true);
    setError('');
    try {
      await api.stock(id, operation, quantity);
      setAmount('');
      loadProduct();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  if (!product && !error) return <Loading />;
  if (!product) return <Page title="Product unavailable"><Alert text={error} /><Link to="/products">← Back to products</Link></Page>;

  return (
    <Page back="/products" title={product.name} subtitle={`${product.categoryName || 'Uncategorised'} · SKU ${product.sku}`} action={user.role === 'ADMIN' && <Link className="button secondary" to={`/products/${id}/edit`}>Edit product</Link>}>
      <Alert text={error} />
      <div className="detail-grid">
        <section className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">CURRENT STOCK</p>
              <h2>{product.quantity} <span className="muted">units</span></h2>
            </div>
            <StockBadge product={product} />
          </div>
          <div className="divider" />
          <dl>
            <div><dt>Minimum stock</dt><dd>{product.minimumStock} units</dd></div>
            <div><dt>Unit price</dt><dd>{money.format(product.price)}</dd></div>
            <div><dt>Inventory value</dt><dd>{money.format(product.price * product.quantity)}</dd></div>
            <div><dt>Last updated</dt><dd>{niceDate(product.updatedAt)}</dd></div>
          </dl>
          {product.description && (
            <>
              <div className="divider" />
              <p className="description">{product.description}</p>
            </>
          )}
        </section>
        <section className="card stock-card">
          <p className="eyebrow">STOCK OPERATION</p>
          <h3>Update inventory</h3>
          <p className="muted">Record stock received or stock removed. The server validates available quantity.</p>
          <form onSubmit={stock}>
            <div className="segmented">
              <button type="button" className={operation === 'in' ? 'selected' : ''} onClick={() => setOperation('in')}>+ Stock in</button>
              <button type="button" className={operation === 'out' ? 'selected' : ''} onClick={() => setOperation('out')}>− Stock out</button>
            </div>
            <Field label="Quantity" type="number" min="1" value={amount} onChange={setAmount} required />
            <button className="button full" disabled={busy}>{busy ? 'Saving…' : `Confirm stock ${operation}`}</button>
          </form>
        </section>
      </div>
    </Page>
  );
}
