export function Alert({ text }) {
  return text ? <div className="alert">{text}</div> : null;
}
