// Static catalog: models, styles, aspect ratios, and the bundled sample clips
// that the simulated generator returns. Swap these for your real provider.

export const MODELS = [
  { id: 'lamba-motion-2', name: 'LAMBA Motion 2', tagline: 'Cinematic, 1080p', maxDuration: 10, credits: 8, badge: 'New' },
  { id: 'lamba-motion-1', name: 'LAMBA Motion 1', tagline: 'Balanced quality', maxDuration: 10, credits: 5 },
  { id: 'lamba-flash',    name: 'LAMBA Flash',    tagline: 'Fast drafts, 720p', maxDuration: 5,  credits: 2, badge: 'Fast' },
  { id: 'lamba-loop',     name: 'LAMBA Loop',     tagline: 'Seamless loops',    maxDuration: 6,  credits: 3 }
];

export const STYLES = [
  { id: 'none',        name: 'No style' },
  { id: 'cinematic',   name: 'Cinematic' },
  { id: 'anime',       name: 'Anime' },
  { id: 'documentary', name: 'Documentary' },
  { id: 'neon-noir',   name: 'Neon noir' },
  { id: 'claymation',  name: 'Claymation' },
  { id: 'vhs',         name: 'Retro VHS' },
  { id: 'dreamy',      name: 'Dreamy' }
];

export const CAMERA_MOVES = [
  { id: 'auto',      name: 'Auto' },
  { id: 'static',    name: 'Static' },
  { id: 'dolly-in',  name: 'Dolly in' },
  { id: 'orbit',     name: 'Orbit' },
  { id: 'crane-up',  name: 'Crane up' },
  { id: 'handheld',  name: 'Handheld' }
];

export const ASPECT_RATIOS = ['16:9', '9:16', '1:1'];
export const DURATIONS = [5, 10];

// Sample clips bundled in /public/samples, grouped by aspect ratio.
export const SAMPLES = {
  '16:9': ['aurora-16x9', 'prism-16x9', 'lagoon-16x9'],
  '9:16': ['nebula-9x16', 'dusk-9x16', 'tide-9x16'],
  '1:1':  ['ember-1x1', 'colony-1x1', 'bloom-1x1']
};

export function sampleMedia(aspectRatio, seed = Math.random()) {
  const list = SAMPLES[aspectRatio] || SAMPLES['16:9'];
  const name = list[Math.floor(seed * list.length) % list.length];
  return { videoUrl: `/samples/${name}.mp4`, posterUrl: `/samples/${name}.jpg` };
}
