import { useState } from 'react';
import { normalizeUsPhone } from '../auth/usePhoneAuth.js';
import { Logo } from './Logo.jsx';

// First screen of the Predict game: NAME + PHONE. The container's onLogin tries
// phone login first and, if the phone isn't registered yet, registers a new
// player with this name — so first-timers and returning players use one form.
// (Returning players can leave the name blank; it's only required when the phone
// is new.) Labels are literal strings — no i18n keys (they showed as PLTITLE).
const PL_CSS = `
.pl-logo{display:flex;justify-content:center;margin-bottom:6px}
.pl-logo svg{filter:drop-shadow(0 6px 16px rgba(0,0,0,.4))}
.pl-form{display:flex;flex-direction:column;gap:14px;max-width:400px}
.pl-names{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pl-field label{display:block;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.6);margin-bottom:6px}
.pl-input{width:100%;box-sizing:border-box;font-size:17px;padding:13px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#fff}
.pl-input:focus{outline:none;border-color:var(--gold,#ffd60a)}
.pl-pretty{font-size:13px;color:rgba(255,255,255,.55);min-height:16px}
.pl-err{color:#ff6b6b;font-size:13px;font-family:'JetBrains Mono',monospace}
.pl-ok{color:var(--lime,#8ac926);font-size:14px}
`;

export default function PhoneLogin({ onLogin }) {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);

  const norm = normalizeUsPhone(phone);
  const fullName = `${first.trim()} ${last.trim()}`.trim();

  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErr('');
    if (!norm) { setErr('Enter a valid US phone number'); return; }
    setBusy(true);
    try {
      await onLogin({ name: fullName, phone: norm.digits });
      setOk(true);
    } catch (e2) {
      const status = e2 && (e2.status || e2.statusCode || (e2.response && e2.response.status));
      if (status === 400 && !fullName) setErr('New here? Enter your name to register.');
      else if (status === 423) setErr('Registration is closed — the tournament has started.');
      else setErr((e2 && e2.message) || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <style>{PL_CSS}</style>
      <div className="pl-logo"><Logo size={72} /></div>
      <form className="pl-form" onSubmit={submit} noValidate>
        <div className="pl-names">
          <div className="pl-field">
            <label>First name</label>
            <input className="pl-input" type="text" autoComplete="given-name"
              placeholder="João" maxLength={24}
              value={first} onChange={(e) => setFirst(e.target.value)} disabled={busy} />
          </div>
          <div className="pl-field">
            <label>Last name</label>
            <input className="pl-input" type="text" autoComplete="family-name"
              placeholder="Silva" maxLength={24}
              value={last} onChange={(e) => setLast(e.target.value)} disabled={busy} />
          </div>
        </div>
        <div className="pl-field">
          <label>Your phone (US)</label>
          <input className="pl-input" type="tel" inputMode="tel" autoComplete="tel"
            placeholder="(555) 123-4567"
            value={phone} onChange={(e) => { setPhone(e.target.value); if (err) setErr(''); }} disabled={busy} />
          <div className="pl-pretty">{norm ? norm.pretty : ' '}</div>
        </div>
        <p className="hint" style={{ margin: 0 }}>
          New player? Name + phone registers you. Coming back for a new phase? Just your phone.
        </p>
        {err && <div className="pl-err" role="alert">{err}</div>}
        {ok && <div className="pl-ok" role="status">✓ Signed in</div>}
        <button type="submit" className="primary" disabled={busy}>
          {busy ? '…' : 'Continue'}
        </button>
      </form>
    </>
  );
}

export { PhoneLogin };
