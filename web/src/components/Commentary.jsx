// Live play-by-play commentary (from ESPN), newest first. Collapsible so it
// doesn't lengthen the screen: shows the latest few, with a "show all" toggle.
import { useState } from 'react';
import { useLang } from '../i18n/LanguageContext.jsx';

const T = {
  en: { title: '📻 Live commentary', more: 'Show all', less: 'Show less' },
  pt: { title: '📻 Narração ao vivo', more: 'Ver tudo', less: 'Ver menos' },
};
const PREVIEW = 4;

export default function Commentary({ commentary }) {
  const { lang } = useLang();
  const t = T[lang] || T.en;
  const [open, setOpen] = useState(false);

  const list = Array.isArray(commentary) ? commentary : [];
  if (!list.length) return null;
  // newest first (the backend keeps them chronological)
  const ordered = [...list].reverse();
  const shown = open ? ordered : ordered.slice(0, PREVIEW);

  return (
    <div className="cm">
      <style>{CM_CSS}</style>
      <div className="cm-h">{t.title}</div>
      <ul className="cm-list">
        {shown.map((c, i) => (
          <li key={i} className="cm-row">
            {c.minute != null && <span className="cm-min">{c.minute}'</span>}
            <span className="cm-text">{c.text}</span>
          </li>
        ))}
      </ul>
      {ordered.length > PREVIEW && (
        <button type="button" className="cm-toggle" onClick={() => setOpen((v) => !v)}>
          {open ? t.less : `${t.more} (${ordered.length})`}
        </button>
      )}
    </div>
  );
}

const CM_CSS = `
.cm{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px 14px;margin-top:14px}
.cm-h{font-family:'Anton',sans-serif;font-size:14px;letter-spacing:.04em;color:var(--gold,#ffd60a);margin-bottom:10px}
.cm-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.cm-row{display:flex;gap:9px;align-items:flex-start}
.cm-min{font-family:'Anton',sans-serif;font-size:13px;color:#fff;min-width:30px;flex:none}
.cm-text{font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,.82);line-height:1.45}
.cm-toggle{margin-top:10px;background:none;border:1px solid rgba(255,255,255,.2);color:var(--gold,#ffd60a);
  border-radius:30px;padding:6px 14px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:12px}
`;

export { Commentary };
