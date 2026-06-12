// Dashboard tab: needs the player's picks, so it requires the phone token.
// If not signed in, reuse PhoneLogin; otherwise show DashboardView.
import { useState, useEffect, useCallback } from 'react';
import { API } from '../lib/api.js';
import { getPlayerToken, setPlayerToken, getPlayerInfo, setPlayerInfo } from '../auth/usePhoneAuth.js';
import PhoneLogin from '../components/PhoneLogin.jsx';
import InstallApp from '../components/InstallApp.jsx';
import DashboardView from './DashboardView.jsx';

export default function DashboardTab({ matches, standings = {} }) {
  const [token, setToken] = useState(() => getPlayerToken());
  const [myPicks, setMyPicks] = useState({});

  const load = useCallback(async (tk) => {
    if (!tk) return;
    try {
      const res = await API.myScorePicks(tk);
      const map = {};
      for (const p of res.picks || []) map[p.match_id] = { home: p.pred_home, away: p.pred_away };
      setMyPicks(map);
    } catch {
      setPlayerToken(null); setPlayerInfo(null); setToken(null);
    }
  }, []);

  // Refresh picks + poll (scores update via parent matches every 30s anyway).
  useEffect(() => { load(token); }, [token, load]);

  const onLogin = useCallback(async ({ name, phone }) => {
    let res;
    try { res = await API.phoneLogin(phone); }
    catch (e) {
      if (e && (e.status === 404 || e.statusCode === 404)) {
        if (!name) { const err = new Error('name required'); err.status = 400; throw err; }
        await API.register({ name, phone, picks: {} });
        res = await API.phoneLogin(phone);
      } else throw e;
    }
    setPlayerToken(res.token); setPlayerInfo(res.player); setToken(res.token);
    return res;
  }, []);

  if (!token) {
    return (
      <div className="card" style={{ maxWidth: 420 }}>
        <h2>My Dashboard</h2>
        <p className="hint">Sign in with your phone to see your picks vs the live scores.</p>
        <PhoneLogin onLogin={onLogin} />
      </div>
    );
  }
  return (
    <>
      <InstallApp />
      <DashboardView matches={matches} myPicks={myPicks} standings={standings} />
    </>
  );
}
