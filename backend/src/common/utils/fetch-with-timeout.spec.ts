import { fetchJsonWithTimeout } from './fetch-with-timeout';

describe('fetchJsonWithTimeout', () => {
  it('returns null when the request exceeds the timeout', async () => {
    const abortError = new Error('aborted');
    const mockFetch = jest.fn((_url: string, init?: RequestInit) => {
      return new Promise((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(abortError));
      });
    });

    global.fetch = mockFetch as typeof fetch;

    const result = await fetchJsonWithTimeout('https://example.com', undefined, 10);

    expect(result).toBeNull();
    expect(mockFetch).toHaveBeenCalled();
  });
});
