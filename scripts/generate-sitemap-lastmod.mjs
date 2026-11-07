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
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }).trim();
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
  existing.prefixes?.['/browse/'],
  layoutDate,
  ...filesIn(join(ROOT, 'src/pages/browse'), '.astro').map((file) => fileDate(file)),
);


// A chunk is storage, not a shared page. Only changed card data revises its
// rendered collections; revising a song's prose leaves those dates alone.
const englishFiles = songDataFiles.filter(file => !file.endsWith('songs-chunk-spanish.json'));
const slugify = value => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\/\\]/g, '-').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const keySlug = value => slugify(value.replace('#', '-sharp'));
const holdPath = 'src/data/musicalClaimHolds.json';
const currentHolds = existsSync(join(ROOT,holdPath)) ? JSON.parse(readFileSync(join(ROOT,holdPath),'utf8')) : {};
const historicalHolds = sha => { const text=gitText(['show',`${sha}:${holdPath}`]); return text ? JSON.parse(text) : {}; };
const card = (song,holds) => [song.slug, song.title, song.primary_artist, song.default_male_key, song.default_female_key, holds[song.slug]?.tempo ? null : song.tempo_bpm, holds[song.slug]?.meter ? null : song.time_signature];
function collectionProjections(rows,holds={}) {
  const cardFor = song => card(song,holds);
  const groups = new Map();
  const add = (route, song) => { if (!groups.has(route)) groups.set(route, []); groups.get(route).push(cardFor(song)); };
  const artists = [...new Set(rows.map(song => song.primary_artist).filter(Boolean))];
  for (const song of rows) {
    groups.set(`@song/${song.slug}`, [cardFor(song)]);
    for (const artist of artists) if ((song.primary_artist || '').toLowerCase().includes(artist.toLowerCase())) add(`/browse/artists/${slugify(artist)}/`, song);
    for (const theme of new Set(song.themes || [])) add(`/browse/themes/${slugify(theme)}/`, song);
    for (const tag of new Set(song.tags || [])) add(`/browse/tags/${slugify(tag)}/`, song);
    for (const [voice, field] of [['male','default_male_key'],['female','default_female_key']]) if (song[field]) add(`/browse/keys/${voice}/${keySlug(song[field])}/`, song);
    if (song.time_signature) add(`/browse/time-signatures/${song.time_signature.replace('/', '-')}/`, song);
  }
  const sorted = [...rows].sort((a,b) => (a.title || '').localeCompare(b.title || '') || (a.primary_artist || '').localeCompare(b.primary_artist || ''));
  for (let i=0; i<sorted.length; i+=100) groups.set(i ? `/songs/page/${i/100+1}/` : '/songs/', sorted.slice(i,i+100).map(cardFor));
  return new Map([...groups].map(([route, values]) => [route, JSON.stringify(values.sort((a,b) => String(a[0]).localeCompare(String(b[0]))))]));
}
const currentEnglish = englishFiles.flatMap(file => JSON.parse(readFileSync(file,'utf8')));
const collectionPending = new Map([...collectionProjections(currentEnglish,currentHolds)].map(([route, content]) => [route, {content, date:TODAY}]));
const collectionDates = new Map();
const collectionFloor = existing.prefixes?.['/browse/'];
for (const revision of gitText(['log','--format=%H|%cs','--',...englishFiles.map(repoPath),holdPath]).split('\n').filter(Boolean)) {
  const [sha,date] = revision.split('|');
  if (collectionFloor && date < collectionFloor) {
    // Compare the first older snapshot before stopping: uncommitted changes
    // must retain today's date even when the published floor is newer.
    const priorRows = englishFiles.flatMap(file => { const text=gitText(['show',`${sha}:${repoPath(file)}`]); return text ? JSON.parse(text) : []; });
    const prior = collectionProjections(priorRows,historicalHolds(sha));
    for (const [route,current] of collectionPending) collectionDates.set(route, prior.get(route) === current.content ? collectionFloor : current.date);
    collectionPending.clear(); break;
  }
  const priorRows = englishFiles.flatMap(file => { const text=gitText(['show',`${sha}:${repoPath(file)}`]); return text ? JSON.parse(text) : []; });
  const prior = collectionProjections(priorRows,historicalHolds(sha));
  for (const [route,current] of collectionPending) {
    if (prior.get(route) === current.content) current.date = date;
    else { collectionDates.set(route,current.date); collectionPending.delete(route); }
  }
  if (!collectionPending.size) break;
}
for (const [route,current] of collectionPending) collectionDates.set(route,current.date);
const routes = {};
for (const [route,date] of collectionDates) {
  if (route.startsWith('@song/')) continue;
  const floor = existing.routes?.[route] || (route.startsWith('/songs/') ? existing.prefixes?.['/songs/'] : existing.prefixes?.['/browse/']) || existing.default;
  const next = maxDate(floor, route.startsWith('/songs/') ? songTemplateDate : browseDate, date);
  if (existing.routes?.[route] || next > floor) routes[route] = next;
}

