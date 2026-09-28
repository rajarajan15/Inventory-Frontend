export const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export const niceDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
