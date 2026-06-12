import { useState } from 'react';
import { C } from '../theme/palette.js';
import { API } from '../lib/api.js';
import { PlayersEditor } from './PlayersEditor.jsx';
import { primaryBtn, ghostBtn, inputStyle, card } from './ui.js';

// Convert an ISO string to the value a <input type="datetime-local"> expects
// (local time, no seconds): "YYYY-MM-DDTHH:MM".
function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function DeadlineEditor({ config, refresh }) {
  const [value, setValue] = useState(toLocalInput(config?.picksDeadline));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async (iso) => {
    setBusy(true);
    setMsg('');
    try {
      await API.saveConfig({ picksDeadline: iso });
      await refresh();
      setMsg('✓ Saved');
    } catch (e) {
      setMsg(`✗ ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={card}>
      <h3 style={{ marginTop: 0, color: C.gold2 }}>Picks deadline</h3>
      <p style={{ color: C.muted, fontSize: 13, marginTop: 0 }}>
        Registration closes at this moment. Default is the opener kickoff (Jun 11, 2026).
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ ...inputStyle, maxWidth: 240 }}
        />
        <button
          style={primaryBtn}
          disabled={busy || !value}
          onClick={() => save(new Date(value).toISOString())}
        >
          {busy ? 'Saving…' : 'Save deadline'}
        </button>
        <button style={ghostBtn} disabled={busy} onClick={() => { setValue(''); save(null); }}>
          Clear (no deadline)
        </button>
        {msg && <span style={{ color: msg.startsWith('✓') ? C.good : C.bad, fontSize: 13 }}>{msg}</span>}
      </div>
    </div>
  );
}

function SyncButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const run = async () => {
    setBusy(true);
    setMsg('');
    try {
      const r = await API.syncNow();
      setMsg(`✓ Synced ${r.count ?? 0} matches`);
    } catch (e) {
      setMsg(`✗ ${e.message}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div style={{ ...card, display: 'flex', gap: 12, alignItems: 'center' }}>
      <button style={primaryBtn} onClick={run} disabled={busy}>
        {busy ? 'Syncing…' : '🔄 Sync matches now'}
      </button>
      {msg && <span style={{ color: msg.startsWith('✓') ? C.good : C.bad, fontSize: 13 }}>{msg}</span>}
      <span style={{ color: C.muted, fontSize: 12 }}>(also runs automatically every minute)</span>
    </div>
  );
}

export function AdminPanel({ isAdmin, phases, standings, players, config, refresh }) {
  if (!isAdmin) {
    return (
      <div style={card}>
        <p style={{ color: C.inkDim }}>
          Log in as admin (button at the top right) to sync matches, set the picks
          deadline and manage players.
        </p>
      </div>
    );
  }
  return (
    <div>
      <SyncButton />
      <DeadlineEditor config={config} refresh={refresh} />
      <PlayersEditor players={players} refresh={refresh} />
    </div>
  );
}

export default AdminPanel;
