import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { money, niceDate } from '../../../shared/utils/formatters';
import { StockBadge } from './StockBadge';
import { Empty } from '../../../shared/components/ui/Empty';

export function ProductTable({ products, compact = false, onDelete }) {
  const { user } = useAuth();

  if (!products.length) return <Empty title="No products found" text="Try a different search or add your first product." />;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>SKU</th>
            <th>Unit price</th>
            <th>Stock</th>
            {!compact && <th>Updated</th>}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>
                <Link className="product-name" to={`/products/${p.id}`}>{p.name}</Link>
                {p.description && <small>{p.description}</small>}
              </td>
              <td>{p.categoryName || 'Uncategorised'}</td>
              <td><code>{p.sku}</code></td>
              <td>{money.format(p.price)}</td>
              <td><StockBadge product={p} /></td>
              {!compact && <td>{niceDate(p.updatedAt)}</td>}
              <td className="row-actions">
                <Link to={`/products/${p.id}`}>View</Link>
                {user.role === 'ADMIN' && (
                  <>
                    <Link to={`/products/${p.id}/edit`}>Edit</Link>
                    {onDelete && <button className="link danger" onClick={() => onDelete(p.id)}>Delete</button>}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