// The editorial dictionary is storage, not a shared page template. Preserve the
// established browse floor while dating each guide from its own content history.
const editorialPath = 'public/browse-editorials.json';
const editorialRows = JSON.parse(readFileSync(join(ROOT, editorialPath), 'utf8'));
function editorialRoute(kind, slug) {
  const directory = { 'keys-female': 'keys/female', 'keys-male': 'keys/male' }[kind] || kind;
  return `/browse/${directory}/${slug}/`;
}
const pendingEditorials = new Map(Object.entries(editorialRows).flatMap(([kind, entries]) =>
  Object.entries(entries).map(([slug, entry]) =>
    [editorialRoute(kind, slug), { kind, slug, content: JSON.stringify(entry), date: TODAY }]),
));
// Removing a guide still revises its existing collection page. Keep its dated
// route in the history walk even though it is absent from the current dictionary.
for (const route of Object.keys(existing.routes || {})) {
  const match = route.match(/^\/browse\/(keys\/(?:female|male)|[^/]+)\/([^/]+)\/$/);
  if (!match || pendingEditorials.has(route)) continue;
  const kind = match[1].replace('keys/', 'keys-');
  if (editorialRows[kind]) pendingEditorials.set(route, { kind, slug: match[2], content: undefined, date: TODAY });
}
const editorialDates = new Map();
for (const revision of gitText(['log', '--format=%H|%cs', '--', editorialPath]).split('\n').filter(Boolean)) {
  if (!pendingEditorials.size) break;
  const [sha, date] = revision.split('|');
  let historical;
  try { historical = JSON.parse(gitText(['show', `${sha}:${editorialPath}`])); }
  catch { throw new Error(`Cannot read browse editorial history at ${sha}`); }
  for (const [route, current] of pendingEditorials) {
    if (JSON.stringify(historical[current.kind]?.[current.slug]) === current.content) current.date = date;
    else { editorialDates.set(route, current.date); pendingEditorials.delete(route); }
  }
  // Earlier changes cannot advance the already published shared browse floor.
  if (existing.prefixes?.['/browse/'] && date < existing.prefixes['/browse/']) break;
}
for (const [route, current] of pendingEditorials) editorialDates.set(route, current.date);
for (const [route, date] of editorialDates) {
  routes[route] = maxDate(routes[route], existing.routes?.[route], browseDate, date);
}

// Shared short key intros are also per-entry content, used by both voice routes.
const keyDescriptionPath = 'src/lib/keyDescriptions.js';
if (existsSync(join(ROOT,keyDescriptionPath))) {
  const parseIntros = text => new Map([...text.matchAll(/^\s*"([^"]+)":\s*(".*")\s*,?$/gm)].map(([,key,value]) => [key,JSON.parse(value)]));
  const pending = new Map([...parseIntros(readFileSync(join(ROOT,keyDescriptionPath),'utf8'))].map(([key,content]) => [key,{content,date:TODAY}]));
  const dates = new Map();
  for (const revision of gitText(['log','--format=%H|%cs','--',keyDescriptionPath]).split('\n').filter(Boolean)) {
    const [sha,date] = revision.split('|'); const prior=parseIntros(gitText(['show',`${sha}:${keyDescriptionPath}`]));
    for (const [key,current] of pending) {
      if (prior.get(key) === current.content) current.date=date;
      else {dates.set(key,current.date);pending.delete(key);}
    }
    if (!pending.size) break;
  }
  for (const [key,current] of pending) dates.set(key,current.date);
  for (const [key,date] of dates) for (const voice of ['male','female']) {
    const route=`/browse/keys/${voice}/${key}/`;
    const next=maxDate(routes[route],existing.routes?.[route],browseDate,date);
    if (routes[route] || existing.routes?.[route] || next > browseDate) routes[route]=next;
  }
}

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
const articleDates = [];
for (const file of filesIn(join(ROOT, 'src/content/articles'), '.md')) {
  const date = maxDate(articleTemplateDate, fileDate(file));
  routes[`/articles/${basename(file, '.md')}/`] = date;
  articleDates.push(date);
}
// The index renders each guide's title, description and word count.
routes['/articles/'] = maxDate(layoutDate, fileDate(join(ROOT, 'src/pages/articles/index.astro')), ...articleDates);

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
  if (post.slug) routes[`/blog/${post.slug}/`] = maxDate(blogTemplateDate, blogContentDates.get(post.slug), ...(post.songLinks || []).map(slug => collectionDates.get(`@song/${slug}`)));
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
