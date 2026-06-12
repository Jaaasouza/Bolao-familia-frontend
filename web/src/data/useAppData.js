import { useState, useEffect, useCallback, useRef } from 'react';
import { API } from '../lib/api.js';

// Loads the full pool state from the backend and polls every 30s, mirroring the
// legacy setupAutoSync() behaviour. Returns data + a manual refresh().
export function useAppData(pollMs = 30000) {
  const [data, setData] = useState({
    matches: [],
    phases: {},
    standings: {},
    players: {},
    lastSyncMatches: null,
    config: { picksDeadline: null, registrationOpen: true },
    apiGroups: {},
    scorers: null,
    standingsTable: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timer = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const [state, playersRes, config, groupsRes] = await Promise.all([
        API.state(),
        API.players(),
        API.config().catch(() => ({})),
        API.groups().catch(() => ({})),
      ]);
      setData({
        matches: state.matches || [],
        phases: state.phases || {},
        standings: state.standings || {},
        players: playersRes.players || {},
        lastSyncMatches: state.lastSyncMatches || null,
        config: {
          picksDeadline: config.picksDeadline ?? null,
          registrationOpen: config.registrationOpen ?? true,
        },
        apiGroups: groupsRes.groups || {},
        scorers: state.scorers || null,
        standingsTable: state.standingsTable || null,
      });
      setError(null);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    timer.current = setInterval(refresh, pollMs);
    return () => clearInterval(timer.current);
  }, [refresh, pollMs]);

  return { ...data, loading, error, refresh };
}
