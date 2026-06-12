import { useState } from 'react';
import { normalizePhone, PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY } from '../auth/usePhoneAuth.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { Logo } from './Logo.jsx';

// First screen of the Predict game: NAME + PHONE (with a Brasil/USA country
// picker). The container's onLogin tries phone login first and, if the phone
// isn't registered yet, registers a new player with this name — so first-timers
// and returning players use one form. (Returning players can leave the name
// blank; it's only required when the phone is new.)
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
  const { t, lang } = useLang();
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [country, setCountry] = useState(DEFAULT_PHONE_COUNTRY);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);

  const countryMeta = PHONE_COUNTRIES.find((c) => c.code === country) || PHONE_COUNTRIES[0];
  const norm = normalizePhone(phone, country);
  const fullName = `${first.trim()} ${last.trim()}`.trim();
  const hint = lang === 'en'
    ? 'New player? Name + phone registers you. Coming back for a new phase? Just your phone.'
    : 'Jogador novo? Nome + telefone faz seu cadastro. Voltando para uma nova fase? Só o telefone.';

  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErr('');
    if (!norm) { setErr(t('gateInvalidPhone')); return; }
    setBusy(true);
    try {
      await onLogin({ name: fullName, phone: norm.digits });
      setOk(true);
    } catch (e2) {
      const status = e2 && (e2.status || e2.statusCode || (e2.response && e2.response.status));
      if (status === 400 && !fullName) setErr(t('gateNewHere'));
      else if (status === 423) setErr(t('gateClosed'));
      else setErr((e2 && e2.message) || t('gateFailed'));
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
            <label>{t('gateFirstName')}</label>
            <input className="pl-input" type="text" autoComplete="given-name"
              placeholder="João" maxLength={24}
              value={first} onChange={(e) => setFirst(e.target.value)} disabled={busy} />
          </div>
          <div className="pl-field">
            <label>{t('gateLastName')}</label>
            <input className="pl-input" type="text" autoComplete="family-name"
              placeholder="Silva" maxLength={24}
              value={last} onChange={(e) => setLast(e.target.value)} disabled={busy} />
          </div>
        </div>
        <div className="pl-field">
          <label>{t('gatePhoneLabel')}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="pl-input" style={{ width: 'auto', flex: '0 0 auto' }}
              value={country} onChange={(e) => { setCountry(e.target.value); if (err) setErr(''); }}
              disabled={busy} aria-label="País / Country">
              {PHONE_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} +{c.dial}</option>
              ))}
            </select>
            <input className="pl-input" type="tel" inputMode="tel" autoComplete="tel"
              placeholder={countryMeta.example}
              value={phone} onChange={(e) => { setPhone(e.target.value); if (err) setErr(''); }} disabled={busy} />
          </div>
          <div className="pl-pretty">{norm ? norm.pretty : ' '}</div>
        </div>
        <p className="hint" style={{ margin: 0 }}>{hint}</p>
        {err && <div className="pl-err" role="alert">{err}</div>}
        {ok && <div className="pl-ok" role="status">✓ {t('signIn')}</div>}
        <button type="submit" className="primary" disabled={busy}>
          {busy ? '…' : t('gateContinue')}
        </button>
      </form>
    </>
  );
}

export { PhoneLogin };
