// Entry gate — PHONE FIRST. The very first thing we ask is the phone:
//   - a KNOWN phone logs straight in (returning players land on their Dashboard;
//     no name needed);
//   - an UNKNOWN phone reveals the name fields (First + Last) to register.
// Language defaults to Portuguese and can be switched anytime in the footer, so
// there's no separate language step blocking the phone.
// Wraps the app so nothing shows until the player is identified.
import { useState } from 'react';
import { usePlayerAuth } from './PlayerAuthContext.jsx';
import { normalizePhone, PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY } from './usePhoneAuth.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { Logo } from '../components/Logo.jsx';
import { APP_NAME } from '../config/app.js';

const GATE_CSS = `
.gate-bg{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.gate-card{width:100%;max-width:380px}
.gate-logo{display:flex;justify-content:center;margin-bottom:10px}
.gate-logo svg{filter:drop-shadow(0 6px 16px rgba(0,0,0,.4))}
.gate-form{display:flex;flex-direction:column;gap:14px}
.gate-names{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.gate-form label{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.6);display:block;margin-bottom:6px}
.gate-input{width:100%;box-sizing:border-box;font-size:17px;padding:13px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#fff}
.gate-input:focus{outline:none;border-color:var(--gold,#ffd60a)}
.gate-pretty{font-size:13px;color:rgba(255,255,255,.55);min-height:16px}
.gate-err{color:#ff6b6b;font-size:13px;font-family:'JetBrains Mono',monospace}
.gate-new{background:rgba(255,214,10,.08);border:1px solid rgba(255,214,10,.3);border-radius:10px;padding:10px 12px;font-size:13px;color:#fff}
`;

export default function AuthGate({ children }) {
  const { token, login } = usePlayerAuth();
  const { t } = useLang();
  const [country, setCountry] = useState(DEFAULT_PHONE_COUNTRY);
  const [phone, setPhone] = useState('');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [needName, setNeedName] = useState(false); // revealed after a phone miss
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (token) return children;

  const countryMeta = PHONE_COUNTRIES.find((c) => c.code === country) || PHONE_COUNTRIES[0];
  const norm = normalizePhone(phone, country);
  const fullName = `${first.trim()} ${last.trim()}`.trim();

  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErr('');
    if (!norm) { setErr(t('gateInvalidPhone')); return; }
    if (needName && !fullName) { setErr(t('gateNeedName')); return; }
    setBusy(true);
    try {
      // First attempt: phone only. A known phone logs straight in; if it's new
      // (404) and we don't have a name yet, reveal the registration fields.
      await login({ name: fullName, phone: norm.digits });
    } catch (e2) {
      const status = e2 && (e2.status || e2.statusCode);
      if (status === 404 && !needName) {
        setNeedName(true);
        setErr('');
      } else if (status === 423) {
        setErr(t('gateClosed'));
      } else {
        setErr((e2 && e2.message) || t('gateFailed'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="gate-bg">
      <style>{GATE_CSS}</style>
      <div className="gate-card card">
        <div className="gate-logo"><Logo size={72} /></div>

        <h2 style={{ marginTop: 0 }}>{APP_NAME}</h2>
        <p className="hint">{t('gatePhonePrompt')}</p>
        <form className="gate-form" onSubmit={submit} noValidate>
          <div>
            <label>{t('gatePhoneLabel')}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                className="gate-input" style={{ width: 'auto', flex: '0 0 auto' }}
                value={country}
                onChange={(e) => { setCountry(e.target.value); if (err) setErr(''); }}
                disabled={busy} aria-label="País / Country"
              >
                {PHONE_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} +{c.dial}</option>
                ))}
              </select>
              <input
                className="gate-input" type="tel" inputMode="tel" autoComplete="tel"
                placeholder={countryMeta.example} value={phone}
                onChange={(e) => { setPhone(e.target.value); if (err) setErr(''); }}
                disabled={busy} autoFocus
              />
            </div>
            <div className="gate-pretty">{norm ? norm.pretty : ' '}</div>
          </div>

          {needName && (
            <div>
              <div className="gate-new">{t('gateNewHere')}</div>
              <div className="gate-names" style={{ marginTop: 10 }}>
                <div>
                  <label>{t('gateFirstName')}</label>
                  <input
                    className="gate-input" type="text" autoComplete="given-name"
                    placeholder="João" maxLength={24} value={first}
                    onChange={(e) => setFirst(e.target.value)} disabled={busy} autoFocus
                  />
                </div>
                <div>
                  <label>{t('gateLastName')}</label>
                  <input
                    className="gate-input" type="text" autoComplete="family-name"
                    placeholder="Silva" maxLength={24} value={last}
                    onChange={(e) => setLast(e.target.value)} disabled={busy}
                  />
                </div>
              </div>
            </div>
          )}

          {err && <div className="gate-err" role="alert">{err}</div>}

          <button type="submit" className="primary" disabled={busy}>
            {busy ? '…' : needName ? t('gateRegister') : t('gateContinue')}
          </button>
        </form>
      </div>
    </div>
  );
}
