import { useEffect, useRef, useState } from 'react';
import { api, shareUrl } from '../api.js';
import { useToast } from './Toast.jsx';
import { ShareIcon, LinkIcon, CheckIcon } from './Icons.jsx';

export default function ShareMenu({ video, onShared, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  const toast = useToast();
  const url = shareUrl(video);
  const text = `“${video.prompt.slice(0, 90)}” — made with LAMBA`;

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  async function record() {
    try {
      const { shares } = await api.share(video.id);
      onShared?.(shares);
    } catch { /* non-critical */ }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast('Link copied');
      record();
    } catch {
      toast('Could not copy link', 'error');
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: 'LAMBA video', text, url });
      record();
      setOpen(false);
    } catch { /* cancelled */ }
  }

  const enc = encodeURIComponent;
  const targets = [
    { name: 'X', href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { name: 'WhatsApp', href: `https://wa.me/?text=${enc(`${text} ${url}`)}` },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { name: 'Reddit', href: `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(text)}` }
  ];

  return (
    <div className="share" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        aria-label="Share"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
      >
        <ShareIcon width={18} height={18} />
      </button>
      {open && (
        <div className={`share__menu share__menu--${align}`} role="menu" onClick={(e) => e.stopPropagation()}>
          <button type="button" role="menuitem" className="share__item" onClick={copy}>
            {copied ? <CheckIcon width={16} height={16} /> : <LinkIcon width={16} height={16} />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
          {typeof navigator !== 'undefined' && navigator.share && (
            <button type="button" role="menuitem" className="share__item" onClick={nativeShare}>
              <ShareIcon width={16} height={16} /> Share via…
            </button>
          )}
          <div className="share__sep" />
          {targets.map((t) => (
            <a key={t.name} role="menuitem" className="share__item" href={t.href} target="_blank" rel="noopener noreferrer" onClick={record}>
              {t.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
