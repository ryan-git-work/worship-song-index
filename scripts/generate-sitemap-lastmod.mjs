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
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();
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
// A song chunk is storage, not an editorial unit. Date each song from its own
// content history so revising one entry cannot redate its untouched neighbors.
function songContentDates(file, rows) {
  const floor = rows.map(song => existing.routes?.[`/songs/${song.slug}/`])
    .filter(Boolean).sort().at(0);
  const pending = new Map(rows.filter(song => song.slug).map(song =>
    [song.slug, { content: JSON.stringify(song), date: TODAY }],
  ));
  const dates = new Map();
  for (const revision of gitText(['log', '--format=%H|%cs', '--', repoPath(file)]).split('\n').filter(Boolean)) {
    if (!pending.size) break;
    const [sha, date] = revision.split('|');
    let historical;
    try { historical = JSON.parse(gitText(['show', `${sha}:${repoPath(file)}`])); }
    catch { throw new Error(`Cannot read song history for ${repoPath(file)} at ${sha}`); }
    const prior = new Map(historical.map(song => [song.slug, JSON.stringify(song)]));
    for (const [slug, current] of pending) {
      if (prior.get(slug) === current.content) current.date = date;
      else { dates.set(slug, current.date); pending.delete(slug); }
    }
    // Earlier history cannot advance a date already recorded for this page.
    if (floor && date < floor) break;
  }
  for (const [slug, current] of pending) dates.set(slug, current.date);
  return dates;
}
for (const file of songDataFiles) {
  const rows = JSON.parse(readFileSync(file, 'utf8'));
  const contentDates = songContentDates(file, rows);
  for (const song of rows) {
    if (!song.slug) continue;
    const dataDate = contentDates.get(song.slug);
    routes[`/songs/${song.slug}/`] = maxDate(existing.routes?.[`/songs/${song.slug}/`], songTemplateDate, dataDate);
    if (file.endsWith('songs-chunk-spanish.json')) {
      routes[`/canciones/${song.slug}/`] = maxDate(existing.routes?.[`/canciones/${song.slug}/`], layoutDate, dataDate, fileDate(join(ROOT, 'src/pages/canciones/[slug].astro')));
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

const blogTemplateDate = maxDate(layoutDate, fileDate(join(ROOT, 'src/pages/blog/[slug].astro')));
const blogRows = JSON.parse(readFileSync(join(ROOT, 'public/blog-posts.json'), 'utf8'));
// A shared JSON file changing does not mean every guide was revised. Walk the
// file's history once and date each row from its most recent content change.
const pendingBlogRows = new Map(blogRows.filter((post) => post.slug).map((post) =>
  [post.slug, { content: JSON.stringify(post), date: TODAY }],
));
const blogContentDates = new Map();
for (const revision of gitText(['log', '--format=%H|%cs', '--', 'public/blog-posts.json']).split('\n').filter(Boolean)) {
  if (!pendingBlogRows.size) break;
  const [sha, date] = revision.split('|');
  let historical;
  try { historical = JSON.parse(gitText(['show', `${sha}:public/blog-posts.json`])); }
  catch { break; }
  const priorRows = new Map(historical.map((post) => [post.slug, JSON.stringify(post)]));
  for (const [slug, current] of pendingBlogRows) {
    if (priorRows.get(slug) === current.content) current.date = date;
    else {
      blogContentDates.set(slug, current.date);
      pendingBlogRows.delete(slug);
    }
  }
}
for (const [slug, current] of pendingBlogRows) blogContentDates.set(slug, current.date);
const blogDate = maxDate(blogTemplateDate, ...blogContentDates.values());
for (const post of blogRows) {
  if (post.slug) routes[`/blog/${post.slug}/`] = maxDate(blogTemplateDate, blogContentDates.get(post.slug));
}

// A homepage edit changes the homepage, not every route that falls back to the
// default date. Keep that date stable and date the homepage explicitly.
routes['/'] = maxDate(layoutDate, fileDate(join(ROOT, 'src/pages/index.astro')),
  ...songDataFiles.map(file => fileDate(file)));
const output = {
  default: maxDate(layoutDate, existing.default),
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
