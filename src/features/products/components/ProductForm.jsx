import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../shared/api/api';
import { errorText } from '../../../shared/utils/errorUtils';
import { Page } from '../../../shared/components/Layout/Page';
import { Alert } from '../../../shared/components/ui/Alert';
import { Field } from '../../../shared/components/ui/Field';

export function ProductForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [values, setValues] = useState({ name: '', description: '', sku: '', price: '', quantity: '', minimumStock: '', categoryId: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const categoriesData = await api.categories();
        setCategories(categoriesData);
      } catch (e) {
        setErrors({ form: errorText(e) });
      }

      if (editing) {
        try {
          const productData = await api.product(id);
          setValues({
            name: productData.name,
            description: productData.description || '',
            sku: productData.sku,
            price: productData.price,
            quantity: productData.quantity,
            minimumStock: productData.minimumStock,
            categoryId: productData.categoryId || ''
          });
        } catch (e) {
          setErrors({ form: errorText(e) });
        }
      }
    };
    loadData();
  }, [id, editing]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const payload = {
      ...values,
      price: Number(values.price),
      minimumStock: Number(values.minimumStock),
      categoryId: Number(values.categoryId)
    };
    if (!editing) payload.quantity = values.quantity === '' ? 0 : Number(values.quantity);
    try {
      const saved = await api.saveProduct(payload, id);
      navigate(`/products/${saved.id || id}`);
    } catch (e) {
      setErrors(e.payload?.validationErrors || { form: errorText(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page back="/products" title={editing ? 'Edit product' : 'Add a product'} subtitle={editing ? 'Update the product details below.' : 'Add a new item to your inventory.'}>
      <section className="form-card">
        <form onSubmit={submit}>
          <Alert text={errors.form} />
          <div className="form-grid">
            <Field label="Product name" value={values.name} error={errors.name} onChange={e => setValues({ ...values, name: e.target.value })} required />
            <Field label="SKU" value={values.sku} error={errors.sku} onChange={e => setValues({ ...values, sku: e.target.value })} required />
            <Field label="Category" as="select" value={values.categoryId} error={errors.categoryId} onChange={e => setValues({ ...values, categoryId: e.target.value })} required>
              <option value="">Select a category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Field>
            <Field label="Unit price (₹)" type="number" step="0.01" min="0" value={values.price} error={errors.price} onChange={e => setValues({ ...values, price: e.target.value })} required />
            {!editing && <Field label="Opening quantity" type="number" min="0" value={values.quantity} error={errors.quantity} onChange={e => setValues({ ...values, quantity: e.target.value })} />}
            <Field label="Minimum stock level" type="number" min="0" value={values.minimumStock} error={errors.minimumStock} onChange={e => setValues({ ...values, minimumStock: e.target.value })} required />
            <div className="field wide">
              <label>Description <span>Optional</span></label>
              <textarea rows="4" value={values.description} onChange={e => setValues({ ...values, description: e.target.value })} />
              <small className="field-error">{errors.description}</small>
            </div>
          </div>
          <div className="form-actions">
            <Link className="button ghost" to={editing ? `/products/${id}` : '/products'}>Cancel</Link>
            <button className="button" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add product'}</button>
          </div>
        </form>
      </section>
    </Page>
  );
}
