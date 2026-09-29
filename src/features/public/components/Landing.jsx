import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/** Public home: request StockWise, or jump to an existing organization's portal. */
export function Landing() {
  const [slug, setSlug] = useState('');
  const navigate = useNavigate();

  function openPortal(e) {
    e.preventDefault();
    const clean = slug.trim().toLowerCase().replace(/^.*\/o\//, '').replace(/\/.*$/, '');
    if (clean) navigate(`/o/${clean}/login`);
  }

  return (
    <div className="landing">
      <header className="landing-head">
        <Link className="brand" to="/"><span>◆</span> Stockwise</Link>
        <Link className="button secondary" to="/request-access">Request access</Link>
      </header>

      <section className="landing-hero">
        <p className="eyebrow">INVENTORY, SIMPLIFIED</p>
        <h1>Make every item count.</h1>
        <p className="lead">
          StockWise gives every store its own private inventory workspace: products, stock levels,
          low-stock alerts and your team, all in one place.
        </p>
        <div className="landing-actions">
          <Link className="button" to="/request-access">Get StockWise for your organization</Link>
        </div>
      </section>

      <section className="landing-grid">
        <article className="card">
          <h3>Your own workspace</h3>
          <p className="muted">Each organization gets a private portal URL. Only your approved team members can sign in.</p>
        </article>
        <article className="card">
          <h3>Bring your data</h3>
          <p className="muted">Already tracking stock elsewhere? Import your products, categories and team from a CSV file.</p>
        </article>
        <article className="card">
          <h3>You stay in control</h3>
          <p className="muted">Your administrators approve every new account before it can access inventory.</p>
        </article>
      </section>

      <section className="card landing-portal">
        <div>
          <h3>Already a StockWise customer?</h3>
          <p className="muted">Open your organization&apos;s portal using the link or code StockWise gave you.</p>
        </div>
        <form onSubmit={openPortal} className="inline-form">
          <input placeholder="your-organization" value={slug} onChange={(e) => setSlug(e.target.value)} aria-label="Organization code" />
          <button className="button">Open portal</button>
        </form>
      </section>
    </div>
  );
}
