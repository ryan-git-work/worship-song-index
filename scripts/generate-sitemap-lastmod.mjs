import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

const ROOT = process.cwd();
const OUTPUT = join(ROOT, 'src/data/sitemapLastmod.json');
const TODAY = new Date().toISOString().slice(0, 10);
const existing = existsSync(OUTPUT) ? JSON.parse(readFileSync(OUTPUT, 'utf8')) : {};

function repoPath(file) {
  return relative(ROOT, file).replaceAll('\\', '/');
}

function gitText(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function fileDate(file, fallback = existing.default || '2026-03-03') {
  const path = repoPath(file);
  if (gitText(['status', '--porcelain', '--', path])) return TODAY;
  return gitText(['log', '-1', '--format=%cs', '--', path]) || fallback;
}

function maxDate(...dates) {
  return dates.filter(Boolean).sort().at(-1) || existing.default || '2026-03-03';
}

function filesIn(directory, suffix) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return filesIn(file, suffix);
    return entry.name.endsWith(suffix) ? [file] : [];
  });
}

const layoutDate = fileDate(join(ROOT, 'src/layouts/Layout.astro'));
const songTemplateDate = maxDate(
  layoutDate,
  fileDate(join(ROOT, 'src/pages/songs/[slug].astro')),
  fileDate(join(ROOT, 'src/data/songPageMeta.json')),
  fileDate(join(ROOT, 'src/data/songPageMetaHoldout.json')),
);
const songDataFiles = filesIn(join(ROOT, 'public'), '.json')
  .filter((file) => basename(file).startsWith('songs-chunk-'));
const browseDate = maxDate(
  layoutDate,
  ...filesIn(join(ROOT, 'src/pages/browse'), '.astro').map((file) => fileDate(file)),
  fileDate(join(ROOT, 'public/browse-editorials.json')),
  ...songDataFiles.map((file) => fileDate(file)),
);

const routes = {};
for (const file of songDataFiles) {
  const dataDate = fileDate(file);
  const rows = JSON.parse(readFileSync(file, 'utf8'));
  for (const song of rows) {
    if (!song.slug) continue;
    routes[`/songs/${song.slug}/`] = maxDate(songTemplateDate, dataDate);
    if (file.endsWith('songs-chunk-spanish.json')) {
      routes[`/canciones/${song.slug}/`] = maxDate(layoutDate, dataDate, fileDate(join(ROOT, 'src/pages/canciones/[slug].astro')));
    }
  }
}

const articleTemplateDate = maxDate(layoutDate, fileDate(join(ROOT, 'src/pages/articles/[slug].astro')));
for (const file of filesIn(join(ROOT, 'src/content/articles'), '.md')) {
  routes[`/articles/${basename(file, '.md')}/`] = maxDate(articleTemplateDate, fileDate(file));
}

const devotionalTemplateDate = maxDate(layoutDate, fileDate(join(ROOT, 'src/pages/worship-team-devotionals/[pillar]/[slug].astro')));
for (const file of filesIn(join(ROOT, 'src/content/devotionals'), '.mdx')) {
  const parts = repoPath(file).replace('src/content/devotionals/', '').replace(/\.mdx$/, '').split('/');
  routes[`/worship-team-devotionals/${parts.join('/')}/`] = maxDate(devotionalTemplateDate, fileDate(file));
}

const blogDate = maxDate(layoutDate, fileDate(join(ROOT, 'src/pages/blog/[slug].astro')), fileDate(join(ROOT, 'public/blog-posts.json')));
const blogRows = JSON.parse(readFileSync(join(ROOT, 'public/blog-posts.json'), 'utf8'));
for (const post of blogRows) {
  if (post.slug) routes[`/blog/${post.slug}/`] = blogDate;
}

const output = {
  default: maxDate(layoutDate, fileDate(join(ROOT, 'src/pages/index.astro'))),
  prefixes: {
    '/articles/': articleTemplateDate,
    '/blog/': blogDate,
    '/browse/': browseDate,
    '/canciones/': maxDate(layoutDate, fileDate(join(ROOT, 'src/pages/canciones/[slug].astro'))),
    '/songs/': songTemplateDate,
    '/worship-team-devotionals/': devotionalTemplateDate,
  },
  routes: Object.fromEntries(Object.entries(routes).sort(([left], [right]) => left.localeCompare(right))),
};

writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote honest lastmod dates for ${Object.keys(routes).length.toLocaleString()} routes.`);
