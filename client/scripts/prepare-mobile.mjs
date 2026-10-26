// After `vite build --mode mobile --outDir dist-mobile`: bundle the sample clips into the
// Android app (so it works with no server) and drop the browser-only service worker.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const client = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(client, 'dist-mobile');
const samples = path.join(client, '..', 'server', 'public', 'samples');

if (!fs.existsSync(path.join(out, 'index.html'))) {
  console.error('dist-mobile not found. Run: npm run build:mobile (from the project root).');
  process.exit(1);
}
fs.cpSync(samples, path.join(out, 'samples'), { recursive: true });
fs.rmSync(path.join(out, 'sw.js'), { force: true });
console.log('Android web bundle ready in client/dist-mobile');
