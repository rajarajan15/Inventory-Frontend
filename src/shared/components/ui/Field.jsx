import { useId, useState } from 'react';

const EyeIcon = ({ crossed }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {crossed && <line x1="3" y1="3" x2="21" y2="21" />}
  </svg>
);

/** Password input with a show/hide toggle. */
function PasswordInput({ id, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-input">
      <input id={id} {...props} type={visible ? 'text' : 'password'} autoCapitalize="off" spellCheck={false} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        aria-controls={id}
        title={visible ? 'Hide password' : 'Show password'}
      >
        <EyeIcon crossed={visible} />
      </button>
    </div>
  );
}

export function Field({ label, as, error, children, id, wide = false, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const Element = as || 'input';
  const inputProps = { id: inputId, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? errorId : undefined, ...props };

  return (
    <div className={wide ? 'field wide' : 'field'}>
      <label htmlFor={inputId}>{label}</label>
      {!as && props.type === 'password'
        ? <PasswordInput {...inputProps} />
        : <Element {...inputProps}>{children}</Element>}
      {error && <small id={errorId} className="field-error">{error}</small>}
    </div>
  );
}
