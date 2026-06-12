import React from 'react'
import ReactDOM from 'react-dom/client'
import './theme/global.css'
import App from './App'
import { LanguageProvider } from './i18n/LanguageContext'
import { AuthProvider } from './auth/AuthContext'
import { PlayerAuthProvider } from './auth/PlayerAuthContext.jsx'
import AuthGate from './auth/AuthGate.jsx'
import TvView from './views/TvView.jsx'
import { APP_NAME } from './config/app.js'

// Brand the document title from the configured app name (per-deploy override).
if (typeof document !== 'undefined' && APP_NAME) document.title = APP_NAME

// Public TV / kiosk mode — reachable at /tv (or /?tv=1). No login, no providers
// beyond language; just live scores + leaderboard for a screen in the room.
const path = window.location.pathname.replace(/\/+$/, '');
const isTv = path === '/tv' || new URLSearchParams(window.location.search).has('tv');

// Register the service worker (enables PWA install on Android + future push).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* ignore */ });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      {isTv ? (
        <TvView />
      ) : (
        <AuthProvider>
          <PlayerAuthProvider>
            <AuthGate>
              <App />
            </AuthGate>
          </PlayerAuthProvider>
        </AuthProvider>
      )}
    </LanguageProvider>
  </React.StrictMode>
)
