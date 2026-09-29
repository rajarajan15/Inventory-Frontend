import { ApiError } from '../../api/api';
import { errorText, errorTitle, fieldLabel } from '../../utils/errorUtils';

/**
 * Error banner. `text` may be a string or a thrown error (ApiError).
 * For validation errors, fields listed in `inlineFields` are shown next to their inputs by the form;
 * every other field error is listed here so nothing the server reported is hidden.
 */
export function Alert({ text, inlineFields = [] }) {
  if (!text) return null;

  const title = errorTitle(text);
  const fields = text instanceof ApiError && text.validationErrors ? text.validationErrors : null;
  const remaining = fields ? Object.entries(fields).filter(([key]) => !inlineFields.includes(key)) : [];
  const allInline = fields && remaining.length === 0;

  return (
    <div className="alert" role="alert">
      {title && <strong className="alert-title">{title}</strong>}
      <span>{allInline ? 'Please correct the highlighted fields below.' : errorText(text)}</span>
      {remaining.length > 0 && Object.keys(fields).length > 1 && (
        <ul className="alert-list">
          {remaining.map(([key, message]) => <li key={key}><strong>{fieldLabel(key)}:</strong> {message}</li>)}
        </ul>
      )}
    </div>
  );
}
