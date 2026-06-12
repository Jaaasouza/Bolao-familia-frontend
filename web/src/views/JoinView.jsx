import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLang } from '../i18n/LanguageContext.jsx';
import { GROUPS as SEED_GROUPS, GROUP_KEYS } from '../data/teams.js';
import { resolveGroups } from '../data/groups.js';
import { TEAM_ABBR, FLAG_EMOJI, FLAGS, flagUrl } from '../data/teamMeta.js';
import { STRIKERS } from '../data/strikers.js';
import StrikerSticker from '../components/StrikerSticker.jsx';
import { API, ApiError } from '../lib/api.js';

// Re-export the canonical team-metadata tables (from src/data/teamMeta.js, which
// ports the inline tables from the original HTML) so the unit test can import
// everything from one place. FLAG_CODE is the HTML's name for the flagcdn-code
// map; teamMeta exposes that table as FLAGS.
export { TEAM_ABBR, FLAG_EMOJI, flagUrl };
export const FLAG_CODE = FLAGS;

// Plain-ASCII "ABBR - Team" label used inside <select> options. Ported from
// teamWithEmoji() in the HTML — deliberately ASCII-only (Chrome on Windows
// mangles emoji/flags inside native <option> elements). teamMeta.js does not
// export this UI-layer formatter, so it lives here next to the picks grid.
export function teamWithEmoji(team) {
  const abbr = TEAM_ABBR[team];
  const flag = FLAG_EMOJI[team] || '';
  const label = abbr ? `${abbr} - ${team}` : team;
  // Lead with the flag emoji so the native dropdown shows a flag on the
  // platforms our users are on (iOS/Mac/Android render flag emoji in <option>).
  return flag ? `${flag} ${label}` : label;
}

// ---------------------------------------------------------------------------
// Pure helpers (also exercised in JoinView.test.jsx so validation can be tested
// without a DOM). `firsts` / `seconds` are { [groupKey]: team } maps.
// ---------------------------------------------------------------------------

// The unique, sorted set of teams currently picked (firsts + seconds). Mirrors
// updateChampionDropdown()'s `picked` Set in the HTML.
export function pickedTeams(firsts = {}, seconds = {}) {
  const picked = new Set();
  for (const g of GROUP_KEYS) {
    if (firsts[g]) picked.add(firsts[g]);
    if (seconds[g]) picked.add(seconds[g]);
  }
  return [...picked].sort();
}

// Returns null when valid, otherwise an i18n key for the blocking error. Mirrors
// the validation order in the savePick handler.
export function validatePicks({ name, firsts = {}, seconds = {}, champion }) {
  if (!name || !name.trim()) return 'enterName';
  let allFilled = true;
  let sameTeam = false;
  for (const g of GROUP_KEYS) {
    const f = firsts[g];
    const s = seconds[g];
    if (!f || !s) allFilled = false;
    if (f && s && f === s) sameTeam = true;
  }
  if (!allFilled) return 'pickAllGroups';
  if (sameTeam) return 'sameTeamError';
  if (!champion) return 'pickChampion';
  return null;
}

// Shape sent to API — { id, name, picks: { firsts, seconds, champion, topScorer } }.
export function buildPlayerPayload({ id, name, firsts = {}, seconds = {}, champion, topScorer }) {
  const cleanFirsts = {};
  const cleanSeconds = {};
  for (const g of GROUP_KEYS) {
    cleanFirsts[g] = firsts[g];
    cleanSeconds[g] = seconds[g];
  }
  return {
    id: id || `p_${Date.now()}`,
    name: name.trim(),
    picks: { firsts: cleanFirsts, seconds: cleanSeconds, champion, topScorer: topScorer || null },
  };
}

