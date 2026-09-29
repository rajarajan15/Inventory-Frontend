import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAsync } from './useAsync';

const deferred = () => {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
};

describe('useAsync', () => {
  it('ignores a slow earlier response once the inputs changed', async () => {
    const calls = {};
    const load = (query) => {
      calls[query] = deferred();
      return calls[query].promise;
    };
    const { result, rerender } = renderHook(({ query }) => useAsync(() => load(query), [query]), { initialProps: { query: 'a' } });

    rerender({ query: 'ab' });
    await waitFor(() => expect(calls.ab).toBeDefined());
    await act(async () => { calls.ab.resolve('results for ab'); });
    await act(async () => { calls.a.resolve('results for a'); }); // arrives late

    expect(result.current.data).toBe('results for ab');
    expect(result.current.loading).toBe(false);
  });

  it('keeps the previous data visible while reloading', async () => {
    let n = 0;
    const next = deferred();
    const { result } = renderHook(() => useAsync(() => (n++ === 0 ? 'first' : next.promise), []));
    await waitFor(() => expect(result.current.data).toBe('first'));

    act(() => result.current.reload());
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe('first');

    await act(async () => { next.resolve('second'); });
    expect(result.current).toMatchObject({ data: 'second', loading: false });
  });

  it('exposes errors', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.reject(new Error('boom')), []));
    await waitFor(() => expect(result.current.error?.message).toBe('boom'));
    expect(result.current.loading).toBe(false);
  });
});
