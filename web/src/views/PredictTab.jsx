// Container for the scoreline-prediction game: phone login → score picks.
// Owns the player token (localStorage), loads the player's existing picks, and
// saves edits via the player-scoped API.
import { useState, useEffect, useCallback } from 'react';
import { API } from '../lib/api.js';
import {
  getPlayerToken, setPlayerToken, getPlayerInfo, setPlayerInfo,
} from '../auth/usePhoneAuth.js';
import PhoneLogin from '../components/PhoneLogin.jsx';
import PredictView from './PredictView.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';

export default function PredictTab({ matches, standings = {}, onPicksChanged }) {
  const { t } = useLang();
  const [token, setToken] = useState(() => getPlayerToken());
  const [player, setPlayer] = useState(() => getPlayerInfo());
  const [myPicks, setMyPicks] = useState({});
  const [lockedPhases, setLockedPhases] = useState([]);

  const loadPicks = useCallback(async (tk) => {
    if (!tk) return;
    try {
      const res = await API.myScorePicks(tk);
      const map = {};
      for (const p of res.picks || []) map[p.match_id] = { home: p.pred_home, away: p.pred_away };
      setMyPicks(map);
      setLockedPhases(res.lockedPhases || []);
    } catch {
      // token expired/invalid → drop it and show login again
      setPlayerToken(null); setPlayerInfo(null); setToken(null); setPlayer(null);
    }
  }, []);

  useEffect(() => { loadPicks(token); }, [token, loadPicks]);

  // onLogin({name, phone}) → logs in by phone; if the phone isn't registered
  // yet, registers a new player with the given name, then logs in. Resolves
  // {token, player}. PhoneLogin awaits this.
  const onLogin = useCallback(async ({ name, phone }) => {
    let res;
    try {
      res = await API.phoneLogin(phone);
    } catch (e) {
      const status = e && (e.status || e.statusCode);
      if (status === 404) {
        // New player — needs a name to register.
        if (!name) { const err = new Error('name required'); err.status = 400; throw err; }
        await API.register({ name, phone, picks: {} });
        res = await API.phoneLogin(phone);
      } else {
        throw e;
      }
    }
    setPlayerToken(res.token);
    setPlayerInfo(res.player);
    setToken(res.token);
    setPlayer(res.player);
    return res;
  }, []);

  // onSubmit(phase, picks) → save the given match picks. Per-match rolling: any
  // subset of not-yet-started matches, editable until each kicks off.
  const onSubmit = useCallback(async (phase, picks) => {
    const res = await API.submitPhase(phase, picks, token);
    await loadPicks(token);
    // Let the app re-evaluate the landing tab (e.g. return to Dashboard once the
    // last pending pick is in).
    if (onPicksChanged) onPicksChanged();
    return res;
  }, [token, loadPicks, onPicksChanged]);

  const logout = () => {
    setPlayerToken(null); setPlayerInfo(null); setToken(null); setPlayer(null); setMyPicks({});
  };

  if (!token) {
    return (
      <div className="card" style={{ maxWidth: 420 }}>
        <h2>Predict Scores</h2>
        <p className="hint">Sign in with your phone to make per-match score predictions.</p>
        <PhoneLogin onLogin={onLogin} />
      </div>
    );
  }

  return (
    <>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>👤 {player ? player.name : t('playerWord')}</span>
        <button className="lang-btn" style={{ border: '1px solid rgba(255,255,255,.2)', borderRadius: 30 }} onClick={logout}>
          {t('switchPlayer')}
        </button>
      </div>
      <PredictView matches={matches} myPicks={myPicks} lockedPhases={lockedPhases} onSubmit={onSubmit} standings={standings} />
    </>
  );
}
