export function Empty({ title, text }) {
  return (
    <div className="empty">
      <div>□</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
