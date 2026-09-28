export function StockBadge({ product }) {
  const low = product.lowStock || product.quantity <= product.minimumStock;
  return <span className={`stock ${low ? 'low' : 'ok'}`}>{low ? 'Low stock' : `${product.quantity} in stock`}</span>;
}
