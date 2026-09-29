import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAsync } from '../../../shared/hooks/useAsync';
import { formErrors } from '../../../shared/utils/errorUtils';
import { Page } from '../../../shared/components/Layout/Page';
import { Alert } from '../../../shared/components/ui/Alert';
import { Empty } from '../../../shared/components/ui/Empty';

const EMPTY_DRAFT = { name: '', description: '' };

export function Categories() {
  const { user, api } = useAuth();
  const categories = useAsync(() => api.categories(), [api]);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  function reset() {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setErrors({});
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await api.saveCategory(draft, editing?.id);
      reset();
      categories.reload();
    } catch (err) {
      setErrors(formErrors(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(c) {
    if (!confirm(`Delete ${c.name}?`)) return;
    setErrors({});
    try {
      await api.deleteCategory(c.id);
      categories.reload();
    } catch (err) {
      setErrors({ form: err });
    }
  }

  const items = categories.data || [];

  return (
    <Page title="Categories" subtitle="Organize products into clear, useful groups.">
      <Alert text={errors.form || categories.error} inlineFields={['name', 'description']} />
      {user.role === 'ADMIN' && (
        <section className="card category-form">
          <h3>{editing ? 'Edit category' : 'Add a category'}</h3>
          <form onSubmit={save} className="inline-form">
            <div>
              <input aria-label="Category name" placeholder="Category name" maxLength={255} value={draft.name} aria-invalid={errors.name ? true : undefined} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
              {errors.name && <small className="field-error">{errors.name}</small>}
            </div>
            <div>
              <input aria-label="Description" placeholder="Description (optional)" maxLength={1000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              {errors.description && <small className="field-error">{errors.description}</small>}
            </div>
            <button className="button" disabled={busy}>{editing ? 'Save' : 'Add category'}</button>
            {editing && <button className="button ghost" type="button" onClick={reset}>Cancel</button>}
          </form>
        </section>
      )}
      <section className="card">
        <div className="category-list">
          {items.length ? items.map((c) => (
            <article className="category-row" key={c.id}>
              <div className="category-icon">#</div>
              <div>
                <h3>{c.name}</h3>
                <p>{c.description || 'No description provided'}</p>
              </div>
              <span>{c.productCount} {c.productCount === 1 ? 'product' : 'products'}</span>
              {user.role === 'ADMIN' && (
                <div className="row-actions">
                  <button className="link" onClick={() => { setEditing(c); setDraft({ name: c.name, description: c.description || '' }); setErrors({}); }}>Edit</button>
                  <button className="link danger" onClick={() => remove(c)}>Delete</button>
                </div>
              )}
            </article>
          )) : categories.data && <Empty title="No categories yet" text="Create a category before adding products." />}
        </div>
      </section>
    </Page>
  );
}
