// LAMBA API client.
//
// Two modes, chosen at build time:
//   remote (default) → talks to the Express server (same origin, or VITE_API_BASE)
//   local            → VITE_API_MODE=local: everything runs inside the app with data
//                      saved on the device. Used for the standalone Android build.
import { localApi } from './local/localApi.js';

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
const PUBLIC_URL = (import.meta.env.VITE_PUBLIC_URL || '').replace(/\/$/, '');
export const API_MODE = import.meta.env.VITE_API_MODE === 'local' ? 'local' : 'remote';

async function request(path, { method = 'GET', body, signal } = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    signal,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

const remoteApi = {
  config: () => request('/config'),
  me: () => request('/me'),
  updateMe: (patch) => request('/me', { method: 'PATCH', body: patch }),

  videos: (params = {}, signal) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
    return request(`/videos?${qs}`, { signal });
  },
  video: (id) => request(`/videos/${id}`),
  view: (id) => request(`/videos/${id}/view`, { method: 'POST' }),
  like: (id) => request(`/videos/${id}/like`, { method: 'POST' }),
  share: (id) => request(`/videos/${id}/share`, { method: 'POST' }),
  remix: (id) => request(`/videos/${id}/remix`, { method: 'POST' }),
  publish: (id, published) => request(`/videos/${id}/publish`, { method: 'POST', body: { published } }),
  remove: (id) => request(`/videos/${id}`, { method: 'DELETE' }),

  generate: (input) => request('/generate', { method: 'POST', body: input }),
  jobs: () => request('/jobs'),
  job: (id) => request(`/jobs/${id}`)
};

export const api = API_MODE === 'local' ? localApi : remoteApi;

// Video/poster URLs from the server are relative; prefix them when the API lives elsewhere.
export function mediaUrl(url) {
  if (!url) return url;
  return API_MODE === 'remote' && API_BASE && url.startsWith('/') ? API_BASE + url : url;
}

// Public link to a video. Inside the desktop/Android apps the page origin is a
// local address, so set VITE_PUBLIC_URL to your hosted site for shareable links.
export function shareUrl(video) {
  const origin = PUBLIC_URL || window.location.origin;
  return `${origin}/gallery?v=${encodeURIComponent(video.id)}`;
}

export function compact(n) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
}

export function timeAgo(iso) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const units = [['y', 31536000], ['mo', 2592000], ['d', 86400], ['h', 3600], ['m', 60]];
  for (const [label, secs] of units) if (s >= secs) return `${Math.floor(s / secs)}${label} ago`;
  return 'just now';
}
