// Share button (footer) → opens a QR code of the current site URL so people can
// scan and join. Works on any deploy (uses window.location.origin), so the pool
// and any duplicate get their own correct link with no config.
import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useLang } from '../i18n/LanguageContext.jsx';
import { APP_NAME } from '../config/app.js';

const SH_TXT = {
  en: { share: '📤 Share', title: 'Scan to join', sub: 'Point your phone camera at the code', copy: 'Copy link', copied: '✓ Link copied!', shareBtn: 'Share…', close: 'Close' },
  pt: { share: '📤 Compartilhar', title: 'Escaneie para entrar', sub: 'Aponte a câmera do celular para o código', copy: 'Copiar link', copied: '✓ Link copiado!', shareBtn: 'Compartilhar…', close: 'Fechar' },
};

const SH_CSS = `
.sh-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;z-index:3000;padding:20px}
.sh-modal{background:linear-gradient(180deg,#0d1b3a,#0a1733);border:1px solid rgba(255,255,255,.15);border-radius:18px;padding:22px;width:100%;max-width:340px;text-align:center}
.sh-title{font-family:'Archivo Black',sans-serif;font-size:18px;color:#fff;margin:0 0 4px}
.sh-sub{font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,.6);margin:0 0 16px}
.sh-qr{width:100%;max-width:260px;border-radius:14px;display:block;margin:0 auto;background:#fff;padding:10px;box-sizing:border-box}
.sh-url{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--gold,#ffd60a);word-break:break-all;margin:14px 0}
.sh-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.sh-btn{border:none;border-radius:12px;padding:11px 16px;cursor:pointer;font-family:'Archivo Black',sans-serif;font-size:13px;
  background:linear-gradient(135deg,var(--gold,#ffd60a),var(--orange,#fb5607));color:#0a1733}
.sh-btn.ghost{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#fff}
.sh-ok{color:var(--lime,#8ac926);font-family:'JetBrains Mono',monospace;font-size:12px;margin-top:10px;min-height:14px}
`;

export default function ShareButton() {
  const { lang } = useLang();
  const T = SH_TXT[lang] || SH_TXT.en;
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  const canWebShare = typeof navigator !== 'undefined' && !!navigator.share;

  useEffect(() => {
    if (!open || !url) return;
    setCopied(false);
    QRCode.toDataURL(url, { width: 320, margin: 1, color: { dark: '#0a1733', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [open, url]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable */ }
  };

  const webShare = async () => {
    try { await navigator.share({ title: APP_NAME, url }); } catch { /* cancelled */ }
  };

  return (
    <>
      <button className="lang-btn" style={{ border: '1px solid rgba(255,255,255,.2)', borderRadius: 30 }} onClick={() => setOpen(true)}>
        {T.share}
      </button>
      {open && (
        <div className="sh-overlay" onClick={() => setOpen(false)}>
          <style>{SH_CSS}</style>
          <div className="sh-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="sh-title">{T.title}</h3>
            <p className="sh-sub">{T.sub}</p>
            {qr && <img className="sh-qr" src={qr} alt="QR code" />}
            <div className="sh-url">{url}</div>
            <div className="sh-row">
              <button type="button" className="sh-btn" onClick={copy}>{T.copy}</button>
              {canWebShare && <button type="button" className="sh-btn ghost" onClick={webShare}>{T.shareBtn}</button>}
              <button type="button" className="sh-btn ghost" onClick={() => setOpen(false)}>{T.close}</button>
            </div>
            <div className="sh-ok">{copied ? T.copied : ''}</div>
          </div>
        </div>
      )}
    </>
  );
}

export { ShareButton };
