import { describe, it, expect, vi } from 'vitest';
import { fetchWithTimeout } from '@/lib/fetch-timeout';

describe('fetchWithTimeout', () => {
  it('returns response for successful fetch', async () => {
    const mockResponse = new Response('ok', { status: 200 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));
    const res = await fetchWithTimeout('https://example.com');
    expect(res.status).toBe(200);
    vi.unstubAllGlobals();
  });

  it('aborts on timeout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: { signal?: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        opts?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
    }));
    await expect(fetchWithTimeout('https://example.com', {}, 100)).rejects.toThrow();
    vi.unstubAllGlobals();
  });

  it('passes options through to fetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
    vi.stubGlobal('fetch', mockFetch);
    await fetchWithTimeout('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.unstubAllGlobals();
  });
});
