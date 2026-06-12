// Shared player auth (phone-based) for the whole app. The AuthGate uses it to
// require login on entry; PredictTab/DashboardTab read the same token so they
// don't ask again.
import { createContext, useContext, useState, useCallback } from 'react';
import { API } from '../lib/api.js';
import {
  getPlayerToken, setPlayerToken, getPlayerInfo, setPlayerInfo,
} from './usePhoneAuth.js';

const Ctx = createContext(null);

export function PlayerAuthProvider({ children }) {
  const [token, setTok] = useState(() => getPlayerToken());
  const [player, setPlr] = useState(() => getPlayerInfo());
  // True only for a brand-new registration this session, so the app can land
  // them on the Predict tab instead of the Dashboard.
  const [justRegistered, setJustRegistered] = useState(false);

  // login({name, phone}) → phone login; if the phone is new (404), register
  // with the name then log in. Resolves {token, player, isNew}.
  const login = useCallback(async ({ name, phone }) => {
    let res;
    let isNew = false;
    try {
      res = await API.phoneLogin(phone);
    } catch (e) {
      const status = e && (e.status || e.statusCode);
      if (status === 404) {
        if (!name) { const err = new Error('name required'); err.status = 404; throw err; }
        await API.register({ name, phone, picks: {} });
        res = await API.phoneLogin(phone);
        isNew = true;
      } else {
        throw e;
      }
    }
    setPlayerToken(res.token); setPlayerInfo(res.player);
    setTok(res.token); setPlr(res.player);
    setJustRegistered(isNew);
    return { ...res, isNew };
  }, []);

  const logout = useCallback(() => {
    setPlayerToken(null); setPlayerInfo(null); setTok(null); setPlr(null);
    setJustRegistered(false);
  }, []);

  return (
    <Ctx.Provider value={{ token, player, login, logout, justRegistered }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePlayerAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('usePlayerAuth must be used within PlayerAuthProvider');
  return c;
}
