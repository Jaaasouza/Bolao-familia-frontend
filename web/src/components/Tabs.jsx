import React from 'react'
import { useLang } from '../i18n/LanguageContext'

// Six real tabs in HTML order. Labels come from i18n (they already include the
// emoji). The `tv` flag applies the special .tv-tab gradient (Live tab).
// Mirrors the .tabs markup in usam-world-cup-2026.html.
export const TABS = [
  { id: 'live', labelKey: 'tabLive', menuKey: 'menuLive', icon: '🔴', tv: true },
  { id: 'predict', labelKey: 'tabPredict', menuKey: 'menuPredict', icon: '🎯' },
  { id: 'scoreboard', labelKey: 'tabScoreboard', menuKey: 'menuScoreboard', icon: '🏆' },
  { id: 'dashboard', labelKey: 'tabDashboard', menuKey: 'menuDashboard', icon: '📊' },
  { id: 'matches', labelKey: 'tabMatches', menuKey: 'menuMatches', icon: '📅' },
  { id: 'teams', labelKey: 'tabTeams', menuKey: 'menuTeams', icon: '⚽' },
  { id: 'rules', labelKey: 'tabRules', menuKey: 'menuRules', icon: '📖' },
  { id: 'admin', labelKey: 'tabAdmin', menuKey: 'menuAdmin', icon: '🔧' },
]

export function Tabs({ active, onChange, tabs = TABS }) {
  const { t } = useLang()
  return (
    <div className="tabs">
      {tabs.map(({ id, labelKey, tv }) => {
        const cls =
          'tab' + (tv ? ' tv-tab' : '') + (active === id ? ' active' : '')
        return (
          <button key={id} className={cls} data-tab={id} onClick={() => onChange(id)}>
            {t(labelKey)}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
