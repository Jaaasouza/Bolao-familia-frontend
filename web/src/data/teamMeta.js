// Team metadata — ported verbatim from usam-world-cup-2026.html.
// FLAGS (team -> flagcdn ISO code), TEAM_ABBR (3-letter), FLAG_EMOJI (emoji),
// and name aliases. All 48 teams from the HTML are represented.
//
// Helpers:
//   normalizeTeamName(s) / resolveTeamName(s) — map an API/alias name to the
//     canonical team name via a lowercased alias map (mirrors the HTML).
//   flagUrl(team, size) — flagcdn image URL (mirrors the HTML `flag()` URL).

// team -> flagcdn ISO code (used by https://flagcdn.com/<size>/<code>.png)
export const FLAGS = {
  'Mexico': 'mx', 'South Korea': 'kr', 'South Africa': 'za', 'Czechia': 'cz',
  'Canada': 'ca', 'Switzerland': 'ch', 'Qatar': 'qa', 'Bosnia-Herzegovina': 'ba',
  'Brazil': 'br', 'Morocco': 'ma', 'Scotland': 'gb-sct', 'Haiti': 'ht',
  'USA': 'us', 'Paraguay': 'py', 'Australia': 'au', 'Türkiye': 'tr',
  'Germany': 'de', 'Ecuador': 'ec', 'Ivory Coast': 'ci', 'Curaçao': 'cw',
  'Netherlands': 'nl', 'Japan': 'jp', 'Tunisia': 'tn', 'Sweden': 'se',
  'Belgium': 'be', 'Iran': 'ir', 'Egypt': 'eg', 'New Zealand': 'nz',
  'Spain': 'es', 'Uruguay': 'uy', 'Saudi Arabia': 'sa', 'Cape Verde': 'cv',
  'France': 'fr', 'Senegal': 'sn', 'Norway': 'no', 'Iraq': 'iq',
  'Argentina': 'ar', 'Austria': 'at', 'Algeria': 'dz', 'Jordan': 'jo',
  'Portugal': 'pt', 'Colombia': 'co', 'Uzbekistan': 'uz', 'DR Congo': 'cd',
  'England': 'gb-eng', 'Croatia': 'hr', 'Panama': 'pa', 'Ghana': 'gh',
};

// team -> 3-letter abbreviation
export const TEAM_ABBR = {
  'Mexico': 'MEX', 'South Korea': 'KOR', 'South Africa': 'RSA', 'Czechia': 'CZE',
  'Canada': 'CAN', 'Switzerland': 'SUI', 'Qatar': 'QAT', 'Bosnia-Herzegovina': 'BIH',
  'Brazil': 'BRA', 'Morocco': 'MAR', 'Scotland': 'SCO', 'Haiti': 'HAI',
  'USA': 'USA', 'Paraguay': 'PAR', 'Australia': 'AUS', 'Türkiye': 'TUR',
  'Germany': 'GER', 'Ecuador': 'ECU', 'Ivory Coast': 'CIV', 'Curaçao': 'CUW',
  'Netherlands': 'NED', 'Japan': 'JPN', 'Tunisia': 'TUN', 'Sweden': 'SWE',
  'Belgium': 'BEL', 'Iran': 'IRN', 'Egypt': 'EGY', 'New Zealand': 'NZL',
  'Spain': 'ESP', 'Uruguay': 'URU', 'Saudi Arabia': 'KSA', 'Cape Verde': 'CPV',
  'France': 'FRA', 'Senegal': 'SEN', 'Norway': 'NOR', 'Iraq': 'IRQ',
  'Argentina': 'ARG', 'Austria': 'AUT', 'Algeria': 'ALG', 'Jordan': 'JOR',
  'Portugal': 'POR', 'Colombia': 'COL', 'Uzbekistan': 'UZB', 'DR Congo': 'COD',
  'England': 'ENG', 'Croatia': 'CRO', 'Panama': 'PAN', 'Ghana': 'GHA',
};

