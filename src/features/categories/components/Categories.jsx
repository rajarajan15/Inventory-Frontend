import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { api } from '../../../shared/api/api';
import { errorText } from '../../../shared/utils/errorUtils';
import { Page } from '../../../shared/components/Layout/Page';
import { Alert } from '../../../shared/components/ui/Alert';
import { Empty } from '../../../shared/components/ui/Empty';

export function Categories() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({ name: '', description: '' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const loadCategories = async () => {
    try {
      const categoriesData = await api.categories();
      setItems(categoriesData);
    } catch (e) {
      setError(errorText(e));
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  async function save(e) {
    e.preventDefault();
    try {
      await api.saveCategory(draft, editing?.id);
      setDraft({ name: '', description: '' });
      setEditing(null);
      loadCategories();
    } catch (e) {
      setError(errorText(e));
    }
  }

  return (
    <Page title="Categories" subtitle="Organize products into clear, useful groups.">
      <Alert text={error} />
      {user.role === 'ADMIN' && (
        <section className="card category-form">
          <h3>{editing ? 'Edit category' : 'Add a category'}</h3>
          <form onSubmit={save} className="inline-form">
            <input placeholder="Category name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} required />
            <input placeholder="Description (optional)" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} />
            <button className="button">{editing ? 'Save' : 'Add category'}</button>
            {editing && <button className="button ghost" type="button" onClick={() => { setEditing(null); setDraft({ name: '', description: '' }); }}>Cancel</button>}
          </form>
        </section>
      )}
      <section className="card">
        <div className="category-list">
          {items.length ? items.map(c => (
            <article className="category-row" key={c.id}>
              <div className="category-icon">#</div>
              <div>
                <h3>{c.name}</h3>
                <p>{c.description || 'No description provided'}</p>
              </div>
              <span>{c.productCount} {c.productCount === 1 ? 'product' : 'products'}</span>
              {user.role === 'ADMIN' && (
                <div className="row-actions">
                  <button className="link" onClick={() => { setEditing(c); setDraft({ name: c.name, description: c.description || '' }); }}>Edit</button>
                  <button className="link danger" onClick={async () => {
                    if (confirm(`Delete ${c.name}?`)) try {
                      await api.deleteCategory(c.id);
                      loadCategories();
                    } catch (e) {
                      setError(errorText(e));
                    }
                  }}>Delete</button>
                </div>
              )}
            </article>
          )) : <Empty title="No categories yet" text="Create a category before adding products." />}
        </div>
      </section>
    </Page>
  );
}
