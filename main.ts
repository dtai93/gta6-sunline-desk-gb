/**
 * Pack Sunline Trophy Desk for make.fun.
 * Copies app/ and screenshots/ into MAKEFUN_OUTPUT_DIR (default /output)
 * and writes dossier.json from that directory.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DossierError, buildDossier } from './vendor/makefun-frontend.ts';

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
    if (!statSync(full).isFile()) continue;
    if (/\.(png|jpe?g)$/i.test(name)) images += 1;
  }
  if (images < 1) {
    fail(`Cannot pack: screenshots/ has no PNG or JPEG files (${shotsDir}).`);
  }
}

function copyTree(name: 'app' | 'screenshots'): void {
  const from = join(repoRoot, name);
  const to = join(outputDir, name);
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true, dereference: true });
}

assertInputs();
mkdirSync(outputDir, { recursive: true });
copyTree('app');
copyTree('screenshots');

const dossierPath = join(outputDir, 'dossier.json');
let dossier: Uint8Array;
try {
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
