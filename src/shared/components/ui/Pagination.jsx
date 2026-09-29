/** Previous/next pager for a PageResponse ({ page, size, totalElements, totalPages }). */
export function Pagination({ page, onChange, label = 'items' }) {
  if (!page || page.totalPages <= 1) return null;
  const first = page.page * page.size + 1;
  const last = Math.min(first + page.content.length - 1, page.totalElements);

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="muted">{first}–{last} of {page.totalElements} {label}</span>
      <div className="action-button-group">
        <button type="button" className="button secondary button-sm" disabled={page.page === 0} onClick={() => onChange(page.page - 1)}>
          ← Previous
        </button>
        <span className="muted">Page {page.page + 1} of {page.totalPages}</span>
        <button type="button" className="button secondary button-sm" disabled={page.page + 1 >= page.totalPages} onClick={() => onChange(page.page + 1)}>
          Next →
        </button>
      </div>
    </nav>
  );
}
