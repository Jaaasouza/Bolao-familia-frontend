import { useState } from 'react';
import { C } from './theme/palette.js';
import { useAppData } from './data/useAppData.js';
import { useAuth } from './auth/AuthContext.jsx';
import { usePlayerAuth } from './auth/PlayerAuthContext.jsx';
import { useLang } from './i18n/LanguageContext.jsx';
import { Header } from './components/Header.jsx';
import { Tabs, TABS } from './components/Tabs.jsx';
import { MobileDrawer } from './components/MobileDrawer.jsx';
import JoinView from './views/JoinView.jsx';
import RankView from './views/RankView.jsx';
import TeamsView from './views/TeamsView.jsx';
import RulesView from './views/RulesView.jsx';
import LiveTab from './views/LiveTab.jsx';
import MatchesView from './views/MatchesView.jsx';
import PredictTab from './views/PredictTab.jsx';
import ScoreboardTab from './views/ScoreboardTab.jsx';
import DashboardTab from './views/DashboardTab.jsx';
import { AdminPanel } from './admin/AdminPanel.jsx';
import ShareButton from './components/ShareButton.jsx';

// PT/EN switch — lives in the footer now (language is chosen on the entry gate).
function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-switch">
      <button className={'lang-btn' + (lang === 'pt' ? ' active' : '')} onClick={() => setLang('pt')}>PT</button>
      <button className={'lang-btn' + (lang === 'en' ? ' active' : '')} onClick={() => setLang('en')}>EN</button>
    </div>
  );
}

// Admin login/logout control rendered in the footer.
function AdminButton() {
  const { isAdmin, login, logout } = useAuth();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');

  if (isAdmin) {
    return (
      <button className="lang-btn" style={chipStyle} onClick={logout}>
        Admin ✓
      </button>
    );
  }

  return (
    <>
      <button className="lang-btn" style={chipStyle} onClick={() => setOpen(true)}>
        {t('tabAdmin')}
      </button>
      {open && (
        <div style={overlayStyle} onClick={() => setOpen(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{t('adminTitle')}</h3>
            <input
              type="password"
              value={pin}
              placeholder={t('adminPin')}
              onChange={(e) => setPin(e.target.value)}
              style={{ width: '100%' }}
            />
            {err && <p style={{ color: C.bad, fontSize: 13 }}>{err}</p>}
            <button
              className="lang-btn"
              style={{ ...chipStyle, marginTop: 10, width: '100%' }}
              onClick={async () => {
                try {
                  await login(pin);
                  setOpen(false);
                  setPin('');
                  setErr('');
                } catch (e) {
                  setErr(e.message || t('wrongPin'));
                }
              }}
            >
              {t('signIn')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const { isAdmin } = useAuth();
  const { t } = useLang();
  // Brand-new registrations land on Predict (make their picks first); returning
  // players land on their Dashboard.
  const { justRegistered } = usePlayerAuth();
  const [tab, setTab] = useState(() => (justRegistered ? 'predict' : 'dashboard'));
  const { matches, phases, standings, players, config, apiGroups, scorers, standingsTable, loading, error, refresh } = useAppData();

  // Admin tab is admin-only; everyone gets Live (the stadium / pitch view).
  const ADMIN_ONLY = new Set(['admin']);
  const visibleTabs = isAdmin ? TABS : TABS.filter((tb) => !ADMIN_ONLY.has(tb.id));

  return (
    <div className="wrap">
      <Header />

      <Tabs active={tab} onChange={setTab} tabs={visibleTabs} />
      <MobileDrawer active={tab} onChange={setTab} tabs={visibleTabs} />

      {error && <p style={{ color: C.warn }}>⚠ {error}</p>}
      {loading && <p style={{ color: C.muted }}>{t('loading')}</p>}

      {tab === 'join' && <JoinView players={players} onSaved={refresh} config={config} apiGroups={apiGroups} />}
      {tab === 'rank' && (
        <RankView players={players} phases={phases} standings={standings} matches={matches} scorers={scorers} />
      )}
      {tab === 'predict' && <PredictTab matches={matches} standings={standings} />}
      {tab === 'scoreboard' && <ScoreboardTab />}
      {tab === 'dashboard' && <DashboardTab matches={matches} standings={standings} />}
      {tab === 'matches' && <MatchesView matches={matches} />}
      {tab === 'teams' && <TeamsView standingsTable={standingsTable} />}
      {tab === 'rules' && <RulesView />}
      {tab === 'live' && <LiveTab matches={matches} />}
      {tab === 'admin' && (
        <AdminPanel
          isAdmin={isAdmin}
          phases={phases}
          standings={standings}
          players={players}
          config={config}
          refresh={refresh}
        />
      )}

      <footer className="app-footer">
        <span className="live">{t('live')}</span>
        <ShareButton />
        <LangSwitch />
        <AdminButton />
      </footer>
    </div>
  );
}

const chipStyle = {
  border: '1px solid rgba(255,255,255,.2)',
  borderRadius: 30,
};

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
};

const modalStyle = {
  background: 'linear-gradient(180deg, #0d1b3a, #0a1733)',
  border: '1px solid rgba(255,255,255,.15)',
  borderRadius: 16,
  padding: 24,
  width: 300,
};
