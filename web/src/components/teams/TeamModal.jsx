// Team detail modal — React port of renderModalContent()/openTeamModal().
// Shows team flag + name, group + current phase pills, tournament stats grid,
// match history and the squad. Clicking a squad player opens a PlayerCard.
import { useState } from 'react';
import { GROUPS } from '../../data/teams.js';
import Flag from './Flag.jsx';
import SquadList from './SquadList.jsx';
import PlayerCard from './PlayerCard.jsx';
import {
  computeTeamStats, teamMatchHistory, teamUpcoming, PHASE_LONG, HISTORY_PHASE,
} from './teamStats.js';
import { flagColors } from '../../data/flagColors.js';

function MatchHistoryItem({ m, team }) {
  // Mirrors renderMatchHistoryItem(m, team).
  const isHome = m.home === team;
  const opp = isHome ? m.away : m.home;
  const myScore = isHome ? (Number(m.homeScore) || 0) : (Number(m.awayScore) || 0);
  const oppScore = isHome ? (Number(m.awayScore) || 0) : (Number(m.homeScore) || 0);
  let result = 'draw'; let icon = '🤝';
  if (myScore > oppScore) { result = 'win'; icon = '✅'; }
  else if (myScore < oppScore) { result = 'loss'; icon = '❌'; }
  const phaseLabel = HISTORY_PHASE[m.phase || 'group'] || 'Group';

  const left = isHome ? team : opp;
  const right = isHome ? opp : team;

  return (
    <div className={`match-history-item ${result}`}>
      <span className="result-icon">{icon}</span>
      <span className={`team ${isHome ? '' : 'right'}`}>
        <Flag team={left} size={40} />
        <span className="nm">{left}</span>
      </span>
      <span className="score">{myScore}-{oppScore}</span>
      <span className={`team ${isHome ? 'right' : ''}`}>
        <Flag team={right} size={40} />
        <span className="nm">{right}</span>
      </span>
      <span className="phase-label">{phaseLabel}</span>
    </div>
  );
}

export default function TeamModal({ team, group: groupProp, phases = {}, matches = [], squads = {}, onClose }) {
  const [player, setPlayer] = useState(null);
  if (!team) return null;

  const stats = computeTeamStats(team, matches);
  const phase = phases[team] || 'group';
  const group = groupProp || Object.keys(GROUPS).find((g) => GROUPS[g].includes(team));
  const phaseLabel = PHASE_LONG[phase] || 'Group Stage';
  const phaseClass = phase === 'champion' ? 'phase-pill champion' : 'phase-pill';
  const myMatches = teamMatchHistory(team, matches);
  const upcoming = teamUpcoming(team, matches);
  const squad = squads[team];
  const [c1, c2] = flagColors(team);

  const statBoxes = [
    ['Played', stats.played], ['Won', stats.w], ['Drawn', stats.d],
    ['Lost', stats.l], ['GF', stats.gf], ['Points', stats.pts],
  ];

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div
          className="modal-header"
          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
        >
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
          <div className="modal-team-name">
            <Flag team={team} size={80} />
            <h2>{team}</h2>
          </div>
          <div className="modal-team-meta">
            <span className="group-pill">Group {group}</span>
            <span className={phaseClass}>{phaseLabel}</span>
          </div>
        </div>
        <div className="modal-body">
          <div className="modal-section">
            <h3>Tournament Stats</h3>
            <div className="stats-grid">
              {statBoxes.map(([label, value]) => (
                <div className="stat-box" key={label}>
                  <div className="v">{value}</div>
                  <div className="l">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {upcoming.length > 0 && (
            <div className="modal-section">
              <h3>Upcoming Matches</h3>
              <div className="upcoming-list">
                {upcoming.slice(0, 5).map((m, i) => {
                  const opp = m.home === team ? m.away : m.home;
                  const when = m.utcDate
                    ? new Date(m.utcDate).toLocaleString(undefined, {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })
                    : 'TBD';
                  return (
                    <div className="upcoming-item" key={m.id ?? i}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Flag team={team} size={36} />
                        <span className="vs">vs</span>
                        <Flag team={opp} size={36} /> {opp || 'TBD'}
                      </span>
                      <span className="when">{when}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {myMatches.length > 0 && (
            <div className="modal-section">
              <h3>Match History</h3>
              {myMatches.map((m, i) => (
                <MatchHistoryItem key={m.id ?? i} m={m} team={team} />
              ))}
            </div>
          )}

          <SquadList team={team} squad={squad} onSelectPlayer={setPlayer} />
        </div>
      </div>

      <PlayerCard player={player} onClose={() => setPlayer(null)} />
    </div>
  );
}
