import { GROUPS as SEED_GROUPS, GROUP_KEYS as SEED_KEYS } from './teams.js';

// Returns the group→teams map to use across the UI. Prefers the groups DERIVED
// from the synced fixtures (apiGroups from /api/groups), so the app always
// matches the real draw; falls back to the hardcoded seed until fixtures sync
// (and ignores a partial API map with fewer than the expected 12 full groups).
export function resolveGroups(apiGroups) {
  if (apiGroups && typeof apiGroups === 'object') {
    const keys = Object.keys(apiGroups);
    const full = keys.filter((k) => Array.isArray(apiGroups[k]) && apiGroups[k].length >= 4);
    if (full.length >= 12) {
      return { groups: apiGroups, keys: keys.sort() };
    }
  }
  return { groups: SEED_GROUPS, keys: SEED_KEYS };
}
