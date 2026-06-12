import { useState, useEffect } from 'react';
import { C } from '../theme/palette.js';
import { API } from '../lib/api.js';
import { inputStyle, primaryBtn, ghostBtn, dangerBtn, card } from './ui.js';

// Admin: manage the player roster. In the scoreline-prediction game the picks
// themselves are made by each player on the Predict tab (stored in score_picks),
// so this panel only handles the roster: rename and delete. The legacy 1st/2nd
// group picks + champion bet were removed with the old scoring model.
const emptyForm = { id: null, name: '', phone: '' };

export function PlayersEditor({ players, refresh }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const list = Object.values(players);

  // The app loads the roster BEFORE admin sign-in, so it arrives phone-less
  // (the API only reveals phones to admins). Re-fetch once on mount, now that
  // the admin token is present, so each player's number shows up.
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const edit = (p) => { setForm({ id: p.id, name: p.name || '', phone: p.phone || '' }); setMsg(''); };

  const save = async () => {
    if (!form.name.trim()) { setMsg('✗ Name required'); return; }
    setSaving(true);
    setMsg('');
    try {
      // Preserve any existing picks on the player; name/phone change here.
      const existing = form.id ? players[form.id] : null;
      await API.savePlayer({
        id: form.id || `p_${Date.now()}`,
        name: form.name.trim(),
        // Phone is optional; only sent when filled (backend keeps the old one
        // when omitted). Lets the admin re-attach a player to the number they
        // actually type at the gate.
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        picks: (existing && existing.picks) || {},
      });
      await refresh();
      setForm(emptyForm);
      setMsg('✓ Saved');
    } catch (e) {
      setMsg(`✗ ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    // eslint-disable-next-line no-alert
    if (!confirm(`Delete ${p.name || p.id}? This permanently removes them and all their picks.`)) return;
    setMsg('');
    try {
      await API.deletePlayer(p.id);
      await refresh();
      setMsg(`✓ Deleted ${p.name || p.id}`);
    } catch (e) {
      // 404 = already gone on the server; still refresh so the row disappears.
      if (e && (e.status === 404 || e.statusCode === 404)) {
        await refresh();
        setMsg(`✓ ${p.name || p.id} was already removed`);
      } else {
        setMsg(`✗ Delete failed: ${(e && e.message) || 'unknown error'} — are you still signed in as admin?`);
      }
    }
  };

  return (
    <div style={card}>
      <h3 style={{ marginTop: 0, color: C.gold2 }}>Players</h3>
      <p style={{ color: C.muted, fontSize: 13, marginTop: 0 }}>
        Rename or remove players. Score predictions are made by each player on the Predict tab.
      </p>

      {list.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {list.map((p) => (
            <div
              key={p.id}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${C.line}` }}
            >
              <span>
                {p.name || p.id}
                {/* phone is only present for admins (the API hides it publicly) */}
                <span style={{ color: C.muted, fontSize: 12, marginLeft: 8 }}>
                  {p.phone || (p.phone_digits ? p.phone_digits : '· no phone')}
                </span>
              </span>
              <span style={{ display: 'flex', gap: 8 }}>
                <button style={ghostBtn} onClick={() => edit(p)}>Edit</button>
                <button style={dangerBtn} onClick={() => remove(p)}>Delete</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {!form.id && msg && (
        <span style={{ color: msg.startsWith('✓') ? C.good : C.bad, fontSize: 13 }}>{msg}</span>
      )}

      {/* Edit opens a centered pop-up (the list is long, so an inline form below
          it would render off-screen and look like nothing happened). */}
      {form.id && (
        <div style={overlayStyle} onClick={() => { setForm(emptyForm); setMsg(''); }}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h4 style={{ color: C.gold2, marginTop: 0 }}>Edit player</h4>
            <label style={{ fontSize: 12, color: C.ink }}>
              Name
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                style={inputStyle}
                placeholder="Player name"
                autoFocus
              />
            </label>
            <label style={{ fontSize: 12, color: C.ink, display: 'block', marginTop: 10 }}>
              Phone (US) — the number this player types to sign in
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                style={inputStyle}
                placeholder="(703) 475-0304"
                inputMode="tel"
              />
            </label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              <button style={primaryBtn} onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Update player'}
              </button>
              <button style={ghostBtn} onClick={() => { setForm(emptyForm); setMsg(''); }}>
                Cancel
              </button>
            </div>
            {msg && <p style={{ color: msg.startsWith('✓') ? C.good : C.bad, fontSize: 13, marginBottom: 0 }}>{msg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20,
};
const modalStyle = {
  background: 'linear-gradient(180deg, #0d1b3a, #0a1733)',
  border: '1px solid rgba(255,255,255,.15)', borderRadius: 16,
  padding: 22, width: '100%', maxWidth: 380,
};

export default PlayersEditor;
