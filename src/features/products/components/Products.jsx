import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAsync } from '../../../shared/hooks/useAsync';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import { Page } from '../../../shared/components/Layout/Page';
import { Alert } from '../../../shared/components/ui/Alert';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { ProductTable } from './ProductTable';

const PAGE_SIZE = 20;
const SORTS = [
  ['name', 'Name (A–Z)'],
  ['quantity', 'Stock (lowest first)'],
  ['quantity,desc', 'Stock (highest first)'],
  ['price,desc', 'Price (highest first)'],
  ['updatedAt,desc', 'Recently updated'],
];

export function Products() {
  const { user, api, path } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(0);
  const [actionError, setActionError] = useState(null);
  const debouncedSearch = useDebouncedValue(search.trim());

  const categories = useAsync(() => api.categories(), [api]);
  const products = useAsync(
    () => api.products({ search: debouncedSearch, categoryId, sort, page, size: PAGE_SIZE }),
    [api, debouncedSearch, categoryId, sort, page],
  );

  // Any filter change starts again from the first page
  const filter = (setter) => (e) => { setter(e.target.value); setPage(0); };

  async function remove(id) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setActionError(null);
    try {
      await api.deleteProduct(id);
      products.reload();
    } catch (e) {
      setActionError(e);
    }
  }

  return (
    <Page title="Products" subtitle="Search, monitor, and manage your inventory." action={user.role === 'ADMIN' && <Link className="button" to={path('/products/new')}>+ Add product</Link>}>
      <Alert text={actionError || products.error || categories.error} />
      <div className="toolbar">
        <input aria-label="Search products" placeholder="Search by product name or SKU…" maxLength={100} value={search} onChange={filter(setSearch)} />
        <select aria-label="Category" value={categoryId} onChange={filter(setCategoryId)}>
          <option value="">All categories</option>
          {(categories.data || []).map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}
        </select>
        <select aria-label="Sort by" value={sort} onChange={filter(setSort)}>
          {SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <section className={`card${products.loading ? ' is-loading' : ''}`} aria-busy={products.loading}>
        {products.data
          ? <ProductTable products={products.data.content} onDelete={remove} />
          : !products.error && <p className="muted">Loading products…</p>}
        <Pagination page={products.data} onChange={setPage} label="products" />
      </section>
    </Page>
  );
}
