import { describe, it, expect } from 'vitest';
import { mergeMessages, timeLabel, mentionQuery, resolveMentionIds } from './ChatView.jsx';

describe('mentionQuery', () => {
  it('detects the active @token before the caret', () => {
    expect(mentionQuery('oi @Mar', 7)).toEqual({ query: 'Mar', start: 3, end: 7 });
    expect(mentionQuery('@Ana', 4)).toMatchObject({ query: 'Ana', start: 0 });
  });
  it('returns null when not in a mention', () => {
    expect(mentionQuery('oi pessoal', 10)).toBeNull();
    expect(mentionQuery('email a@b', 9)).toBeNull(); // @ not starting a word
    expect(mentionQuery('@Ana fala', 9)).toBeNull(); // space after the token
  });
});

describe('resolveMentionIds', () => {
  const players = [{ id: 'p1', name: 'Marcelo' }, { id: 'p2', name: 'Joao Souza' }, { id: 'p3', name: 'Ana' }];
  it('matches @Name occurrences (case-insensitive, multi-word)', () => {
    expect(resolveMentionIds('oi @Marcelo e @joao souza', players).sort()).toEqual(['p1', 'p2']);
  });
  it('returns [] when there are no mentions', () => {
    expect(resolveMentionIds('sem mencao aqui', players)).toEqual([]);
  });
});

describe('mergeMessages', () => {
  it('de-duplicates by id and keeps time order', () => {
    const a = [{ id: 1, created_at: '2026-06-12T10:00:00Z' }];
    const incoming = [
      { id: 2, created_at: '2026-06-12T10:02:00Z' },
      { id: 1, created_at: '2026-06-12T10:00:00Z' }, // dup
      { id: 3, created_at: '2026-06-12T10:01:00Z' },
    ];
    expect(mergeMessages(a, incoming).map((m) => m.id)).toEqual([1, 3, 2]);
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
