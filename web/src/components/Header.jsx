import React from 'react'
import { useLang } from '../i18n/LanguageContext'
import { Logo } from './Logo.jsx'
import { BRAND, BRAND_LINE2 } from '../config/app.js'

// Hero header — pixel port of <header> in usam-world-cup-2026.html.
// The EN/ES switch now lives in the footer (the language is already chosen on
// the entry gate), so the header just shows the brand + host flags.
export function Header() {
  const { t } = useLang()

  return (
    <header>
      <div className="brand-wrap">
        <div className="brand">
          <div className="brand-lockup">
            <Logo size={56} />
            <h1 className="title">
              {BRAND}
              <span className="line2">{BRAND_LINE2}</span>
            </h1>
          </div>
          <div className="subtitle">{t('subtitle')}</div>
        </div>
        <div className="header-side">
          <span className="brand-tag">{t('brandTag')}</span>
          <div className="host-flags">
            <span className="flag-pill usa">🇺🇸 USA</span>
            <span className="flag-pill can">🇨🇦 CAN</span>
            <span className="flag-pill mex">🇲🇽 MEX</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
