export function Loading({ text = 'Loading…' }) {
  return <div className="loading"><span>◆</span> {text}</div>;
}
