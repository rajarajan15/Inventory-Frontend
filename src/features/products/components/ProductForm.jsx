import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAsync } from '../../../shared/hooks/useAsync';
import { formErrors } from '../../../shared/utils/errorUtils';
import { Page } from '../../../shared/components/Layout/Page';
import { Alert } from '../../../shared/components/ui/Alert';
import { Field } from '../../../shared/components/ui/Field';
import { Loading } from '../../../shared/components/ui/Loading';

const EMPTY = { name: '', description: '', sku: '', price: '', quantity: '', minimumStock: '', categoryId: '' };

const toValues = (p) => ({
  name: p.name,
  description: p.description || '',
  sku: p.sku,
  price: p.price,
  quantity: p.quantity,
  minimumStock: p.minimumStock,
  categoryId: p.categoryId || '',
  version: p.version,
});

export function ProductForm() {
  const { id } = useParams();
  const { api } = useAuth();
  const editing = Boolean(id);
  const product = useAsync(() => (editing ? api.product(id) : null), [api, id, editing]);

  if (editing && !product.data) {
    return product.error ? <Page title="Product unavailable"><Alert text={product.error} /></Page> : <Loading />;
  }
  // Keyed by version so the form starts from the latest data after "reload latest"
  return <ProductFormBody key={product.data?.version ?? 'new'} id={id} initial={editing ? toValues(product.data) : EMPTY} onReload={product.reload} />;
}

function ProductFormBody({ id, initial, onReload }) {
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { api, path } = useAuth();
  const categories = useAsync(() => api.categories(), [api]);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (field) => (e) => setValues({ ...values, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const payload = {
      ...values,
      price: Number(values.price),
      minimumStock: Number(values.minimumStock),
      categoryId: Number(values.categoryId),
    };
    // Stock quantity only changes through stock in/out (so it's recorded in the history), except the opening quantity
    if (editing) delete payload.quantity;
    else payload.quantity = values.quantity === '' ? 0 : Number(values.quantity);
    try {
      const saved = await api.saveProduct(payload, id);
      navigate(path(`/products/${saved.id || id}`));
    } catch (err) {
      setErrors(formErrors(err));
    } finally {
      setBusy(false);
    }
  }

  const stale = errors.form?.status === 409 && /changed by someone else/i.test(errors.form.message);

  return (
    <Page back={path('/products')} title={editing ? 'Edit product' : 'Add a product'} subtitle={editing ? 'Update the product details below.' : 'Add a new item to your inventory.'}>
      <section className="form-card">
        <form onSubmit={submit}>
          <Alert text={errors.form || categories.error} inlineFields={['name', 'sku', 'categoryId', 'price', 'quantity', 'minimumStock', 'description']} />
          {stale && <button type="button" className="button secondary" onClick={onReload}>Load the latest version</button>}
          <div className="form-grid">
            <Field label="Product name" maxLength={255} value={values.name} error={errors.name} onChange={set('name')} required />
            <Field label="SKU" maxLength={100} value={values.sku} error={errors.sku} onChange={set('sku')} required />
            <Field label="Category" as="select" value={values.categoryId} error={errors.categoryId} onChange={set('categoryId')} required>
              <option value="">Select a category</option>
              {(categories.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Field>
            <Field label="Unit price (₹)" type="number" step="0.01" min="0" value={values.price} error={errors.price} onChange={set('price')} required />
            {!editing && <Field label="Opening quantity" type="number" min="0" step="1" value={values.quantity} error={errors.quantity} onChange={set('quantity')} />}
            <Field label="Minimum stock level" type="number" min="0" step="1" value={values.minimumStock} error={errors.minimumStock} onChange={set('minimumStock')} required />
            <Field wide label="Description (optional)" as="textarea" rows="4" maxLength={2000} value={values.description} error={errors.description} onChange={set('description')} />
          </div>
          <div className="form-actions">
            <Link className="button ghost" to={path(editing ? `/products/${id}` : '/products')}>Cancel</Link>
            <button className="button" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add product'}</button>
          </div>
        </form>
      </section>
    </Page>
  );
}
