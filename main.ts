// Turkey Run: Great Escape — build entry (Node 22+ TypeScript, stdlib only).
// Copies game/ + screenshots/ into MAKEFUN_OUTPUT_DIR and writes dossier.json.
// Deterministic: two runs over the same inputs produce byte-identical output.
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
const rootDir = resolve(import.meta.dirname);

function cleanDirContents(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir).sort()) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

function copyTree(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src).sort()) {
    const s = join(src, name);
    const d = join(dest, name);
    if (statSync(s).isDirectory()) copyTree(s, d);
    else copyFileSync(s, d);
  }
}

cleanDirContents(outDir);
const gameDir = join(rootDir, 'game');
const shotsDir = join(rootDir, 'screenshots');
if (!statSync(gameDir, { throwIfNoEntry: false })?.isDirectory()) throw new Error('missing game/ dir: ' + gameDir);
if (!statSync(shotsDir, { throwIfNoEntry: false })?.isDirectory()) throw new Error('missing screenshots/ dir: ' + shotsDir);
copyTree(gameDir, join(outDir, 'game'));
copyTree(shotsDir, join(outDir, 'screenshots'));

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log('wrote ' + join(outDir, 'dossier.json') + ' (' + dossier.length + ' bytes)');
