// In-app backend for the standalone mobile build (VITE_API_MODE=local).
// Mirrors the Express API in server/src/index.js, keeping data in localStorage
// on the device. It reuses the server's catalog and seed data so both stay in sync.
import { MODELS, STYLES, CAMERA_MOVES, ASPECT_RATIOS, DURATIONS, sampleMedia } from '../../../server/src/catalog.js';
import { seedData } from '../../../server/src/seed.js';

const KEY = 'lamba-db-v1';
const ME = 'u_me';
const STAGES = [[10, 'Queued'], [35, 'Reading prompt'], [80, 'Rendering frames'], [99, 'Encoding video']];

let db = null;

function load() {
  if (db) return db;
  try {
    db = JSON.parse(localStorage.getItem(KEY));
  } catch { /* corrupted or unavailable */ }
  if (!db || !Array.isArray(db.videos)) db = seedData();
  return db;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* storage full or blocked */ }
}

const delay = (v) => new Promise((r) => setTimeout(() => r(v), 60)); // feel like a network call
const fail = (msg) => Promise.reject(new Error(msg));
const uid = (p) => `${p}_${Math.random().toString(36).slice(2, 10)}`;
const userById = (id) => load().users.find((u) => u.id === id);
const publicUser = (u) => u && { id: u.id, username: u.username, name: u.name, avatarHue: u.avatarHue, bio: u.bio };

function serialize(v) {
  const { likedBy, ...rest } = v;
  return { ...rest, author: publicUser(userById(v.authorId)), likedByMe: likedBy.includes(ME), isMine: v.authorId === ME };
}
function findVideo(id) {
  return load().videos.find((v) => v.id === id);
}
function trendingScore(v) {
  const ageHours = (Date.now() - new Date(v.createdAt).getTime()) / 3.6e6;
  return (v.likes * 3 + v.shares * 5 + v.remixes * 4 + v.views * 0.05) / Math.pow(ageHours + 2, 1.3);
}

// Jobs advance by elapsed time, so they keep "rendering" even if the app is closed and reopened.
function advance(job) {
  if (job.status === 'succeeded' || job.status === 'failed') return job;
  const total = (job.model === 'lamba-flash' ? 4500 : 7000) + job.duration * 250;
  const p = Math.min(100, Math.round(((Date.now() - job.startedAt) / total) * 100));
  if (p < 100) {
    job.status = 'running';
    job.progress = p;
    job.stage = (STAGES.find(([until]) => p <= until) || STAGES.at(-1))[1];
    return job;
  }
  const video = {
    id: uid('v'),
    authorId: ME,
    prompt: job.prompt,
    model: job.model,
    style: job.style,
    camera: job.camera,
    aspectRatio: job.aspectRatio,
    duration: job.duration,
    ...sampleMedia(job.aspectRatio),
    published: false,
    likes: 0, views: 0, shares: 0, remixes: 0,
    likedBy: [],
    createdAt: new Date().toISOString()
  };
  load().videos.unshift(video);
  Object.assign(job, { status: 'succeeded', stage: 'Done', progress: 100, videoId: video.id });
  save();
  return job;
}

function withVideo(job) {
  const v = job.videoId ? findVideo(job.videoId) : null;
  return { ...job, video: v ? serialize(v) : null };
}

