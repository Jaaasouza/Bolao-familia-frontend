// Grouped team standings grid — React port of renderGroupedTeams()/teamboxHtml().
// One group-header per group (with 1st/2nd standings when set) followed by the
// group's clickable team cards: flag-colored gradient + faint flag watermark,
// phase badge, prediction counts and match points.
import { GROUPS as SEED_GROUPS } from '../../data/teams.js';
import Flag from './Flag.jsx';
import { PHASE_SHORT } from './teamStats.js';
import { flagColors } from '../../data/flagColors.js';
import { FLAGS, flagUrl } from '../../data/teamMeta.js';

// position badge for a team across all group standings — mirrors posBadgeFor().
function posBadgeFor(team, standings) {
  if (!standings) return null;
  let out = null;
  Object.entries(standings).forEach(([g, s]) => {
    if (s?.first === team) out = `1st · ${g}`;
    else if (s?.second === team) out = `2nd · ${g}`;
  });
  return out;
}

function TeamBox({ team, teamPts, pred, phase, standings, onSelectTeam }) {
  const r = teamPts[team] || { pts: 0 };
  const pr = pred[team] || { first: 0, second: 0 };
  const ph = phase || 'group';
  const elim = ph === 'eliminated';
  const phaseLabel = PHASE_SHORT[ph] || 'Group';
  const badgeCls = ph === 'champion'
    ? 'badge champ'
    : (ph !== 'group' && ph !== 'eliminated' ? 'badge active' : 'badge');
  const posBadge = posBadgeFor(team, standings);

  const [c1, c2] = flagColors(team);
  const code = FLAGS[team];

  return (
    <button
      type="button"
      className={`teambox ${elim ? 'eliminated' : ''}`}
      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      onClick={() => onSelectTeam?.(team)}
    >
      {code && (
        <span
          className="teambox-watermark"
          style={{ backgroundImage: `url(${flagUrl(team, 160)})` }}
          aria-hidden="true"
        />
      )}
      <span className="teambox-content">
        <span className="tn">
          <span className="tn-team">
            <Flag team={team} size={40} /> {team}
          </span>
          <span className={badgeCls}>{phaseLabel}</span>
        </span>
        <span className="ts">
          {posBadge && <span className="group-label">{posBadge}</span>}
          🥇 {pr.first} · 🥈 {pr.second}
        </span>
        <span className="tp">
          {r.pts} <span className="tp-unit">match pts</span>
        </span>
      </span>
    </button>
  );
}

export default function GroupStandings({
  groups = SEED_GROUPS, groupKeys, teamPts = {}, pred = {}, phases = {}, standings = {}, onSelectTeam,
}) {
  const keys = groupKeys || Object.keys(groups);
  return (
    <div className="teamgrid">
      {keys.map((g) => {
        const s = standings[g];
        return (
          <div key={g} style={{ display: 'contents' }}>
            <div className="group-header">
              <span className="label">GROUP</span> {g}
              {s?.first && (
                <span className="group-standing">
                  1st <Flag team={s.first} size={40} /> {s.first}
                  {s.second && (
                    <>
                      {' · '}2nd <Flag team={s.second} size={40} /> {s.second}
                    </>
                  )}
                </span>
              )}
            </div>
            {(groups[g] || []).map((t) => (
              <TeamBox
                key={t}
                team={t}
                teamPts={teamPts}
                pred={pred}
                phase={phases[t]}
                standings={standings}
                onSelectTeam={onSelectTeam}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
