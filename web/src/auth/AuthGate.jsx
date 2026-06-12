// Entry gate. Two steps:
//   1) LANGUAGE — pick English or Español (only the first time; the choice is
//      persisted, so returning visitors skip straight to step 2). From here on
//      the whole app — including push notifications — is in that language.
//   2) PHONE — known phone goes straight in; an unknown phone reveals the name
//      fields (First + Last) and registers.
// Wraps the app so nothing shows until the player is identified.
import { useState } from 'react';
import { usePlayerAuth } from './PlayerAuthContext.jsx';
import { normalizeUsPhone } from './usePhoneAuth.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { Logo } from '../components/Logo.jsx';
import { APP_NAME } from '../config/app.js';

// Remembers that the visitor has made an explicit language choice, so we don't
// nag them with the language step on every visit before they're logged in.
const LANG_CHOSEN_KEY = 'usam_lang_chosen';
function langAlreadyChosen() {
  try { return localStorage.getItem(LANG_CHOSEN_KEY) === '1'; } catch { return false; }
}
function rememberLangChosen() {
  try { localStorage.setItem(LANG_CHOSEN_KEY, '1'); } catch { /* ignore */ }
}

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
.gate-langs{display:flex;flex-direction:column;gap:12px;margin-top:6px}
.gate-lang-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;box-sizing:border-box;
  font-size:18px;padding:16px;border-radius:14px;border:1px solid rgba(255,255,255,.2);
  background:rgba(255,255,255,.06);color:#fff;cursor:pointer;font-family:'Archivo Black',sans-serif}
.gate-lang-btn:hover{border-color:var(--gold,#ffd60a)}
.gate-hint{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,.5);text-align:center;margin-top:12px}
`;

export default function AuthGate({ children }) {
  const { token, login } = usePlayerAuth();
  const { t, setLang } = useLang();
  // Start on the language step unless the visitor already picked one before.
  const [step, setStep] = useState(() => (langAlreadyChosen() ? 'phone' : 'lang'));
  const [phone, setPhone] = useState('');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [needName, setNeedName] = useState(false); // revealed after a phone miss
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (token) return children;

  const norm = normalizeUsPhone(phone);
  const fullName = `${first.trim()} ${last.trim()}`.trim();

  const chooseLang = (next) => {
    setLang(next);
    rememberLangChosen();
    setStep('phone');
  };

  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErr('');
    if (!norm) { setErr(t('gateInvalidPhone')); return; }
    if (needName && !fullName) { setErr(t('gateNeedName')); return; }
    setBusy(true);
    try {
      // First attempt: phone only. If new and we don't have a name yet, reveal it.
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

        {step === 'lang' ? (
          <>
            <h2 style={{ marginTop: 0, textAlign: 'center' }}>{t('gateLangTitle')}</h2>
            <div className="gate-langs">
              <button type="button" className="gate-lang-btn" onClick={() => chooseLang('en')}>
                🇺🇸 {t('gateEnglish')}
              </button>
              <button type="button" className="gate-lang-btn" onClick={() => chooseLang('es')}>
                🇲🇽 {t('gateSpanish')}
              </button>
            </div>
            <p className="gate-hint">{t('gateLangHint')}</p>
          </>
        ) : (
          <>
            <h2 style={{ marginTop: 0 }}>{APP_NAME}</h2>
            <p className="hint">{t('gatePhonePrompt')}</p>
            <form className="gate-form" onSubmit={submit} noValidate>
              <div>
                <label>{t('gatePhoneLabel')}</label>
                <input
                  className="gate-input" type="tel" inputMode="tel" autoComplete="tel"
                  placeholder="(555) 123-4567" value={phone}
                  onChange={(e) => { setPhone(e.target.value); if (err) setErr(''); }}
                  disabled={busy}
                />
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
          </>
        )}
      </div>
    </div>
  );
}
