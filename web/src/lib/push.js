// Browser-side web-push subscription helper.
// Asks the backend for the VAPID public key, subscribes through the registered
// service worker, and registers that subscription against the logged-in player.
import { API } from './api.js';
import { getPlayerToken } from '../auth/usePhoneAuth.js';

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported() {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && typeof Notification !== 'undefined';
}

// Subscribe the current browser+player for push. Returns true on success.
// Assumes Notification permission is already granted (the UI requests it).
export async function enablePush() {
  if (!pushSupported()) return false;
  const token = getPlayerToken();
  if (!token) return false;

  const { enabled, publicKey } = await API.pushKey().catch(() => ({ enabled: false }));
  if (!enabled || !publicKey) return false;

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  // Tag the subscription with the chosen language so notifications match it.
  let lang = 'en';
  try { const v = localStorage.getItem('usam_lang'); if (v === 'en' || v === 'es') lang = v; } catch { /* ignore */ }
  await API.pushSubscribe(sub.toJSON(), lang, token);
  return true;
}

// Drop this browser's subscription.
export async function disablePush() {
  if (!pushSupported()) return;
  const token = getPlayerToken();
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await API.pushUnsubscribe(sub.endpoint, token).catch(() => {});
    await sub.unsubscribe().catch(() => {});
  }
}
