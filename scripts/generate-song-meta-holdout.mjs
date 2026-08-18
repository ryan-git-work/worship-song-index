import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const source = JSON.parse(readFileSync('src/data/songPageMeta.json', 'utf8'));
const assignment = {};

for (const slug of Object.keys(source).sort()) {
  const firstByte = Number.parseInt(createHash('sha1').update(slug).digest('hex').slice(0, 2), 16);
  assignment[slug] = firstByte % 10 === 0 ? 1 : 0;
}

writeFileSync('src/data/songPageMetaHoldout.json', `${JSON.stringify(assignment, null, 2)}\n`);

const holdoutCount = Object.values(assignment).filter((value) => value === 1).length;
console.log(`Wrote ${holdoutCount} holdouts across ${Object.keys(assignment).length} data-forward song pages.`);
