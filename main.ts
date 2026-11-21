/**
 * Pack Sunline Trophy Desk for make.fun.
 * Copies app/ and screenshots/ into MAKEFUN_OUTPUT_DIR (default /output)
 * and writes dossier.json from that directory.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DossierError, buildDossier } from './vendor/makefun-frontend.ts';

/** Scorer cap: each screenshot file is at most 256 KiB. */
const SHOT_MAX_BYTES = 256 * 1024;

const repoRoot = import.meta.dirname;
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

/** Caps the scorer applies. text_max_bytes is what shapes dossier.json. */
const dossierCaps = {
  text_max_bytes: 163_840,
  app_max_files: 993,
  app_max_bytes: 50_331_648,
  screenshots: {
    max: 4,
    max_bytes: 262_144,
  },
};

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

/** Stop before the copy when the page or the screenshot folder is not there. */
function assertInputs(): void {
  const indexHtml = join(repoRoot, 'app', 'index.html');
  if (!existsSync(indexHtml)) {
    fail(`Cannot pack: app/index.html is missing (${indexHtml}).`);
  }
  const shotsDir = join(repoRoot, 'screenshots');
  if (!existsSync(shotsDir)) {
    fail(`Cannot pack: screenshots/ is missing (${shotsDir}).`);
  }
  let images = 0;
  for (const name of readdirSync(shotsDir)) {
    if (name.startsWith('.')) continue;
    const full = join(shotsDir, name);
    const info = statSync(full);
    if (!info.isFile()) continue;
    if (!/\.(png|jpe?g)$/i.test(name)) continue;
    images += 1;
    if (info.size > SHOT_MAX_BYTES) {
      fail(
        `Cannot pack: screenshots/${name} is ${info.size} bytes, over the 256 KiB cap (${SHOT_MAX_BYTES}).`,
      );
    }
  }
  if (images < 1) {
    fail(`Cannot pack: screenshots/ has no PNG or JPEG files (${shotsDir}).`);
  }
}

type CopyReport = { files: number; bytes: number };

/** Count regular files under a copied tree, skipping dot names. */
function measureTree(dir: string): CopyReport {
  let files = 0;
  let bytes = 0;
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const full = join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) {
        files += 1;
        bytes += statSync(full).size;
      }
    }
  };
  walk(dir);
  return { files, bytes };
}

function copyTree(name: 'app' | 'screenshots'): CopyReport {
  const from = join(repoRoot, name);
  const to = join(outputDir, name);
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true, dereference: true });
  return measureTree(to);
}

assertInputs();
mkdirSync(outputDir, { recursive: true });
const appCopy = copyTree('app');
const shotCopy = copyTree('screenshots');
console.log(
  `Copied ${appCopy.files} app files (${appCopy.bytes} bytes) and ${shotCopy.files} screenshots (${shotCopy.bytes} bytes)`,
);

/** Gate rule: every trophy guide is prose, not the step object. */
function assertTextGuides(): void {
  const path = join(outputDir, 'app', 'data', 'trophies.json');
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    fail(`Cannot pack: failed to read ${path} before building the dossier (${detail}).`);
  }
  if (!Array.isArray(parsed)) {
    fail(`Cannot pack: ${path} is not a trophy array, so the dossier was not built.`);
  }
  for (let index = 0; index < parsed.length; index += 1) {
    const trophy = parsed[index];
    const id =
      trophy && typeof trophy === 'object' && 'id' in trophy && typeof (trophy as { id: unknown }).id === 'string'
        ? (trophy as { id: string }).id
        : `#${index}`;
    const guide =
      trophy && typeof trophy === 'object' && 'guide' in trophy ? (trophy as { guide: unknown }).guide : undefined;
    if (typeof guide !== 'string' || guide.trim() === '') {
      fail(
        `Cannot pack: trophy ${id} has no non-blank text guide. The dossier was not built. Put the short summary in "guide" and the steps under "walkthrough".`,
      );
    }
  }
}

const dossierPath = join(outputDir, 'dossier.json');
let dossier: Uint8Array;
try {
  assertTextGuides();
  dossier = buildDossier(outputDir, dossierCaps);
} catch (err) {
  if (err instanceof DossierError) {
    const limit = err.limit === null ? '' : ` [${err.limit}]`;
    fail(`Cannot pack: ${err.message}${limit}`);
  }
  throw err;
}
writeFileSync(dossierPath, dossier);
console.log(`Wrote ${dossierPath} (${dossier.byteLength} bytes)`);
