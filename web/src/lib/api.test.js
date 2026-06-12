import { describe, test, expect, beforeEach, vi } from 'vitest';

// VITE_API_BASE is read at module load, so set it before importing api.js.
describe('api base URL normalization', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('strips a trailing slash so paths are not double-slashed', async () => {
    import.meta.env.VITE_API_BASE = 'https://backend.example.app/';
    const { api } = await import('./api.js');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '{"ok":true}',
    });
    global.fetch = fetchMock;

    await api('/api/state');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://backend.example.app/api/state',
      expect.anything()
    );
  });

  test('handles a base with no trailing slash', async () => {
    import.meta.env.VITE_API_BASE = 'https://backend.example.app';
    const { api } = await import('./api.js');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '{}' });
    global.fetch = fetchMock;

    await api('/api/state');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://backend.example.app/api/state',
      expect.anything()
    );
  });
});
