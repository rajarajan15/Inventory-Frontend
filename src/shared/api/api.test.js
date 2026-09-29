import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, queryString, request, sessions } from './api';

const json = (status, body) => ({ status, ok: status < 400, json: async () => body });

describe('request', () => {
  beforeEach(() => {
    sessions.save('org', { accessToken: 'old-access', refreshToken: 'refresh-1', id: 1, name: 'Ann' });
  });

  it('turns an error body into an ApiError with the server message and field errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(400, {
      message: 'Please correct the highlighted fields.', validationErrors: { sku: 'SKU is required' },
    })));
    const error = await request('/x', { scope: 'org' }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe('Please correct the highlighted fields.');
    expect(error.validationErrors).toEqual({ sku: 'SKU is required' });
  });

  it('explains network failures instead of throwing a raw TypeError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const error = await request('/x').catch((e) => e);
    expect(error.status).toBe(0);
    expect(error.message).toMatch(/Unable to reach the StockWise server/);
  });

  it('refreshes once for parallel 401s and retries each request with the new token', async () => {
    const fetchMock = vi.fn(async (url, options) => {
      if (url.endsWith('/api/auth/refresh')) return json(200, { accessToken: 'new-access', refreshToken: 'refresh-2' });
      return options.headers.Authorization === 'Bearer new-access' ? json(200, { ok: true }) : json(401, {});
    });
    vi.stubGlobal('fetch', fetchMock);

    const results = await Promise.all([request('/a', { scope: 'org' }), request('/b', { scope: 'org' }), request('/c', { scope: 'org' })]);

    expect(results).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/api/auth/refresh'))).toHaveLength(1);
    expect(sessions.get('org')).toMatchObject({ accessToken: 'new-access', refreshToken: 'refresh-2' });
  });

  it('clears the session and signals sign-out when the refresh is rejected', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(401, {})));
    const signedOut = vi.fn();
    window.addEventListener('auth:unauthorized', signedOut);

    const error = await request('/x', { scope: 'org' }).catch((e) => e);

    expect(error.status).toBe(401);
    expect(sessions.get('org')).toBeNull();
    expect(signedOut).toHaveBeenCalledTimes(1);
    window.removeEventListener('auth:unauthorized', signedOut);
  });

  it('never sends the organization token to the super admin area', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, {}));
    vi.stubGlobal('fetch', fetchMock);
    await request('/api/platform/organizations', { scope: 'platform' });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });
});

describe('sessions.watch', () => {
  it('reports sign-ins made in other tabs', () => {
    const onChange = vi.fn();
    const stop = sessions.watch('org', onChange);
    sessions.save('org', { accessToken: 'a', refreshToken: 'r', id: 2, name: 'Bo' });
    window.dispatchEvent(new StorageEvent('storage', { key: 'stockwise_org_session' }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated' }));
    stop();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].user.name).toBe('Bo');
  });
});

describe('queryString', () => {
  it('skips empty values and encodes the rest', () => {
    expect(queryString({ search: 'a&b', categoryId: '', page: 0, size: undefined })).toBe('?search=a%26b&page=0');
    expect(queryString({})).toBe('');
  });
});
