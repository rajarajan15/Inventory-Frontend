import { Link } from 'react-router-dom';
import { AuthLayout } from '../../../shared/components/Layout/AuthLayout';

export function NotFound({ title = 'Page not found', text = 'The page you are looking for does not exist.' }) {
  return (
    <AuthLayout eyebrow="404" title={title} subtitle={text}>
      <div className="stack-form">
        <Link className="button full" to="/">Go to StockWise home</Link>
        <Link className="button ghost full" to="/request-access">Request StockWise for your organization</Link>
      </div>
    </AuthLayout>
  );
}
