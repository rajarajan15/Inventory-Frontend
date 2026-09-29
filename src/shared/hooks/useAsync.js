import { useCallback, useEffect, useState } from 'react';

const sameKey = (a, b) => a !== null && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));

/**
 * Loads data whenever `deps` change.
 *  - Responses that arrive after the inputs changed (or after unmount) are ignored, so a slow earlier request can
 *    never overwrite a newer result (e.g. while typing in a search box).
 *  - While reloading, the previous data stays visible (`loading` is true) so tables don't flash empty.
 *
 * @returns {{ data, error, loading, reload: () => void, setData: (updater) => void }}
 */
export function useAsync(load, deps) {
  const [nonce, setNonce] = useState(0);
  const key = [...deps, nonce];
  const [result, setResult] = useState({ key: null, data: undefined, error: null });

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(load)
      .then(
        (data) => active && setResult({ key, data, error: null }),
        (error) => active && setResult((prev) => ({ key, data: prev.data, error })),
      );
    return () => { active = false; };
    // `key` is the dependency list itself (deps + reload counter); `load` is intentionally not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, key);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback((updater) => setResult((prev) => ({
    ...prev,
    data: typeof updater === 'function' ? updater(prev.data) : updater,
  })), []);

  const loading = !sameKey(result.key, key);
  return { data: result.data, error: loading ? null : result.error, loading, reload, setData };
}
