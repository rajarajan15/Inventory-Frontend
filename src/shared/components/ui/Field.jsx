export function Field({ label, as, error, children, ...props }) {
  const Element = as || 'input';
  return (
    <div className="field">
      <label>{label}</label>
      <Element {...props}>{children}</Element>
      {error && <small className="field-error">{error}</small>}
    </div>
  );
}
