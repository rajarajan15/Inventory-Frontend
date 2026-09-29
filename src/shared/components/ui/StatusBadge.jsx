const LABELS = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  REJECTED: 'Rejected',
  DISABLED: 'Disabled',
  APPROVED: 'Approved',
  SUSPENDED: 'Suspended',
};

/** Status pill for users, organizations and subscription requests. */
export function StatusBadge({ status }) {
  return <span className={`status-pill ${String(status).toLowerCase()}`}>{LABELS[status] || status}</span>;
}
