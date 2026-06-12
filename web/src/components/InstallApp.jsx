// "Install as an app" helper shown right after a player signs in.
//
// Detects the platform and shows the right path:
//   - Android/desktop Chrome: fires the native beforeinstallprompt ("Install").
//   - iOS Safari: a short step-by-step (Share → Add to Home Screen), since iOS
//     has no install API.
// Also offers a notifications opt-in checkbox. Web push only works on iOS once
// the app is on the Home Screen, so the copy nudges install first. The actual
// push subscription is wired in a later phase; here we just capture intent and
// (where supported) request permission.
import { useEffect, useState } from 'react';
import { enablePush, disablePush, pushSupported } from '../lib/push.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { APP_NAME } from '../config/app.js';

const IA_TXT = {
  en: {
    install: '📲 Install the app',
    iosLead: `Add ${APP_NAME} to your Home Screen for one-tap access and match alerts:`,
    iosShare: 'Tap the', iosShareBtn: 'Share button in Safari',
    iosAdd: 'Choose', iosAddBtn: 'Add to Home Screen', iosDone: 'Tap', iosDoneBtn: 'Add — done!',
    installed: '✓ Installed! Open it from your home screen.',
    androidLead: `Add ${APP_NAME} to your device for one-tap access and match alerts.`,
    androidBtn: 'Install as app',
    browserLead: 'Use your browser menu →', browserBtn: 'Install app', browserOr: '/', browserAdd: 'Add to Home screen', browserTail: 'for one-tap access.',
    alerts: '🔔 Match alerts',
    notify: '🔔 Notify me of my points after each match I picked.',
    enabled: '✓ Notifications enabled',
    blocked: 'Notifications are blocked in your settings — enable them for this site to get alerts.',
    iosNote: 'On iPhone, notifications work after you add the app to your Home Screen.',
  },
  es: {
    install: '📲 Instala la app',
    iosLead: `Añade ${APP_NAME} a tu pantalla de inicio para acceso con un toque y avisos de partidos:`,
    iosShare: 'Toca el', iosShareBtn: 'botón Compartir en Safari',
    iosAdd: 'Elige', iosAddBtn: 'Añadir a inicio', iosDone: 'Toca', iosDoneBtn: 'Añadir — ¡listo!',
    installed: '✓ ¡Instalada! Ábrela desde tu pantalla de inicio.',
    androidLead: `Añade ${APP_NAME} a tu dispositivo para acceso con un toque y avisos de partidos.`,
    androidBtn: 'Instalar como app',
    browserLead: 'Usa el menú de tu navegador →', browserBtn: 'Instalar app', browserOr: '/', browserAdd: 'Añadir a inicio', browserTail: 'para acceso con un toque.',
    alerts: '🔔 Avisos de partidos',
    notify: '🔔 Avísame de mis puntos después de cada partido que pronostiqué.',
    enabled: '✓ Notificaciones activadas',
    blocked: 'Las notificaciones están bloqueadas en tus ajustes — actívalas para este sitio para recibir avisos.',
    iosNote: 'En iPhone, las notificaciones funcionan después de añadir la app a la pantalla de inicio.',
  },
};

// --- platform detection (best-effort, from the user agent + display mode) ---
function detectPlatform() {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS
  if (isIOS) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches
    || window.navigator.standalone === true; // iOS Safari
}

const IA_CSS = `
.ia-card{margin-top:16px;max-width:420px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:14px 16px}
.ia-h{display:flex;align-items:center;gap:8px;font-family:'Archivo Black',sans-serif;font-size:14px;color:#fff;margin-bottom:6px}
.ia-p{font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.5;color:rgba(255,255,255,.7);margin:0 0 12px}
.ia-btn{width:100%;box-sizing:border-box;border:none;border-radius:12px;padding:13px;cursor:pointer;
  font-family:'Archivo Black',sans-serif;font-size:14px;letter-spacing:.04em;
  background:linear-gradient(135deg,var(--gold,#ffd60a),var(--orange,#fb5607));color:#0a1733}
.ia-btn:disabled{opacity:.5;cursor:default}
.ia-steps{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-direction:column;gap:10px}
.ia-steps li{display:flex;align-items:center;gap:10px;font-size:13px;color:#fff}
.ia-num{flex:none;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:var(--gold,#ffd60a);color:#0a1733;font-family:'Anton',sans-serif;font-size:13px}
.ia-share{font-size:17px}
.ia-check{display:flex;align-items:flex-start;gap:10px;margin-top:12px;cursor:pointer;font-size:13px;color:rgba(255,255,255,.85);line-height:1.4}
.ia-check input{margin-top:2px;width:18px;height:18px;accent-color:var(--gold,#ffd60a);flex:none}
.ia-note{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,.5);margin-top:8px}
.ia-done{color:var(--lime,#8ac926);font-size:13px;font-family:'JetBrains Mono',monospace;margin-top:6px}
`;

