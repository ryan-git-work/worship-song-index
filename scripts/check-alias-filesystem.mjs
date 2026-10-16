// Case-distinct aliases must never overwrite lowercase canonical pages during
// a build on a case-insensitive filesystem (the usual macOS default).
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const { aliases } = JSON.parse(readFileSync(join(root, 'src/data/reviewedBrowseAliases.json'), 'utf8'));
const hasCaseDistinctAliases = aliases.some(({ from, to }) => from.replace(/\/$/, '').toLowerCase() === to.replace(/\/$/, '').toLowerCase() && from !== to);
if (hasCaseDistinctAliases) {
  const probe = mkdtempSync(join(root, '.wsi-case-check-'));
  let caseSensitive;
  try {
    writeFileSync(join(probe, 'CASE'), 'probe');
    caseSensitive = !existsSync(join(probe, 'case'));
  } finally {
    rmSync(probe, { recursive: true, force: true });
  }
  if (!caseSensitive) {
    console.error('WSI build stopped: case-distinct legacy aliases require a case-sensitive filesystem. Build in a case-sensitive checkout or the established Linux Replit workspace; do not publish output from this filesystem.');
    process.exit(1);
  }
}
console.log('Alias filesystem check passed.');
