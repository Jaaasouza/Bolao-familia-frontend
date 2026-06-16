// Compact pool chat. A fixed-size box (doesn't grow or resize) whose message
// list scrolls up/down. Reused on two channels:
//   - channel="live"    → in-game banter; the backend wipes it when a game ends.
//   - channel="ranking" → leaderboard chat; persists.
// Supports @mentions: type "@" + a name to autocomplete a participant; the
// mentioned player gets a push notification (if they enabled notifications).
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLang } from '../i18n/LanguageContext.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { API } from '../lib/api.js';
import { getPlayerToken, getPlayerInfo } from '../auth/usePhoneAuth.js';

const POLL_MS = 5000;
const MAX_LEN = 500;

// hh:mm in the active locale. Exported for unit tests.
export function timeLabel(iso, lang) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(lang === 'pt' ? 'pt-BR' : 'en', { hour: '2-digit', minute: '2-digit' });
}

// Merge new messages into the list, de-duplicated by id, kept time-ordered.
export function mergeMessages(existing, incoming) {
  const byId = new Map(existing.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort(
    (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0),
  );
}

// The active "@token" being typed before the caret, or null. Used to drive the
// mention autocomplete. The "@" must start a word (be at the start or follow a
// space) and the token can't contain a space.
export function mentionQuery(text, caret) {
  const upto = String(text == null ? '' : text).slice(0, caret);
  const at = upto.lastIndexOf('@');
  if (at < 0) return null;
  const before = at === 0 ? ' ' : upto[at - 1];
  if (!/\s/.test(before)) return null;
  const frag = upto.slice(at + 1);
  if (/\s/.test(frag)) return null;
  return { query: frag, start: at, end: caret };
}

// Player ids whose "@Name" appears in the text (case-insensitive).
export function resolveMentionIds(text, players = []) {
  const low = String(text || '').toLowerCase();
  const ids = [];
  for (const p of players) {
    if (p && p.name && low.includes(`@${String(p.name).toLowerCase()}`)) ids.push(p.id);
  }
  return [...new Set(ids)];
}

// Render a message body with @mentions highlighted. `names` should be sorted
// longest-first so multi-word names match greedily.
function renderBody(body, names) {
  const text = String(body || '');
  const nodes = [];
  let i = 0; let key = 0;
  while (i < text.length) {
    const at = text.indexOf('@', i);
    if (at < 0) { nodes.push(text.slice(i)); break; }
    if (at > i) nodes.push(text.slice(i, at));
    const rest = text.slice(at + 1).toLowerCase();
    const match = names.find((n) => rest.startsWith(n.toLowerCase()));
    if (match) {
      nodes.push(<span className="chat-at" key={key++}>@{text.slice(at + 1, at + 1 + match.length)}</span>);
      i = at + 1 + match.length;
    } else {
      nodes.push('@');
      i = at + 1;
    }
  }
  return nodes;
}

const CHAT_CSS = `
.chat-block{margin:8px 0 14px;padding:12px 14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:12px}
.chat-h{font-family:'Anton',sans-serif;font-size:14px;letter-spacing:.04em;color:var(--gold,#ffd60a);margin-bottom:3px}
.chat-sub{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,.5);margin:0 0 8px}
.chat-wrap{display:flex;flex-direction:column;height:180px}
.chat-list{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;gap:7px;padding:4px 2px}
.chat-empty{margin:auto;color:rgba(255,255,255,.5);font-family:'JetBrains Mono',monospace;font-size:13px;text-align:center}
.chat-msg{max-width:84%;padding:6px 10px;border-radius:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);align-self:flex-start}
.chat-msg.mine{align-self:flex-end;background:linear-gradient(135deg,rgba(255,214,10,.16),rgba(251,86,7,.10));border-color:rgba(255,214,10,.3)}
.chat-meta{display:flex;gap:8px;align-items:baseline;margin-bottom:2px}
.chat-name{font-family:'Archivo Black',sans-serif;font-size:12px;color:var(--gold,#ffd60a)}
.chat-msg.mine .chat-name{color:var(--orange,#fb5607)}
.chat-time{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,.4)}
.chat-del{margin-left:auto;background:none;border:none;color:rgba(255,255,255,.4);cursor:pointer;font-size:12px;line-height:1}
.chat-del:hover{color:#ff6b6b}
.chat-body{font-size:14px;line-height:1.3;word-wrap:break-word;white-space:pre-wrap}
.chat-at{color:var(--gold,#ffd60a);font-weight:700}
.chat-form{display:flex;gap:8px;margin-top:8px;align-items:stretch}
.chat-form .primary{width:auto;flex:0 0 auto;padding:10px 16px;font-size:14px;border-radius:10px;white-space:nowrap}
.chat-inwrap{flex:1 1 auto;min-width:0;position:relative}
.chat-input{width:100%;box-sizing:border-box;font-size:16px;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#fff}
.chat-input:focus{outline:none;border-color:var(--gold,#ffd60a)}
.chat-suggest{position:absolute;left:0;right:0;bottom:calc(100% + 6px);background:#0d1b3a;border:1px solid rgba(255,255,255,.2);border-radius:10px;overflow:hidden;z-index:30;box-shadow:0 8px 24px rgba(0,0,0,.5)}
.chat-suggest-item{display:block;width:100%;text-align:left;background:none;border:none;color:#fff;padding:9px 12px;cursor:pointer;font-size:14px}
.chat-suggest-item:hover,.chat-suggest-item.on{background:rgba(255,214,10,.15)}
.chat-err{color:#ff6b6b;font-size:13px;font-family:'JetBrains Mono',monospace;margin-top:6px}
`;

export default function ChatView({ channel = 'live', title, hint, bare = false }) {
  const { t, lang } = useLang();
  const { isAdmin } = useAuth();
  const token = getPlayerToken();
  const me = getPlayerInfo();

  const [messages, setMessages] = useState([]);
  const [players, setPlayers] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const [suggest, setSuggest] = useState(null); // { query, start, end } | null
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const atBottomRef = useRef(true);

  // Names sorted longest-first for greedy @mention highlighting.
  const names = useMemo(
    () => players.map((p) => p.name).filter(Boolean).sort((a, b) => b.length - a.length),
    [players],
  );

  // Roster for @mentions (everyone on the leaderboard).
  useEffect(() => {
    let alive = true;
    API.scoreLeaderboard()
      .then((d) => { if (alive) setPlayers((d.leaderboard || []).map((r) => ({ id: r.id, name: r.name }))); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await API.chatList(token, channel);
      if (res && Array.isArray(res.messages)) {
        setMessages((cur) => {
          const next = res.messages;
          const unchanged = next.length === cur.length
            && next[next.length - 1]?.id === cur[cur.length - 1]?.id
            && next[0]?.id === cur[0]?.id;
          return unchanged ? cur : next;
        });
      }
    } catch {
      /* transient — next poll retries */
    }
  }, [token, channel]);

  useEffect(() => {
    if (!token) return undefined;
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [token, load]);

  useEffect(() => {
    const el = listRef.current;
    if (el && atBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const suggestions = useMemo(() => {
    if (!suggest) return [];
    const q = suggest.query.toLowerCase();
    return players
      .filter((p) => p.name && (!me || p.id !== me.id) && p.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [suggest, players, me]);

  const onType = (e) => {
    const v = e.target.value;
    setText(v);
    if (err) setErr('');
    setSuggest(mentionQuery(v, e.target.selectionStart ?? v.length));
  };

  const pickMention = (p) => {
    if (!suggest) return;
    const next = `${text.slice(0, suggest.start)}@${p.name} ${text.slice(suggest.end)}`;
    setText(next);
    setSuggest(null);
    const caret = suggest.start + p.name.length + 2; // '@' + name + ' '
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) { el.focus(); try { el.setSelectionRange(caret, caret); } catch { /* ignore */ } }
    });
  };

  const send = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setErr('');
    setSuggest(null);
    atBottomRef.current = true;
    try {
      const mentions = resolveMentionIds(body, players);
      const res = await API.chatPost(body.slice(0, MAX_LEN), token, channel, mentions);
      if (res && res.message) setMessages((cur) => mergeMessages(cur, [res.message]));
      setText('');
    } catch (e2) {
      setErr((e2 && e2.message) || t('chatFailed'));
    } finally {
      setSending(false);
    }
  };

  const remove = async (id) => {
    try {
      await API.chatDelete(id);
      setMessages((cur) => cur.filter((m) => m.id !== id));
    } catch { /* ignore */ }
  };

  if (!token) return null;

  return (
    <div className={bare ? 'chat-block' : 'card'}>
      <style>{CHAT_CSS}</style>
      <div className="chat-h">{title || t('chatRankTitle')}</div>
      {hint && <div className="chat-sub">{hint}</div>}

      <div className="chat-wrap">
        <div className="chat-list" ref={listRef} onScroll={onScroll}>
          {messages.length === 0 ? (
            <div className="chat-empty">{t('chatEmpty')}</div>
          ) : (
            messages.map((m) => {
              const mine = me && m.player_id && m.player_id === me.id;
              return (
                <div key={m.id} className={`chat-msg${mine ? ' mine' : ''}`}>
                  <div className="chat-meta">
                    <span className="chat-name">{mine ? t('chatYou') : (m.name || '—')}</span>
                    <span className="chat-time">{timeLabel(m.created_at, lang)}</span>
                    {isAdmin && (
                      <button type="button" className="chat-del" title="delete" onClick={() => remove(m.id)}>✕</button>
                    )}
                  </div>
                  <div className="chat-body">{renderBody(m.body, names)}</div>
                </div>
              );
            })
          )}
        </div>

        <form className="chat-form" onSubmit={send}>
          <div className="chat-inwrap">
            {suggestions.length > 0 && (
              <div className="chat-suggest">
                {suggestions.map((p) => (
                  <button
                    key={p.id} type="button" className="chat-suggest-item"
                    onMouseDown={(ev) => { ev.preventDefault(); pickMention(p); }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            <input
              ref={inputRef} className="chat-input" type="text" maxLength={MAX_LEN}
              placeholder={t('chatPlaceholder')} value={text}
              onChange={onType} onBlur={() => setTimeout(() => setSuggest(null), 120)} disabled={sending}
            />
          </div>
          <button type="submit" className="primary" disabled={sending || !text.trim()}>
            {t('chatSend')}
          </button>
        </form>
        {err && <div className="chat-err" role="alert">{err}</div>}
      </div>
    </div>
  );
}

export { ChatView };
