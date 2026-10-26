// Simulated video generation queue.
//
// To use a real model, replace `runProvider()` with a call to your provider:
// submit the prompt, poll (or receive a webhook) for status, then return
// { videoUrl, posterUrl } pointing at the finished file. Everything else
// (job records, progress, the API and UI) keeps working unchanged.
import crypto from 'node:crypto';
import { loadDb, persist } from './store.js';
import { sampleMedia } from './catalog.js';

const STAGES = [
  { until: 10, label: 'Queued' },
  { until: 35, label: 'Reading prompt' },
  { until: 80, label: 'Rendering frames' },
  { until: 99, label: 'Encoding video' }
];

function stageFor(progress) {
  return (STAGES.find((s) => progress <= s.until) || STAGES.at(-1)).label;
}

async function runProvider(job, onProgress) {
  // Fake render: ~6–10 seconds depending on duration and model.
  const totalMs = (job.model === 'lamba-flash' ? 4500 : 7000) + job.duration * 250;
  const start = Date.now();
  await new Promise((resolve) => {
    const tick = setInterval(() => {
      const p = Math.min(99, Math.round(((Date.now() - start) / totalMs) * 100));
      onProgress(p);
      if (p >= 99) {
        clearInterval(tick);
        resolve();
      }
    }, 400);
  });
  return sampleMedia(job.aspectRatio);
}

export function createJob(input, userId) {
  const db = loadDb();
  const job = {
    id: `job_${crypto.randomUUID().slice(0, 8)}`,
    userId,
    prompt: input.prompt,
    negativePrompt: input.negativePrompt || '',
    model: input.model,
    style: input.style,
    camera: input.camera,
    aspectRatio: input.aspectRatio,
    duration: input.duration,
    status: 'queued',
    stage: 'Queued',
    progress: 0,
    videoId: null,
    error: null,
    createdAt: new Date().toISOString()
  };
  db.jobs.unshift(job);
  db.jobs = db.jobs.slice(0, 200);
  persist();

  runJob(job).catch((err) => {
    job.status = 'failed';
    job.error = err.message || 'Generation failed';
    persist();
  });
  return job;
}

async function runJob(job) {
  job.status = 'running';
  const media = await runProvider(job, (p) => {
    job.progress = p;
    job.stage = stageFor(p);
  });

  const db = loadDb();
  const video = {
    id: `v_${crypto.randomUUID().slice(0, 10)}`,
    authorId: job.userId,
    prompt: job.prompt,
    model: job.model,
    style: job.style,
    camera: job.camera,
    aspectRatio: job.aspectRatio,
    duration: job.duration,
    ...media,
    published: false,
    likes: 0,
    views: 0,
    shares: 0,
    remixes: 0,
    likedBy: [],
    createdAt: new Date().toISOString()
  };
  db.videos.unshift(video);
  job.status = 'succeeded';
  job.stage = 'Done';
  job.progress = 100;
  job.videoId = video.id;
  persist();
}
