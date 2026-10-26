// Detects whether LAMBA is running inside a native shell rather than a browser tab.
//   desktop → Electron app (preload exposes window.lambaNative)
//   android → Capacitor app (window.Capacitor is injected)
export function nativePlatform() {
  if (typeof window === 'undefined') return null;
  if (window.lambaNative?.platform) return window.lambaNative.platform;
  if (window.Capacitor?.isNativePlatform?.()) return window.Capacitor.getPlatform();
  return null;
}

export const isNative = () => nativePlatform() !== null;
