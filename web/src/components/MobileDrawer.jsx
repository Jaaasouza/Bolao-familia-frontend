import React, { useState } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { TABS } from './Tabs'

// FAB + slide-in drawer for mobile. Pixel port of #fabMenu / #menuDrawer in
// usam-world-cup-2026.html. Drawer rows use the emoji-less menu* labels with the
// emoji shown separately in .icon (matching the original markup).
export function MobileDrawer({ active, onChange, tabs = TABS }) {
  const { t } = useLang()
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)
  const pick = (id) => {
    onChange(id)
    setOpen(false)
  }

  return (
    <>
      <button
        className={'fab-menu' + (open ? ' menu-open' : '')}
        onClick={() => setOpen((o) => !o)}
        aria-label="Open menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className={'menu-overlay' + (open ? ' active' : '')} onClick={close} />

      <div className={'menu-drawer' + (open ? ' active' : '')}>
        <div className="menu-drawer-header">
          <div className="title">MENU</div>
          <button className="menu-drawer-close" onClick={close} aria-label="Close menu">
            ✕
          </button>
        </div>
        {tabs.map(({ id, menuKey, icon, tv }) => {
          const cls =
            'menu-drawer-tab' +
            (tv ? ' tv-item' : '') +
            (active === id ? ' active' : '')
          return (
            <button key={id} className={cls} data-tab={id} onClick={() => pick(id)}>
              <span className="icon">{icon}</span>
              <span>{t(menuKey)}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}

export default MobileDrawer
