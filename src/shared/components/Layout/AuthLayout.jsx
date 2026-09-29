import { Link } from 'react-router-dom';

export function AuthLayout({
  title,
  subtitle,
  eyebrow,
  children,
  heading = 'Make every item count.',
  tagline = 'Keep your stock, team, and operations in one calm, connected workspace.',
}) {
  return (
    <div className="auth-page">
      <section className="auth-art">
        <Link className="brand" to="/"><span>◆</span> Stockwise</Link>
        <div>
          <p className="eyebrow">INVENTORY, SIMPLIFIED</p>
          <h1>{heading}</h1>
          <p>{tagline}</p>
        </div>
        <div className="art-card">
          <span>↗</span>
          <strong>Clear visibility</strong>
          <small>Know what needs attention before it becomes a problem.</small>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-form">
          <Link className="mobile-brand" to="/">◆ Stockwise</Link>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="muted">{subtitle}</p>
          {children}
        </div>
      </section>
    </div>
  );
}
