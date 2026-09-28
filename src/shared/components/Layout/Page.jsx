import { Link } from 'react-router-dom';

export function Page({ title, subtitle, action, back, children }) {
  return (
    <div className="page">
      {back && <Link className="back" to={back}>← Back</Link>}
      <div className="page-title">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
