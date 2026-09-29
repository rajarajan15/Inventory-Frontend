/** Mirrors the backend PasswordPolicy so users see the rules before submitting. */
export const PASSWORD_RULES = [
  { label: '8 to 64 characters', test: (p) => p.length >= 8 && p.length <= 64 },
  { label: 'An uppercase letter', test: (p) => /\p{Lu}/u.test(p) },
  { label: 'A lowercase letter', test: (p) => /\p{Ll}/u.test(p) },
  { label: 'A number', test: (p) => /\p{Nd}/u.test(p) },
  { label: 'A special character (e.g. ! @ # $ %)', test: (p) => /[^\p{L}\p{Nd}\s]/u.test(p) },
  { label: 'No spaces', test: (p) => p.length > 0 && !/\s/.test(p) },
];

export const isStrongPassword = (password) => PASSWORD_RULES.every((rule) => rule.test(password));

export function PasswordRules({ password }) {
  return (
    <ul className="password-rules" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.label} className={ok ? 'ok' : ''}>
            <span aria-hidden="true">{ok ? '✓' : '○'}</span> {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
