import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDb, persist, resetDb } from './store.js';
import { createJob } from './generator.js';
import { MODELS, STYLES, CAMERA_MOVES, ASPECT_RATIOS, DURATIONS } from './catalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4000;
const CURRENT_USER = 'u_me'; // Demo: single signed-in user. Swap for real auth.

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use('/samples', express.static(path.join(__dirname, '..', 'public', 'samples'), { maxAge: '7d' }));

// ---------- helpers ----------
const userById = (id) => loadDb().users.find((u) => u.id === id);

function publicUser(u) {
  if (!u) return null;
  const { id, username, name, avatarHue, bio } = u;
  return { id, username, name, avatarHue, bio };
}

function serializeVideo(v, viewerId = CURRENT_USER) {
  const { likedBy, ...rest } = v;
  return {
    ...rest,
    author: publicUser(userById(v.authorId)),
    likedByMe: likedBy.includes(viewerId),
    isMine: v.authorId === viewerId
  };
}

function trendingScore(v) {
  const ageHours = (Date.now() - new Date(v.createdAt).getTime()) / 3.6e6;
  return (v.likes * 3 + v.shares * 5 + v.remixes * 4 + v.views * 0.05) / Math.pow(ageHours + 2, 1.3);
}

function paginate(list, cursor, limit) {
  const start = Number(cursor) || 0;
  const items = list.slice(start, start + limit);
  const next = start + limit < list.length ? String(start + limit) : null;
  return { items, nextCursor: next, total: list.length };
}

function findVideo(req, res) {
  const v = loadDb().videos.find((x) => x.id === req.params.id);
  if (!v) res.status(404).json({ error: 'Video not found' });
  return v;
}

// ---------- catalog ----------
app.get('/api/config', (_req, res) => {
  res.json({ models: MODELS, styles: STYLES, cameraMoves: CAMERA_MOVES, aspectRatios: ASPECT_RATIOS, durations: DURATIONS });
});

// ---------- user ----------
app.get('/api/me', (_req, res) => {
  const db = loadDb();
  const me = userById(CURRENT_USER);
  const mine = db.videos.filter((v) => v.authorId === CURRENT_USER);
  res.json({
    ...publicUser(me),
    credits: me.credits,
    stats: {
      videos: mine.length,
      published: mine.filter((v) => v.published).length,
      likes: mine.reduce((n, v) => n + v.likes, 0),
      views: mine.reduce((n, v) => n + v.views, 0)
    }
  });
});

app.patch('/api/me', (req, res) => {
  const me = userById(CURRENT_USER);
  const { name, bio } = req.body || {};
  if (typeof name === 'string' && name.trim()) me.name = name.trim().slice(0, 40);
  if (typeof bio === 'string') me.bio = bio.trim().slice(0, 160);
  persist();
  res.json(publicUser(me));
});

// ---------- videos ----------
// GET /api/videos?scope=community|mine|liked&sort=trending|new|top&q=&aspect=&cursor=&limit=
app.get('/api/videos', (req, res) => {
  const { scope = 'community', sort = 'trending', q = '', aspect = '', cursor = '0' } = req.query;
  const limit = Math.min(Number(req.query.limit) || 12, 48);
  let list = loadDb().videos;

  if (scope === 'mine') list = list.filter((v) => v.authorId === CURRENT_USER);
  else if (scope === 'liked') list = list.filter((v) => v.likedBy.includes(CURRENT_USER));
  else list = list.filter((v) => v.published);

  if (aspect) list = list.filter((v) => v.aspectRatio === aspect);
  if (q) {
    const needle = String(q).toLowerCase();
    list = list.filter((v) => v.prompt.toLowerCase().includes(needle) || v.style.includes(needle));
  }

  const sorters = {
    new: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    top: (a, b) => b.likes - a.likes,
    trending: (a, b) => trendingScore(b) - trendingScore(a)
  };
  list = [...list].sort(sorters[sort] || sorters.trending);

  const page = paginate(list, cursor, limit);
  res.json({ ...page, items: page.items.map((v) => serializeVideo(v)) });
});

app.get('/api/videos/:id', (req, res) => {
  const v = findVideo(req, res);
  if (v) res.json(serializeVideo(v));
});

app.post('/api/videos/:id/view', (req, res) => {
  const v = findVideo(req, res);
  if (!v) return;
  v.views += 1;
  persist();
  res.json({ views: v.views });
});

