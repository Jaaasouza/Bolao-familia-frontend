// Tracks whether the logged-in player still has matches they haven't predicted.
//
// This drives the landing tab (see App.jsx): whenever there are pending
// predictions — at app open, or after a new phase opens — we land the player on
// the Predict screen so nobody forgets to pick. Once every open match is in, the
// app falls back to the Dashboard.
import { useState, useEffect, useCallback } from 'react';
import { API } from '../lib/api.js';
import { normalizeMatches } from '../components/teams/teamStats.js';
import { isMatchOpen, matchReady } from '../views/PredictView.jsx';

// Pure: does this player still have an open, ready-to-pick match with no pick?
// `pickedIds` is a set-like map keyed by match id. Mirrors the `fillable` rule in
// PredictView (open + teams known + not already submitted).
export function hasPendingPredictions(matches = [], pickedIds = {}) {
  return normalizeMatches(matches).some(
    (m) => isMatchOpen(m) && matchReady(m) && !pickedIds[m.id],
  );
}

export function usePendingPredictions(token, matches) {
  // null until the first fetch resolves, so callers can wait before deciding.
  const [pickedIds, setPickedIds] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) { setPickedIds({}); setLoaded(true); return; }
    try {
      const res = await API.myScorePicks(token);
      const ids = {};
      for (const p of res.picks || []) ids[p.match_id] = true;
      setPickedIds(ids);
    } catch {
      // No token / expired / offline → treat as "nothing picked"; the landing
      // logic still gets a definitive answer instead of hanging.
      setPickedIds({});
    } finally {
      setLoaded(true);
    }
  }, [token]);

  useEffect(() => { setLoaded(false); refresh(); }, [refresh]);

  const hasPending = loaded && hasPendingPredictions(matches || [], pickedIds || {});
  return { hasPending, loaded, refresh };
}
