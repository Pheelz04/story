// Copies the server code and the built React app into desktop/ so Electron can bundle them.
// Run from desktop/:  node scripts/prepare.mjs   (the root `npm run build:desktop` does this for you)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const desktop = path.resolve(here, '..');
const root = path.resolve(desktop, '..');

const clientDist = path.join(root, 'client', 'dist');
if (!fs.existsSync(path.join(clientDist, 'index.html'))) {
  console.error('client/dist not found. Build the web app first: npm run build:desktop (from the project root).');
  process.exit(1);
}

const copies = [
  [path.join(root, 'server', 'src'), path.join(desktop, 'server', 'src')],
  [path.join(root, 'server', 'public'), path.join(desktop, 'server', 'public')],
  [clientDist, path.join(desktop, 'client', 'dist')]
];

for (const [from, to] of copies) {
  fs.rmSync(to, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`copied ${path.relative(root, from)} → desktop/${path.relative(desktop, to)}`);
}

// The server is ES modules; this marks desktop/server as such.
fs.writeFileSync(path.join(desktop, 'server', 'package.json'), JSON.stringify({ type: 'module' }, null, 2));

// The desktop app doesn't need the browser service worker.
fs.rmSync(path.join(desktop, 'client', 'dist', 'sw.js'), { force: true });
