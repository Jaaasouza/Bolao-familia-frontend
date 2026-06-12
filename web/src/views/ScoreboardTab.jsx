// Loads the server-computed scoreline leaderboard and renders ScoreboardView.
import { useState, useEffect } from 'react';
import { API } from '../lib/api.js';
import ScoreboardView from './ScoreboardView.jsx';

export default function ScoreboardTab() {
  const [board, setBoard] = useState([]);

  useEffect(() => {
    let alive = true;
    const load = () => API.scoreLeaderboard()
      .then((r) => { if (alive) setBoard(r.leaderboard || []); })
      .catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return <ScoreboardView leaderboard={board} />;
}
