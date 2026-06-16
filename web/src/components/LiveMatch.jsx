// Rich live-match view, in order: the standard MatchCard (score/clock), your
// pick, the reference-style Lineups graphic (TEAM · VS · TEAM, two pitches with
// formation + substitutions + manager), and the live key-events feed.
import MatchCard from './MatchCard.jsx';
import Lineups from './Lineups.jsx';
import LiveFeed from './LiveFeed.jsx';
import Commentary from './Commentary.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';

const HOME_COLOR = '#3a86ff';
const AWAY_COLOR = '#ffd60a';

const T = { en: { yourPick: 'Your pick:' }, pt: { yourPick: 'Seu palpite:' } };

// `pred` (optional) = the viewer's pick for this match: { home, away }.
// `afterPick` (optional) = node rendered between the pick and the live feed
// (used to slot the in-game chat there).
export default function LiveMatch({ m, pred = null, afterPick = null }) {
  const { lang } = useLang();
  const t = T[lang] || T.en;
  if (!m) return null;
  const lu = m.lineups || {};

  return (
    <div className="lm">
      <style>{LM_CSS}</style>

      {/* 1) standard match card — score + clock (events shown in the feed below) */}
      <MatchCard m={m} />

      {/* 2) your pick for this game */}
      {pred && <div className="lm-pick">{t.yourPick} <b>{pred.home}–{pred.away}</b></div>}

      {/* 2b) optional slot between the pick and the live feed (in-game chat) */}
      {afterPick}

      {/* 3) live happenings — up top, the most time-sensitive part */}
      <LiveFeed liveEvents={m.liveEvents} status={m.status} minute={m.minute}
        homeTeam={m.home} awayTeam={m.away} homeColor={HOME_COLOR} awayColor={AWAY_COLOR} />

      {/* 3b) play-by-play commentary (collapsible) */}
      <Commentary commentary={m.commentary} />

      {/* 4) lineups graphic — two pitches, formation, subs, manager */}
      <Lineups
        home={m.home} away={m.away}
        homeLineup={lu.home} awayLineup={lu.away}
        homeColor={HOME_COLOR} awayColor={AWAY_COLOR}
      />
    </div>
  );
}

const LM_CSS = `
.lm{max-width:640px;margin:0 auto}
.lm-pick{margin:8px 0 14px;padding:10px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);
  border-radius:12px;font-family:'JetBrains Mono',monospace;font-size:13px;color:rgba(255,255,255,.8);text-align:center}
.lm-pick b{color:#fff;font-size:15px}
`;

export { LiveMatch };
