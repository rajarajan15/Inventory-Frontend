import { ApiError } from '../api/api';

/** Plain-text message for any thrown value. Server messages are written for end users and shown as-is. */
export function errorText(error) {
  if (!error) return '';
  if (typeof error === 'string') return error;
  return error instanceof ApiError ? error.message : 'Unexpected error. Please try again.';
}

/** Short heading describing the kind of failure, so users understand what happened at a glance. */
export function errorTitle(error) {
  if (!(error instanceof ApiError)) return null;
  const { status } = error;
  if (status === 0) return 'Can’t reach StockWise';
  if (status === 400) return error.validationErrors ? 'Please check your input' : 'Request not accepted';
  if (status === 401) return 'Sign-in required';
  if (status === 403) return 'Not allowed';
  if (status === 404) return 'Not found';
  if (status === 405) return 'Action not supported';
  if (status === 409) return 'Conflict';
  if (status === 413) return 'File too large';
  if (status === 415) return 'Unsupported file or format';
  if (status === 429) return 'Too many attempts';
  if (status >= 500) return 'Server error';
  return null;
}

/** Turns camelCase API field names into labels, e.g. "contactEmail" → "Contact email". */
export function fieldLabel(field) {
  const words = field.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * For forms: field messages go next to their inputs; the whole error is kept under `form` for the Alert,
 * which shows the summary and any field errors that have no input on screen.
 */
export function formErrors(error) {
  return { ...(error?.validationErrors || {}), form: error };
}