// ---------------------------------------------------------------------------
// View
// ---------------------------------------------------------------------------
// US phone → { digits, pretty } or null. Mirrors the backend normalizer.
export function normalizeUsPhone(input) {
  let d = String(input || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  if (d.length !== 10) return null;
  return { digits: d, pretty: `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` };
}

// ms → "2d 04h 13m 09s" (or "0s" when non-positive).
export function formatCountdown(ms) {
  if (!ms || ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return (d > 0 ? `${d}d ` : '') + `${pad(h)}h ${pad(m)}m ${pad(sec)}s`;
}

export default function JoinView({ players = {}, onSaved, config = {}, apiGroups = {} }) {
  const { t, lang } = useLang();
  const isEs = lang === 'es';

  // Use the real draw from synced fixtures when available, else the seed.
  const GROUPS = useMemo(() => resolveGroups(apiGroups).groups, [apiGroups]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [firsts, setFirsts] = useState({});
  const [seconds, setSeconds] = useState({});
  const [champion, setChampion] = useState('');
  const [topScorer, setTopScorer] = useState('');
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  // { type: 'ok' | 'err', msg } — inline success/error feedback (toast equivalent).
  const [feedback, setFeedback] = useState(null);

  // Live countdown so the deadline banner ticks without a reload.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const deadlineTs = config.picksDeadline ? new Date(config.picksDeadline).getTime() : null;
  const registrationClosed = deadlineTs != null && now >= deadlineTs;

  const picked = useMemo(() => pickedTeams(firsts, seconds), [firsts, seconds]);

  // Keep the champion selection valid as picks change (mirrors updateChampionDropdown
  // dropping a previously-picked champion that is no longer among the picks).
  const championValue = picked.includes(champion) ? champion : '';

  const setFirst = useCallback((g, v) => setFirsts((p) => ({ ...p, [g]: v })), []);
  const setSecond = useCallback((g, v) => setSeconds((p) => ({ ...p, [g]: v })), []);

  const phoneOk = normalizeUsPhone(phone) !== null;
  const validationKey = validatePicks({ name, firsts, seconds, champion: championValue });
  const canSubmit = !locked && !saving && !registrationClosed && phoneOk && validationKey === null;

  async function submitPicks() {
    setFeedback(null);
    if (registrationClosed) {
      setFeedback({ type: 'err', msg: isEs ? 'Las inscripciones están cerradas.' : 'Registration is closed.' });
      return;
    }
    const errKey = validatePicks({ name, firsts, seconds, champion: championValue });
    if (errKey) {
      setFeedback({ type: 'err', msg: t(errKey) });
      return;
    }
    if (!phoneOk) {
      setFeedback({ type: 'err', msg: isEs ? 'Ingresa un teléfono válido (EE. UU.).' : 'Enter a valid US phone number.' });
      return;
    }
    // Reuse an existing player id (by name), like the existing-player lookup in the HTML.
    const existing = Object.values(players).find(
      (p) => p && p.name && p.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    if (existing && existing.locked) {
      setFeedback({ type: 'err', msg: t('alreadyLocked') });
      return;
    }
    const payload = buildPlayerPayload({
      id: existing && existing.id,
      name,
      firsts,
      seconds,
      champion: championValue,
      topScorer,
    });

    setSaving(true);
    try {
      // Public self-registration — no admin token needed. Backend locks the
      // player and rejects overwriting a locked name (409).
      const res = await API.register({ name: payload.name, phone, picks: payload.picks });
      setLocked(true);
      setFeedback({ type: 'ok', msg: t('lockedIn') });
      if (onSaved) onSaved(payload, res);
    } catch (e) {
      // 409 = this name is already locked in. Otherwise a generic save error.
      const msg = e instanceof ApiError && e.status === 409 ? t('alreadyLocked') : t('saveFailed');
      setFeedback({ type: 'err', msg });
    } finally {
      setSaving(false);
    }
  }

  const groupWord = isEs ? 'Grupo' : 'Group';
  const firstLabel = isEs ? '1er lugar' : '1st place';
  const secondLabel = isEs ? '2do lugar' : '2nd place';
  const pickWinner = isEs ? '— elige ganador —' : '— pick winner —';
  const pickRunner = isEs ? '— elige subcampeón —' : '— pick runner-up —';

  return (
    <div className="panel active" id="panel-join">
      <div className="card">
        <h2 dangerouslySetInnerHTML={{ __html: t('joinTitle') }} />
        <p className="hint">{t('joinHint')}</p>

        {deadlineTs != null && (
          <div className={`deadline-banner${registrationClosed ? ' closed' : ''}`}>
            <span className="icon">{registrationClosed ? '🔒' : '⏳'}</span>
            <span>
              {registrationClosed ? (
                <>
                  <strong>{isEs ? 'Inscripciones cerradas' : 'Registration closed'}</strong>
                  {' — '}
                  {isEs ? 'el torneo ya comenzó.' : 'the tournament has started.'}
                </>
              ) : (
                <>
                  {isEs ? 'Cierra en ' : 'Closes in '}
                  <strong>{formatCountdown(deadlineTs - now)}</strong>
                  {' — '}
                  {new Date(deadlineTs).toLocaleString(isEs ? 'es' : 'en', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </>
              )}
            </span>
          </div>
        )}

        {locked && (
          <div id="lockedBanner" className="locked-banner" style={{ display: 'flex' }}>
            <div className="icon">🔒</div>
            <div className="text">
              <strong>{t('lockedTitle')}</strong>
              <span>{t('lockedSubtitle')}</span>
            </div>
          </div>
        )}

        <div className="field">
          <label>{t('yourName')}</label>
          <input
            type="text"
            id="playerName"
            placeholder={t('namePlaceholder')}
            maxLength={40}
            value={name}
            disabled={locked || registrationClosed}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <label>{isEs ? 'Teléfono (EE. UU.)' : 'Phone (US)'}</label>
          <input
            type="tel"
            id="playerPhone"
            inputMode="tel"
            placeholder="(415) 555-1234"
            maxLength={20}
            value={phone}
            disabled={locked || registrationClosed}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => {
              const n = normalizeUsPhone(phone);
              if (n) setPhone(n.pretty);
            }}
          />
        </div>

        <div className="grid-picks" id="picksGrid">
          {GROUP_KEYS.map((g) => {
            const teams = GROUPS[g] || [];
            const complete = Boolean(firsts[g] && seconds[g] && firsts[g] !== seconds[g]);
            const options = teams.map((tm) => (
              <option key={tm} value={tm}>
                {teamWithEmoji(tm)}
              </option>
            ));
            return (
              <div
                key={g}
                className={`pick-card${complete ? ' complete' : ''}`}
                data-group={g}
              >
                <div className="group-title">
                  <span className="gl">{g}</span> {groupWord} {g}
                </div>
                <div className="pick-slot first">
                  <label>
                    <span className="medal">🥇</span> {firstLabel}
                  </label>
                  <select
                    className="pickSel first"
                    data-group={g}
                    data-pos="1"
                    value={firsts[g] || ''}
                    disabled={locked}
                    onChange={(e) => setFirst(g, e.target.value)}
                  >
                    <option value="">{pickWinner}</option>
                    {options}
                  </select>
                </div>
                <div className="pick-slot second">
                  <label>
                    <span className="medal">🥈</span> {secondLabel}
                  </label>
                  <select
                    className="pickSel second"
                    data-group={g}
                    data-pos="2"
                    value={seconds[g] || ''}
                    disabled={locked}
                    onChange={(e) => setSecond(g, e.target.value)}
                  >
                    <option value="">{pickRunner}</option>
                    {options}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 20,
            padding: '14px 18px',
            background: 'rgba(255,214,10,.08)',
            border: '1px solid rgba(255,214,10,.3)',
            borderRadius: 10,
            fontSize: 13,
            lineHeight: 1.6,
          }}
          dangerouslySetInnerHTML={{ __html: t('predictionHint') }}
        />

        {/* CHAMPION PICK */}
        <div
          style={{
            marginTop: 24,
            padding: 24,
            background: 'linear-gradient(135deg, rgba(255,214,10,.12), rgba(251,86,7,.08))',
            border: '2px solid var(--gold)',
            borderRadius: 16,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', fontSize: 120, right: -10, top: -30, opacity: 0.08 }}>
            🏆
          </div>
          <h3
            style={{
              fontFamily: "'Anton',sans-serif",
              fontSize: 28,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              marginBottom: 6,
              background: 'linear-gradient(135deg, var(--gold), var(--orange))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('champTitle')}
          </h3>
          <p
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11,
              color: 'rgba(255,255,255,.7)',
              letterSpacing: '.05em',
              marginBottom: 14,
            }}
          >
            {t('champHint')}
          </p>
          <select
            id="championPick"
            style={{ fontSize: 16, padding: 14 }}
            value={championValue}
            disabled={locked || picked.length === 0}
            onChange={(e) => setChampion(e.target.value)}
          >
            {picked.length === 0 ? (
              <option value="">{t('champEmpty')}</option>
            ) : (
              <>
                <option value="">{t('champPicker')}</option>
                {picked.map((tm) => (
                  <option key={tm} value={tm}>
                    {teamWithEmoji(tm)}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        {/* GOLDEN BOOT PICK */}
        <div className="golden-boot-card">
          <div className="gb-icon" aria-hidden="true">👟</div>
          <h3>{isEs ? 'Bota de Oro' : 'Golden Boot'}</h3>
          <p className="gb-hint">
            {isEs
              ? 'Elige al goleador del torneo. +30 si aciertas · +10 si queda en el top 3.'
              : 'Pick the tournament top scorer. +30 if exact · +10 if top 3.'}
          </p>
          <select
            id="topScorerPick"
            value={topScorer}
            disabled={locked || registrationClosed}
            onChange={(e) => setTopScorer(e.target.value)}
            style={{ fontSize: 15, padding: 13 }}
          >
            <option value="">{isEs ? '— elige goleador (opcional) —' : '— pick top scorer (optional) —'}</option>
            {STRIKERS.map((s) => (
              <option key={s.name} value={s.name}>
                {(FLAG_EMOJI[s.team] || '')} {s.name} · {s.team}
              </option>
            ))}
          </select>

          {/* Sticker strip — tap a figurinha to pick */}
          {!topScorer ? (
            <div className="striker-strip">
              {STRIKERS.map((s) => (
                <div
                  key={s.name}
                  onClick={() => !(locked || registrationClosed) && setTopScorer(s.name)}
                  role="button"
                  tabIndex={0}
                >
                  <StrikerSticker name={s.name} team={s.team} size={84} />
                </div>
              ))}
            </div>
          ) : (
            <div className="gb-selected-sticker">
              {(() => {
                const s = STRIKERS.find((x) => x.name === topScorer);
                return (
                  <div onClick={() => !(locked || registrationClosed) && setTopScorer('')} role="button" tabIndex={0}>
                    <StrikerSticker name={topScorer} team={s ? s.team : ''} size={110} selected />
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {feedback && (
          <div
            className={`api-status ${feedback.type === 'ok' ? 'connected' : 'error'}`}
            style={{ marginTop: 16 }}
            role="status"
          >
            {feedback.msg}
          </div>
        )}

        <button
          className="primary"
          id="savePick"
          style={{ marginTop: 20 }}
          disabled={!canSubmit}
          onClick={submitPicks}
        >
          <span>
            {registrationClosed
              ? (isEs ? '🔒 Inscripciones cerradas' : '🔒 Registration closed')
              : locked
                ? t('lockBtnLocked')
                : `🔒 ${t('lockBtn')}`}
          </span>
        </button>
      </div>
    </div>
  );
}

export { JoinView };
