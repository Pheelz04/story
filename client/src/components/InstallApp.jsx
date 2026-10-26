import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useInstall, useOnline, useUpdateAvailable } from '../pwa.js';
import { useToast } from './Toast.jsx';
import { DownloadIcon, ShareIcon, CloseIcon } from './Icons.jsx';

// "Install app" button. Variants: 'card' (sidebar), 'button' (top bar).
export function InstallButton({ variant = 'button' }) {
  const { installed, canPrompt, needsManualIOS, install } = useInstall();
  const [showIOS, setShowIOS] = useState(false);
  const toast = useToast();

  if (installed || (!canPrompt && !needsManualIOS)) return null;

  const onClick = async () => {
    if (needsManualIOS) return setShowIOS(true);
    const outcome = await install();
    if (outcome === 'accepted') toast('LAMBA installed — find it on your home screen or desktop');
  };

  return (
    <>
      {variant === 'card' ? (
        <button type="button" className="install-card" onClick={onClick}>
          <img src="/icons/icon-192.png" alt="" width="36" height="36" />
          <span>
            <strong>Install LAMBA</strong>
            <small>Open it like an app, works offline</small>
          </span>
          <DownloadIcon width={18} height={18} />
        </button>
      ) : (
        <button type="button" className="btn btn--ghost btn--sm install-btn" onClick={onClick}>
          <DownloadIcon width={16} height={16} /> <span>Install app</span>
        </button>
      )}
      {/* Portal: the top bar uses backdrop-filter, which would trap a fixed-position modal inside it. */}
      {showIOS && createPortal(<IOSInstructions onClose={() => setShowIOS(false)} />, document.body)}
    </>
  );
}

function IOSInstructions({ onClose }) {
  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Install LAMBA on iPhone or iPad">
        <button className="icon-btn sheet__close" aria-label="Close" onClick={onClose}><CloseIcon /></button>
        <img src="/icons/icon-192.png" alt="" width="64" height="64" className="sheet__icon" />
        <h2>Install LAMBA</h2>
        <ol className="sheet__steps">
          <li>Tap the <strong>Share</strong> button <ShareIcon width={16} height={16} /> in Safari’s toolbar.</li>
          <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
          <li>Tap <strong>Add</strong>. LAMBA will appear on your home screen.</li>
        </ol>
        <button className="btn btn--primary btn--block" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}

// Thin banner shown while offline, plus an "update available" prompt.
export function AppStatus() {
  const online = useOnline();
  const [updateReady, applyUpdate] = useUpdateAvailable();

  return (
    <>
      {!online && (
        <div className="status-bar status-bar--offline" role="status">
          You’re offline. Showing saved content; generating and liking need a connection.
        </div>
      )}
      {updateReady && (
        <div className="status-bar status-bar--update" role="status">
          A new version of LAMBA is ready.
          <button className="btn btn--primary btn--sm" onClick={applyUpdate}>Update</button>
        </div>
      )}
    </>
  );
}