app.post('/api/videos/:id/like', (req, res) => {
  const v = findVideo(req, res);
  if (!v) return;
  const i = v.likedBy.indexOf(CURRENT_USER);
  if (i >= 0) { v.likedBy.splice(i, 1); v.likes = Math.max(0, v.likes - 1); }
  else { v.likedBy.push(CURRENT_USER); v.likes += 1; }
  persist();
  res.json({ likes: v.likes, likedByMe: i < 0 });
});

app.post('/api/videos/:id/share', (req, res) => {
  const v = findVideo(req, res);
  if (!v) return;
  v.shares += 1;
  persist();
  res.json({ shares: v.shares });
});

app.post('/api/videos/:id/remix', (req, res) => {
  const v = findVideo(req, res);
  if (!v) return;
  v.remixes += 1;
  persist();
  const { prompt, model, style, camera, aspectRatio, duration } = v;
  res.json({ remixes: v.remixes, preset: { prompt, model, style, camera, aspectRatio, duration } });
});

app.post('/api/videos/:id/publish', (req, res) => {
  const v = findVideo(req, res);
  if (!v) return;
  if (v.authorId !== CURRENT_USER) return res.status(403).json({ error: 'Not your video' });
  v.published = req.body?.published ?? !v.published;
  persist();
  res.json(serializeVideo(v));
});

app.delete('/api/videos/:id', (req, res) => {
  const db = loadDb();
  const v = findVideo(req, res);
  if (!v) return;
  if (v.authorId !== CURRENT_USER) return res.status(403).json({ error: 'Not your video' });
  db.videos = db.videos.filter((x) => x.id !== v.id);
  persist();
  res.status(204).end();
});

// ---------- generation ----------
app.post('/api/generate', (req, res) => {
  const b = req.body || {};
  const prompt = String(b.prompt || '').trim();
  const model = MODELS.find((m) => m.id === b.model);
  const errors = [];
  if (prompt.length < 3) errors.push('Prompt must be at least 3 characters.');
  if (prompt.length > 1500) errors.push('Prompt must be 1500 characters or fewer.');
  if (!model) errors.push('Unknown model.');
  if (!STYLES.some((s) => s.id === b.style)) errors.push('Unknown style.');
  if (!ASPECT_RATIOS.includes(b.aspectRatio)) errors.push('Unsupported aspect ratio.');
  const duration = Number(b.duration);
  if (!DURATIONS.includes(duration) || (model && duration > model.maxDuration)) errors.push('Unsupported duration for this model.');
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });

  const me = userById(CURRENT_USER);
  const cost = model.credits * (duration / 5);
  if (me.credits < cost) return res.status(402).json({ error: 'Not enough credits.' });
  me.credits -= cost;

  const camera = CAMERA_MOVES.some((c) => c.id === b.camera) ? b.camera : 'auto';
  const job = createJob({ prompt, negativePrompt: b.negativePrompt, model: model.id, style: b.style, camera, aspectRatio: b.aspectRatio, duration }, CURRENT_USER);
  res.status(202).json({ job, credits: me.credits });
});

app.get('/api/jobs', (_req, res) => {
  res.json(loadDb().jobs.filter((j) => j.userId === CURRENT_USER).slice(0, 20));
});

app.get('/api/jobs/:id', (req, res) => {
  const db = loadDb();
  const job = db.jobs.find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const video = job.videoId ? db.videos.find((v) => v.id === job.videoId) : null;
  res.json({ ...job, video: video ? serializeVideo(video) : null });
});

// Demo helper: restore the seed data.
app.post('/api/dev/reset', (_req, res) => {
  resetDb();
  res.json({ ok: true });
});

// ---------- serve built client in production ----------
const clientDist = process.env.LAMBA_CLIENT_DIST || path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api|samples).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong.' });
});

// Start the server. Exported so the desktop app can run it in-process.
// `port: 0` picks any free port; resolves with the actual port.
export function startServer({ port = PORT, host } = {}) {
  loadDb();
  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => resolve({ server, port: server.address().port }));
    server.on('error', reject);
  });
}

// Run directly with `node src/index.js`.
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  startServer().then(({ port }) => console.log(`LAMBA API running on http://localhost:${port}`));
}
