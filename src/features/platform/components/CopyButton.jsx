import { useState } from 'react';

export function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. non-secure context); the text stays visible to copy manually
    }
  }

  return <button type="button" className="button secondary button-sm" onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>;
}