// Flag emojis for visual flair
export const FLAG_EMOJI = {
  'Mexico': '🇲🇽', 'South Korea': '🇰🇷', 'South Africa': '🇿🇦', 'Czechia': '🇨🇿',
  'Canada': '🇨🇦', 'Switzerland': '🇨🇭', 'Qatar': '🇶🇦', 'Bosnia-Herzegovina': '🇧🇦',
  'Brazil': '🇧🇷', 'Morocco': '🇲🇦', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Haiti': '🇭🇹',
  'USA': '🇺🇸', 'Paraguay': '🇵🇾', 'Australia': '🇦🇺', 'Türkiye': '🇹🇷',
  'Germany': '🇩🇪', 'Ecuador': '🇪🇨', 'Ivory Coast': '🇨🇮', 'Curaçao': '🇨🇼',
  'Netherlands': '🇳🇱', 'Japan': '🇯🇵', 'Tunisia': '🇹🇳', 'Sweden': '🇸🇪',
  'Belgium': '🇧🇪', 'Iran': '🇮🇷', 'Egypt': '🇪🇬', 'New Zealand': '🇳🇿',
  'Spain': '🇪🇸', 'Uruguay': '🇺🇾', 'Saudi Arabia': '🇸🇦', 'Cape Verde': '🇨🇻',
  'France': '🇫🇷', 'Senegal': '🇸🇳', 'Norway': '🇳🇴', 'Iraq': '🇮🇶',
  'Argentina': '🇦🇷', 'Austria': '🇦🇹', 'Algeria': '🇩🇿', 'Jordan': '🇯🇴',
  'Portugal': '🇵🇹', 'Colombia': '🇨🇴', 'Uzbekistan': '🇺🇿', 'DR Congo': '🇨🇩',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷', 'Panama': '🇵🇦', 'Ghana': '🇬🇭',
};

// ============ TEAM NAME MAPPING (ROBUST FOR API MATCHING) ============
// Maps our canonical names to all possible aliases that football-data.org or
// API-Football might use. Comparison is case-insensitive, accent-stripped, and
// punctuation-stripped. Ported verbatim from the HTML TEAM_ALIASES constant.
export const TEAM_ALIASES = {
  'Mexico': ['mexico', 'méxico', 'mex'],
  'South Korea': ['south korea', 'korea republic', 'republic of korea', 'korea south', 'kor'],
  'South Africa': ['south africa', 'rsa', 'south afr'],
  'Czechia': ['czechia', 'czech republic', 'czech', 'cze'],
  'Canada': ['canada', 'can'],
  'Switzerland': ['switzerland', 'swiss', 'sui', 'che'],
  'Qatar': ['qatar', 'qat'],
  'Bosnia-Herzegovina': ['bosnia-herzegovina', 'bosnia and herzegovina', 'bosnia herzegovina', 'bosnia', 'bih', 'ba'],
  'Brazil': ['brazil', 'brasil', 'bra'],
  'Morocco': ['morocco', 'maroc', 'mar', 'ma'],
  'Scotland': ['scotland', 'sco'],
  'Haiti': ['haiti', 'haïti', 'hai', 'ht'],
  'USA': ['usa', 'united states', 'united states of america', 'us soccer', 'united states men', 'us'],
  'Paraguay': ['paraguay', 'par', 'py'],
  'Australia': ['australia', 'socceroos', 'aus', 'au'],
  'Türkiye': ['türkiye', 'turkey', 'turkiye', 'tur', 'tr'],
  'Germany': ['germany', 'deutschland', 'ger', 'de'],
  'Ecuador': ['ecuador', 'ecu', 'ec'],
  'Ivory Coast': ['ivory coast', 'cote divoire', 'côte divoire', 'civ', 'ci'],
  'Curaçao': ['curaçao', 'curacao', 'cuw', 'cw'],
  'Netherlands': ['netherlands', 'holland', 'nederland', 'ned', 'nl'],
  'Japan': ['japan', 'nippon', 'jpn', 'jp'],
  'Tunisia': ['tunisia', 'tunisie', 'tun', 'tn'],
  'Sweden': ['sweden', 'sverige', 'swe', 'se'],
  'Belgium': ['belgium', 'belgique', 'belgië', 'bel', 'be'],
  'Iran': ['iran', 'islamic republic of iran', 'ir iran', 'irn', 'ir'],
  'Egypt': ['egypt', 'egy', 'eg'],
  'New Zealand': ['new zealand', 'nzl', 'nz'],
  'Spain': ['spain', 'españa', 'esp', 'es'],
  'Uruguay': ['uruguay', 'uru', 'uy'],
  'Saudi Arabia': ['saudi arabia', 'ksa', 'sau', 'sa'],
  'Cape Verde': ['cape verde', 'cabo verde', 'cpv', 'cv'],
  'France': ['france', 'fra', 'fr'],
  'Senegal': ['senegal', 'sén', 'sen', 'sn'],
  'Norway': ['norway', 'norge', 'nor', 'no'],
  'Iraq': ['iraq', 'irq', 'iq'],
  'Argentina': ['argentina', 'arg', 'ar'],
  'Austria': ['austria', 'österreich', 'aut', 'at'],
  'Algeria': ['algeria', 'algérie', 'alg', 'dz'],
  'Jordan': ['jordan', 'jor', 'jo'],
  'Portugal': ['portugal', 'por', 'pt'],
  'Colombia': ['colombia', 'col', 'co'],
  'Uzbekistan': ['uzbekistan', 'uzb', 'uz'],
  'DR Congo': ['dr congo', 'democratic republic of congo', 'drc', 'congo dr', 'cod', 'cd'],
  'England': ['england', 'eng'],
  'Croatia': ['croatia', 'hrvatska', 'cro', 'hr'],
  'Panama': ['panama', 'panamá', 'pan', 'pa'],
  'Ghana': ['ghana', 'gha', 'gh'],
};

