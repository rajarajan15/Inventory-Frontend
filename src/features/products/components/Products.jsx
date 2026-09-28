import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { api } from '../../../shared/api/api';
import { errorText } from '../../../shared/utils/errorUtils';
import { Page } from '../../../shared/components/Layout/Page';
import { Alert } from '../../../shared/components/ui/Alert';
import { ProductTable } from './ProductTable';

export function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');

  const loadProducts = async () => {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (category) q.set('categoryId', category);
    try {
      const productsData = await api.products(q.toString() ? `?${q}` : '');
      setProducts(productsData);
    } catch (e) {
      setError(errorText(e));
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await api.categories();
        setCategories(categoriesData);
      } catch (e) {
        setError(errorText(e));
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const t = setTimeout(loadProducts, 250);
    return () => clearTimeout(t);
  }, [search, category]);

  return (
    <Page title="Products" subtitle="Search, monitor, and manage your inventory." action={user.role === 'ADMIN' && <Link className="button" to="/products/new">+ Add product</Link>}>
      <Alert text={error} />
      <div className="toolbar">
        <input aria-label="Search products" placeholder="Search by product name or SKU…" value={search} onChange={e => setSearch(e.target.value)} />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}
        </select>
      </div>
      <section className="card">
        <ProductTable products={products} onDelete={async id => {
          if (confirm('Delete this product? This cannot be undone.')) {
            try {
              await api.deleteProduct(id);
              loadProducts();
            } catch (e) {
              setError(errorText(e));
            }
          }
        }} />
      </section>
    </Page>
  );
}
