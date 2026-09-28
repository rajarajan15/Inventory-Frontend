import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { api } from '../../../shared/api/api';
import { errorText } from '../../../shared/utils/errorUtils';
import { money } from '../../../shared/utils/formatters';
import { Page } from '../../../shared/components/Layout/Page';
import { Alert } from '../../../shared/components/ui/Alert';
import { Stat } from '../../../shared/components/ui/Stat';
import { ProductTable } from '../../products/components/ProductTable';
import { Empty } from '../../../shared/components/ui/Empty';

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ products: [], low: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [products, low] = await Promise.all([api.products(), api.lowStock()]);
        setData({ products, low });
      } catch (e) {
        setError(errorText(e));
      }
    };
    loadData();
  }, []);

  const totalUnits = data.products.reduce((sum, p) => sum + p.quantity, 0);
  const value = data.products.reduce((sum, p) => sum + p.quantity * p.price, 0);

  return (
    <Page title={`Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${user.name?.split(' ')[0] || 'there'}.`} subtitle="Here's what's happening in your inventory today." action={user.role === 'ADMIN' && <Link className="button" to="/products/new">+ Add product</Link>}>
      <Alert text={error} />
      <div className="stats">
        <Stat label="Products" value={data.products.length} icon="□" tone="blue" />
        <Stat label="Units in stock" value={totalUnits.toLocaleString()} icon="▤" tone="purple" />
        <Stat label="Low-stock items" value={data.low.length} icon="!" tone="orange" />
        <Stat label="Inventory value" value={money.format(value)} icon="₹" tone="green" />
      </div>
      <section className="card">
        <div className="section-head">
          <div>
            <h3>Needs attention</h3>
            <p>Products that are at or below their minimum stock level.</p>
          </div>
          <Link to="/products">View all products →</Link>
        </div>
        {data.low.length ? <ProductTable products={data.low.slice(0, 5)} compact /> : <Empty title="Everything is well stocked" text="No products currently need a reorder." />}
      </section>
    </Page>
  );
}
