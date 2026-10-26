import { sampleMedia } from './catalog.js';

const USERS = [
  { id: 'u_me',    username: 'you',        name: 'You',            avatarHue: 265, bio: 'Making short films with LAMBA.', credits: 120 },
  { id: 'u_ada',   username: 'ada.frames', name: 'Ada Okafor',     avatarHue: 20 },
  { id: 'u_kenji', username: 'kenjimoves', name: 'Kenji Mori',     avatarHue: 190 },
  { id: 'u_lina',  username: 'lina.vfx',   name: 'Lina Haddad',    avatarHue: 320 },
  { id: 'u_tobi',  username: 'tobi.makes', name: 'Tobi Adeyemi',   avatarHue: 140 },
  { id: 'u_sara',  username: 'sarastudio', name: 'Sara Lindqvist', avatarHue: 45 }
];

const SEEDS = [
  ['u_ada',   'Slow dolly through a neon-lit night market in the rain, steam rising from food stalls', 'lamba-motion-2', 'neon-noir',  '16:9', 10],
  ['u_kenji', 'A paper boat drifting down a glowing river at dusk, fireflies overhead',              'lamba-motion-1', 'dreamy',     '9:16', 5],
  ['u_lina',  'Claymation fox baking bread in a tiny wooden kitchen, warm morning light',             'lamba-motion-2', 'claymation', '1:1',  5],
  ['u_tobi',  'Drone shot over Lagos lagoon at golden hour, boats leaving long wakes',                'lamba-motion-2', 'cinematic',  '16:9', 10],
  ['u_sara',  'Astronaut walking through a field of giant glowing mushrooms, handheld camera',         'lamba-flash',    'cinematic',  '9:16', 5],
  ['u_me',    'Abstract ink blooming in water, macro lens, purple and amber',                         'lamba-loop',     'dreamy',     '1:1',  5],
  ['u_ada',   'Vintage camcorder footage of a 90s skate park, friends cheering',                      'lamba-motion-1', 'vhs',        '16:9', 5],
  ['u_kenji', 'Anime samurai standing on a cliff as cherry blossoms swirl in the wind',               'lamba-motion-2', 'anime',      '9:16', 10],
  ['u_lina',  'Documentary close-up of a hummingbird drinking from a red flower',                     'lamba-motion-1', 'documentary','1:1',  5],
  ['u_tobi',  'Futuristic train gliding through a desert of white salt flats, orbit shot',            'lamba-motion-2', 'cinematic',  '16:9', 10],
  ['u_sara',  'Jellyfish pulsing in deep blue water, bioluminescent trails',                          'lamba-loop',     'dreamy',     '9:16', 5],
  ['u_me',    'Rotating crystal sculpture on a pedestal, studio lighting, product shot',              'lamba-flash',    'none',       '1:1',  5]
];

export function seedData() {
  const now = Date.now();
  const videos = SEEDS.map(([authorId, prompt, model, style, aspectRatio, duration], i) => ({
    id: `v_seed_${i + 1}`,
    authorId,
    prompt,
    model,
    style,
    camera: 'auto',
    aspectRatio,
    duration,
    ...sampleMedia(aspectRatio, (Math.floor(i / 3) % 3) / 3 + 0.01), // rotate clips within each aspect ratio
    published: authorId !== 'u_me' || i % 2 === 1,
    likes: 40 + ((i * 97) % 900),
    views: 900 + ((i * 1777) % 24000),
    shares: (i * 13) % 120,
    remixes: (i * 7) % 60,
    likedBy: [],
    createdAt: new Date(now - (i + 1) * 3.7 * 3600 * 1000).toISOString()
  }));
  return { users: USERS, videos, jobs: [] };
}
