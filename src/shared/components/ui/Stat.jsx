export function Stat({ label, value, icon, tone }) {
  return (
    <article className="stat">
      <span className={`stat-icon ${tone}`}>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
