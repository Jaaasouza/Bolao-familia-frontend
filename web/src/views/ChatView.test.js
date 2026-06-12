import { describe, it, expect } from 'vitest';
import { mergeMessages, timeLabel } from './ChatView.jsx';

describe('mergeMessages', () => {
  it('de-duplicates by id and keeps time order', () => {
    const a = [{ id: 1, created_at: '2026-06-12T10:00:00Z' }];
    const incoming = [
      { id: 2, created_at: '2026-06-12T10:02:00Z' },
      { id: 1, created_at: '2026-06-12T10:00:00Z' }, // dup
      { id: 3, created_at: '2026-06-12T10:01:00Z' },
    ];
    const out = mergeMessages(a, incoming);
    expect(out.map((m) => m.id)).toEqual([1, 3, 2]);
  });

  it('updates an existing message in place (same id)', () => {
    const a = [{ id: 1, body: 'old', created_at: '2026-06-12T10:00:00Z' }];
    const out = mergeMessages(a, [{ id: 1, body: 'new', created_at: '2026-06-12T10:00:00Z' }]);
    expect(out).toHaveLength(1);
    expect(out[0].body).toBe('new');
  });
});

describe('timeLabel', () => {
  it('formats a valid timestamp to hh:mm', () => {
    expect(timeLabel('2026-06-12T10:05:00Z', 'pt')).toMatch(/\d{1,2}:\d{2}/);
  });
  it('returns empty string for invalid input', () => {
    expect(timeLabel(null, 'en')).toBe('');
    expect(timeLabel('not-a-date', 'en')).toBe('');
  });
});