export const localApi = {
  config: () => delay({ models: MODELS, styles: STYLES, cameraMoves: CAMERA_MOVES, aspectRatios: ASPECT_RATIOS, durations: DURATIONS }),

  me: () => {
    const me = userById(ME);
    const mine = load().videos.filter((v) => v.authorId === ME);
    return delay({
      ...publicUser(me),
      credits: me.credits,
      stats: {
        videos: mine.length,
        published: mine.filter((v) => v.published).length,
        likes: mine.reduce((n, v) => n + v.likes, 0),
        views: mine.reduce((n, v) => n + v.views, 0)
      }
    });
  },

  updateMe: ({ name, bio } = {}) => {
    const me = userById(ME);
    if (typeof name === 'string' && name.trim()) me.name = name.trim().slice(0, 40);
    if (typeof bio === 'string') me.bio = bio.trim().slice(0, 160);
    save();
    return delay(publicUser(me));
  },

  videos: ({ scope = 'community', sort = 'trending', q = '', aspect = '', cursor = '0', limit = 12 } = {}) => {
    let list = load().videos;
    if (scope === 'mine') list = list.filter((v) => v.authorId === ME);
    else if (scope === 'liked') list = list.filter((v) => v.likedBy.includes(ME));
    else list = list.filter((v) => v.published);
    if (aspect) list = list.filter((v) => v.aspectRatio === aspect);
    if (q) {
      const n = String(q).toLowerCase();
      list = list.filter((v) => v.prompt.toLowerCase().includes(n) || v.style.includes(n));
    }
    const sorters = {
      new: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      top: (a, b) => b.likes - a.likes,
      trending: (a, b) => trendingScore(b) - trendingScore(a)
    };
    list = [...list].sort(sorters[sort] || sorters.trending);
    const start = Number(cursor) || 0;
    const size = Math.min(Number(limit) || 12, 48);
    return delay({
      items: list.slice(start, start + size).map(serialize),
      nextCursor: start + size < list.length ? String(start + size) : null,
      total: list.length
    });
  },

  video: (id) => {
    const v = findVideo(id);
    return v ? delay(serialize(v)) : fail('Video not found');
  },

  view: (id) => {
    const v = findVideo(id);
    if (!v) return fail('Video not found');
    v.views += 1; save();
    return delay({ views: v.views });
  },

  like: (id) => {
    const v = findVideo(id);
    if (!v) return fail('Video not found');
    const i = v.likedBy.indexOf(ME);
    if (i >= 0) { v.likedBy.splice(i, 1); v.likes = Math.max(0, v.likes - 1); }
    else { v.likedBy.push(ME); v.likes += 1; }
    save();
    return delay({ likes: v.likes, likedByMe: i < 0 });
  },

  share: (id) => {
    const v = findVideo(id);
    if (!v) return fail('Video not found');
    v.shares += 1; save();
    return delay({ shares: v.shares });
  },

  remix: (id) => {
    const v = findVideo(id);
    if (!v) return fail('Video not found');
    v.remixes += 1; save();
    const { prompt, model, style, camera, aspectRatio, duration } = v;
    return delay({ remixes: v.remixes, preset: { prompt, model, style, camera, aspectRatio, duration } });
  },

  publish: (id, published) => {
    const v = findVideo(id);
    if (!v) return fail('Video not found');
    if (v.authorId !== ME) return fail('Not your video');
    v.published = published ?? !v.published; save();
    return delay(serialize(v));
  },

  remove: (id) => {
    const d = load();
    const v = findVideo(id);
    if (!v) return fail('Video not found');
    if (v.authorId !== ME) return fail('Not your video');
    d.videos = d.videos.filter((x) => x.id !== id); save();
    return delay(null);
  },

  generate: (b = {}) => {
    const prompt = String(b.prompt || '').trim();
    const model = MODELS.find((m) => m.id === b.model);
    const duration = Number(b.duration);
    const errors = [];
    if (prompt.length < 3) errors.push('Prompt must be at least 3 characters.');
    if (prompt.length > 1500) errors.push('Prompt must be 1500 characters or fewer.');
    if (!model) errors.push('Unknown model.');
    if (!STYLES.some((s) => s.id === b.style)) errors.push('Unknown style.');
    if (!ASPECT_RATIOS.includes(b.aspectRatio)) errors.push('Unsupported aspect ratio.');
    if (!DURATIONS.includes(duration) || (model && duration > model.maxDuration)) errors.push('Unsupported duration for this model.');
    if (errors.length) return fail(errors.join(' '));

    const me = userById(ME);
    const cost = model.credits * (duration / 5);
    if (me.credits < cost) return fail('Not enough credits.');
    me.credits -= cost;

    const job = {
      id: uid('job'),
      userId: ME,
      prompt,
      negativePrompt: b.negativePrompt || '',
      model: model.id,
      style: b.style,
      camera: CAMERA_MOVES.some((c) => c.id === b.camera) ? b.camera : 'auto',
      aspectRatio: b.aspectRatio,
      duration,
      status: 'queued', stage: 'Queued', progress: 0,
      videoId: null, error: null,
      startedAt: Date.now(),
      createdAt: new Date().toISOString()
    };
    const d = load();
    d.jobs.unshift(job);
    d.jobs = d.jobs.slice(0, 50);
    save();
    return delay({ job: { ...job }, credits: me.credits });
  },

  jobs: () => delay(load().jobs.map((j) => ({ ...advance(j) }))),

  job: (id) => {
    const j = load().jobs.find((x) => x.id === id);
    if (!j) return fail('Job not found');
    advance(j);
    save();
    return delay(withVideo(j));
  }
};