export default function InstallApp() {
  const { lang } = useLang();
  const X = IA_TXT[lang] || IA_TXT.en;
  const [platform] = useState(detectPlatform);
  const [standalone] = useState(isStandalone);
  const [deferred, setDeferred] = useState(null); // Android beforeinstallprompt event
  const [installed, setInstalled] = useState(false);
  const [wantNotify, setWantNotify] = useState(false);
  const [notifyState, setNotifyState] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  );

  // Capture Android/desktop Chrome's install prompt.
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Reflect an existing subscription so the toggle shows as already-on.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!pushSupported() || Notification.permission !== 'granted') return;
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled && sub) setWantNotify(true);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const androidInstall = async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch { /* ignore */ }
    setDeferred(null);
  };

  const toggleNotify = async (checked) => {
    setWantNotify(checked);
    if (!checked) { disablePush().catch(() => {}); return; }
    // Ask permission (where supported) then subscribe this browser+player.
    let perm = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
    if (perm === 'default') {
      try { perm = await Notification.requestPermission(); } catch { /* ignore */ }
    }
    setNotifyState(perm);
    if (perm === 'granted') {
      try { await enablePush(); } catch { /* ignore — subscribe best-effort */ }
    }
  };

  const NotifyCheckbox = (
    <>
      <label className="ia-check">
        <input type="checkbox" checked={wantNotify} onChange={(e) => toggleNotify(e.target.checked)} />
        <span>{X.notify}</span>
      </label>
      {wantNotify && notifyState === 'granted' && <div className="ia-done">{X.enabled}</div>}
      {wantNotify && notifyState === 'denied' && (
        <div className="ia-note">{X.blocked}</div>
      )}
      {platform === 'ios' && !standalone && (
        <div className="ia-note">{X.iosNote}</div>
      )}
    </>
  );

  // The install block is only relevant in a browser tab (hidden once the app is
  // already installed / running standalone). The notifications opt-in is ALWAYS
  // shown so it's reachable from inside the installed app too.
  const InstallSection = platform === 'ios' ? (
    <>
      <div className="ia-h">{X.install}</div>
      <p className="ia-p">{X.iosLead}</p>
      <ol className="ia-steps">
        <li><span className="ia-num">1</span> {X.iosShare} <span className="ia-share">⎙</span> {X.iosShareBtn}</li>
        <li><span className="ia-num">2</span> {X.iosAdd} <b>{X.iosAddBtn}</b></li>
        <li><span className="ia-num">3</span> {X.iosDone} <b>{X.iosDoneBtn}</b></li>
      </ol>
    </>
  ) : (
    <>
      <div className="ia-h">{X.install}</div>
      {installed ? (
        <p className="ia-p">{X.installed}</p>
      ) : deferred ? (
        <>
          <p className="ia-p">{X.androidLead}</p>
          <button type="button" className="ia-btn" onClick={androidInstall}>{X.androidBtn}</button>
        </>
      ) : (
        <p className="ia-p">{X.browserLead} <b>{X.browserBtn}</b> {X.browserOr} <b>{X.browserAdd}</b> {X.browserTail}</p>
      )}
    </>
  );

  return (
    <div className="ia-card">
      <style>{IA_CSS}</style>
      {!standalone && InstallSection}
      {standalone && <div className="ia-h">{X.alerts}</div>}
      {NotifyCheckbox}
    </div>
  );
}

export { InstallApp, detectPlatform, isStandalone };
