// World Cup 2026 groups (12 groups × 4 teams). Ported verbatim from the legacy
// usam-world-cup-2026.html GROUPS constant — canonical team names used across
// picks, phases and standings.
export const GROUPS = {
  A: ['Mexico', 'South Korea', 'South Africa', 'Czechia'],
  B: ['Canada', 'Switzerland', 'Qatar', 'Bosnia-Herzegovina'],
  C: ['Brazil', 'Morocco', 'Scotland', 'Haiti'],
  D: ['USA', 'Paraguay', 'Australia', 'Türkiye'],
  E: ['Germany', 'Ecuador', 'Ivory Coast', 'Curaçao'],
  F: ['Netherlands', 'Japan', 'Tunisia', 'Sweden'],
  G: ['Belgium', 'Iran', 'Egypt', 'New Zealand'],
  H: ['Spain', 'Uruguay', 'Saudi Arabia', 'Cape Verde'],
  I: ['France', 'Senegal', 'Norway', 'Iraq'],
  J: ['Argentina', 'Austria', 'Algeria', 'Jordan'],
  K: ['Portugal', 'Colombia', 'Uzbekistan', 'DR Congo'],
  L: ['England', 'Croatia', 'Panama', 'Ghana'],
};

export const GROUP_KEYS = Object.keys(GROUPS);

export const TEAMS = GROUP_KEYS.flatMap((g) => GROUPS[g]);

export const TEAM_TO_GROUP = Object.fromEntries(
  GROUP_KEYS.flatMap((g) => GROUPS[g].map((t) => [t, g]))
);
