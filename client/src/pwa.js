// PWA helpers: service-worker registration, install prompt, online status.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { isNative } from './native.js';

// ---------- service worker ----------
let waitingWorker = null;
const updateListeners = new Set();

export function registerServiceWorker() {
  // Only in production builds: in dev, Vite's hot reload and a SW cache fight each other.
  // Skipped inside the desktop/Android apps: they ship their files locally already.
  if (!import.meta.env.PROD || isNative() || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const track = (worker) => {
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            waitingWorker = worker;
            updateListeners.forEach((fn) => fn(true));
          }
        });
      };
      if (reg.waiting && navigator.serviceWorker.controller) {
        waitingWorker = reg.waiting;
        updateListeners.forEach((fn) => fn(true));
      }
      reg.addEventListener('updatefound', () => reg.installing && track(reg.installing));
      // Check for a new version every 30 minutes while the app is open.
      setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
    } catch (err) {
      console.warn('Service worker registration failed', err);
    }
  });

  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}

export function useUpdateAvailable() {
  const [available, setAvailable] = useState(!!waitingWorker);
  useEffect(() => {
    updateListeners.add(setAvailable);
    return () => updateListeners.delete(setAvailable);
  }, []);
  return [available, () => waitingWorker?.postMessage('SKIP_WAITING')];
}

// ---------- install prompt ----------
let deferredPrompt = null;
const installListeners = new Set();
const notifyInstall = () => installListeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // we show our own Install button instead of the mini-infobar
    deferredPrompt = e;
    notifyInstall();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notifyInstall();
  });
}

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.matchMedia?.('(display-mode: window-controls-overlay)').matches ||
  window.navigator.standalone === true;

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function useInstall() {
  const canPrompt = useSyncExternalStore(
    (cb) => { installListeners.add(cb); return () => installListeners.delete(cb); },
    () => !!deferredPrompt
  );
  const installed = isStandalone() || isNative();

  async function install() {
    if (!deferredPrompt) return 'unavailable';
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    notifyInstall();
    return outcome; // 'accepted' | 'dismissed'
  }

  return {
    installed,
    canPrompt,
    // iOS Safari never fires beforeinstallprompt; users add it from the Share sheet.
    needsManualIOS: !installed && !canPrompt && isIOS(),
    install
  };
}

// ---------- online status ----------
export function useOnline() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('online', cb);
      window.addEventListener('offline', cb);
      return () => {
        window.removeEventListener('online', cb);
        window.removeEventListener('offline', cb);
      };
    },
    () => navigator.onLine
  );
}
