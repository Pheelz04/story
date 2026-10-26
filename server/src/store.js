// Tiny JSON-file store. Good enough for a demo; replace with Postgres/Mongo later.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedData } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// LAMBA_DATA_DIR lets the desktop app keep data in the user's AppData folder.
const DATA_DIR = process.env.LAMBA_DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let db;
let saveTimer = null;

export function loadDb() {
  if (db) return db;
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    db = seedData();
    persist();
  }
  return db;
}

export function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }, 150);
}

export function resetDb() {
  db = seedData();
  persist();
  return db;
}
