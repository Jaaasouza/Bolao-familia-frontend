// Compact pool chat. A fixed-size box (doesn't grow or resize) whose message
// list scrolls up/down. Reused on two channels:
//   - channel="live"    → in-game banter; the backend wipes it when a game ends.
//   - channel="ranking" → leaderboard chat; persists.
// Logged-in participants post and read; the list polls every few seconds.
import { useState, useEffect, useRef, useCallback } from 'react';
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
.chat-form{display:flex;gap:8px;margin-top:8px}
.chat-input{flex:1;box-sizing:border-box;font-size:16px;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#fff}
.chat-input:focus{outline:none;border-color:var(--gold,#ffd60a)}
.chat-err{color:#ff6b6b;font-size:13px;font-family:'JetBrains Mono',monospace;margin-top:6px}
`;

export default function ChatView({ channel = 'live', title, hint, bare = false }) {
  const { t, lang } = useLang();
  const { isAdmin } = useAuth();
  const token = getPlayerToken();
  const me = getPlayerInfo();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const listRef = useRef(null);
  const atBottomRef = useRef(true);

  // Full refresh each poll (≤100 rows) so server-side wipes and admin deletes
  // reflect without a manual reload.
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

  // Auto-scroll to the newest message, but only if already at the bottom.
  useEffect(() => {
    const el = listRef.current;
    if (el && atBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const send = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setErr('');
    atBottomRef.current = true;
    try {
      const res = await API.chatPost(body.slice(0, MAX_LEN), token, channel);
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
                  <div className="chat-body">{m.body}</div>
                </div>
              );
            })
          )}
        </div>

        <form className="chat-form" onSubmit={send}>
          <input
            className="chat-input" type="text" maxLength={MAX_LEN}
            placeholder={t('chatPlaceholder')} value={text}
            onChange={(e) => setText(e.target.value)} disabled={sending}
          />
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