/**
 * Normalize a team name for matching. Mirrors the HTML `normalizeTeamName`:
 * lowercase, strip accents, strip punctuation, collapse whitespace.
 */
export function normalizeTeamName(s) {
  if (!s) return '';
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // strip accents
    .replace(/[^\w\s]/g, '')                            // strip punctuation
    .replace(/\s+/g, ' ').trim();
}

// Reverse lookup for fast matching: normalized alias -> canonical name.
// Mirrors the HTML ALIAS_TO_TEAM (defined after normalizeTeamName).
export const ALIAS_TO_TEAM = (() => {
  const map = {};
  Object.entries(TEAM_ALIASES).forEach(([canonical, aliases]) => {
    // Add canonical itself
    map[normalizeTeamName(canonical)] = canonical;
    aliases.forEach((a) => {
      map[normalizeTeamName(a)] = canonical;
    });
  });
  return map;
})();

/**
 * Try to match an API team name to one of our canonical names. Returns null if
 * no match. Ported verbatim from the HTML `resolveTeamName`.
 */
export function resolveTeamName(apiName) {
  if (!apiName) return null;
  const norm = normalizeTeamName(apiName);
  if (ALIAS_TO_TEAM[norm]) return ALIAS_TO_TEAM[norm];
  // Fallback: try matching first significant word
  const words = norm.split(' ').filter((w) => w.length >= 3);
  for (const w of words) {
    if (ALIAS_TO_TEAM[w]) return ALIAS_TO_TEAM[w];
  }
  // Last resort: partial substring match
  for (const [alias, canonical] of Object.entries(ALIAS_TO_TEAM)) {
    if (norm.includes(alias) || alias.includes(norm)) return canonical;
  }
  return null;
}

/**
 * Build the flagcdn image URL for a team (canonical name). Mirrors the HTML
 * `flag()` URL pattern: https://flagcdn.com/w<size>/<code>.png. Accepts either
 * a numeric size (e.g. 40 -> 'w40', as the HTML uses) or a full size token
 * (e.g. 'w80'). Returns null if the team has no flag code.
 */
// flagcdn only serves a fixed set of widths — an arbitrary one (e.g. w48)
// returns a broken image (the "?" boxes). Snap any numeric size up to the
// nearest supported width.
const FLAGCDN_WIDTHS = [20, 40, 80, 160, 320, 640, 1280, 2560];
function snapWidth(n) {
  for (const w of FLAGCDN_WIDTHS) if (n <= w) return w;
  return 2560;
}

export function flagUrl(team, size = 40) {
  const code = FLAGS[team] || FLAGS[resolveTeamName(team)];
  if (!code) return null;
  const s = typeof size === 'number' ? `w${snapWidth(size)}` : size;
  return `https://flagcdn.com/${s}/${code}.png`;
}
