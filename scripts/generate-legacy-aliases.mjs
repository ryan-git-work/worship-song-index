#!/usr/bin/env node
/**
 * Explicit legacy alias map for retired /browse/ URLs (static hosting).
 *
 * Production is Replit STATIC hosting (.replit deploymentTarget = "static"), so
 * server.mjs and src/middleware.ts do not run there. This patch reuses the
 * mechanism already tested for retired song slugs
 * (astro.config.mjs `redirects`, since 1c14e29): a small HTML page at the old
 * URL that is HTTP 200, carries rel=canonical to the target, meta robots
 * noindex, and an immediate meta refresh. This script writes the explicit list
 * of old -> canonical pairs that astro.config.mjs turns into those pages, and
 * `--check` verifies the committed list still matches the catalog.
 *
 * Added 2026-10-14. Evidence: the 2026-10-09 GSC page export listed 270 URLs
 * for this domain that no longer exist in the build; 180 of them are
 * artist-name tag URLs (/browse/tags/elevation-worship/) that 818b105 stopped
 * generating when artist-name tags were consolidated onto /browse/artists/.
 *
 * Mechanisms (every pair is explicit and reviewable; there is no wildcard):
 *   artist-tag       /browse/tags/<artist>/ -> /browse/artists/<artist>/, accepted
 *                    only when every song carrying the tag is on the artist page.
 *   accent-stripped  Pre-NFD slug of an accented name (generacin-12 for
 *                    Generación 12) -> the NFD slug the site generates today.
 * Evidence labels:
 *   gsc-reported       the old URL appears with impressions in the GSC export
 *   catalog-slug-form  the raw tag value already equals its slug, so the
 *                      pre-818b105 tag page lived at exactly this URL
 *   catalog-derived    the pair follows from the catalog value alone
 * Deliberately NOT emitted: paths with uppercase, spaces, apostrophes, colons
 * or underscores. Case and space variants are not safe as static file paths and
 * the underscore themes (second_coming) resolve to a different page than the
 * hyphen theme (second-coming), so they are ambiguous. Those need separate
 * host/path validation; no hosting migration is part of this patch.
 *
 * Usage:  node scripts/generate-legacy-aliases.mjs            # write the file
 *         node scripts/generate-legacy-aliases.mjs --check    # verify, exit 1 on drift
 *         node scripts/generate-legacy-aliases.mjs --verbose  # also list rejected candidates
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUTPUT = join(ROOT, 'src/data/legacyAliases.json');
const CHECK = process.argv.includes('--check');
const VERBOSE = process.argv.includes('--verbose');

// Mirrors src/lib/browseSlugs.ts (this script cannot import TypeScript).
function slugifyBrowseValue(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\/\\]/g, '-')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
function keyToSlug(key) {
  return slugifyBrowseValue(key.replace('#', '-sharp'));
}
// The same pipeline without NFD: accented letters are dropped instead of
// transliterated ("Generación 12" -> "generacin-12").
function stripSlug(value) {
  return value
    .toLowerCase()
    .replace(/[\/\\]/g, '-')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Lowercase, hyphen-only paths are the only ones emitted as static files.
const STATIC_SAFE = /^\/browse\/(tags|themes|artists|keys\/(male|female)|time-signatures)\/[a-z0-9-]+\/$/;

// Old URLs reported with impressions in the 2026-10-09 GSC page export
// (sc-domain:worshipsongindex.com, Sep 9 to Oct 6 and the 28 days before),
// restricted to lowercase hyphen-only paths. Mixed-case and spaced variants of
// the same pages (/browse/tags/Phil%20Wickham/) were seen too and are not here.
const GSC_REPORTED = [
  '/browse/tags/aaron-shust/', '/browse/tags/alex-campos/', '/browse/tags/amy-grant/',
  '/browse/tags/brandon-heath/', '/browse/tags/brandon-lake/', '/browse/tags/brazilian-worship/',
  '/browse/tags/brenton-brown/', '/browse/tags/brooke-ligertwood/', '/browse/tags/caedmons-call/',
  '/browse/tags/chinese-worship/', '/browse/tags/chris-tomlin/', '/browse/tags/contemporary-worship/',
  '/browse/tags/danny-gokey/', '/browse/tags/don-moen/', '/browse/tags/elevation-worship/',
  '/browse/tags/fernandinho/', '/browse/tags/fernando-ortega/', '/browse/tags/hillsong/',
  '/browse/tags/israel-houghton/', '/browse/tags/jason-gray/', '/browse/tags/jason-upton/',
  '/browse/tags/jeremy-camp/', '/browse/tags/kari-jobe/', '/browse/tags/keith-getty/',
  '/browse/tags/kirk-franklin/', '/browse/tags/leeland/', '/browse/tags/lincoln-brewster/',
  '/browse/tags/matthew-west/', '/browse/tags/mosaic-msc/', '/browse/tags/nichole-nordeman/',
  '/browse/tags/passion/', '/browse/tags/pat-barrett/', '/browse/tags/paul-wilbur/',
  '/browse/tags/phil-wickham/', '/browse/tags/planetshakers/', '/browse/tags/rend-collective/',
  '/browse/tags/robin-mark/', '/browse/tags/soaking-worship/', '/browse/tags/steven-curtis-chapman/',
  '/browse/tags/tim-hughes/', '/browse/tags/traditional/', '/browse/tags/traditional-gospel/',
  '/browse/tags/twila-paris/', '/browse/tags/tye-tribbett/', '/browse/tags/vertical-worship/',
  '/browse/tags/we-are-messengers/',
  '/browse/artists/andra-crouch/', '/browse/artists/generacin-12/', '/browse/artists/hillsong-en-espaol/',
  '/browse/artists/taiz-community/', '/browse/artists/taiz-community-jacques-berthier/',
];

// Catalog, same chunk set as src/lib/songs.ts (English chunks only).
const songs = readdirSync(join(ROOT, 'public'))
  .filter((file) => /^songs-chunk-.*\.json$/.test(file) && file !== 'songs-chunk-spanish.json')
  .sort()
  .flatMap((file) => JSON.parse(readFileSync(join(ROOT, 'public', file), 'utf8')));

const songRedirects = JSON.parse(readFileSync(join(ROOT, 'src/data/songRedirects.json'), 'utf8'));

// Generated browse routes, mirroring each page's getStaticPaths.
const artistValues = new Map(); // slug -> raw primary_artist values
const tagValues = new Map();
const themeValues = new Map();
function collect(map, raw) {
  const slug = slugifyBrowseValue(raw);
  if (!map.has(slug)) map.set(slug, new Set());
  map.get(slug).add(raw);
}
for (const song of songs) {
  collect(artistValues, song.primary_artist);
  for (const tag of song.tags ?? []) collect(tagValues, tag);
  for (const theme of song.themes ?? []) collect(themeValues, theme);
}

const routes = new Set();
for (const slug of artistValues.keys()) routes.add(`/browse/artists/${slug}/`);
for (const slug of tagValues.keys()) if (!artistValues.has(slug)) routes.add(`/browse/tags/${slug}/`);
for (const slug of themeValues.keys()) routes.add(`/browse/themes/${slug}/`);
for (const song of songs) {
  if (song.default_male_key) routes.add(`/browse/keys/male/${keyToSlug(song.default_male_key)}/`);
  if (song.default_female_key) routes.add(`/browse/keys/female/${keyToSlug(song.default_female_key)}/`);
  if (song.time_signature) routes.add(`/browse/time-signatures/${song.time_signature.replace('/', '-')}/`);
  routes.add(`/songs/${song.slug}/`);
}
for (const from of Object.keys(songRedirects)) routes.add(`/songs/${from}/`);

// stripped slug -> NFD slug, per facet, for accented values.
function strippedMap(values) {
  const map = new Map();
  for (const [slug, raws] of values) {
    for (const raw of raws) {
      const stripped = stripSlug(raw);
      if (stripped && stripped !== slug) {
        if (map.has(stripped) && map.get(stripped) !== slug) {
          throw new Error(`ambiguous historical slug ${stripped}: ${map.get(stripped)} vs ${slug}`);
        }
        map.set(stripped, slug);
      }
    }
  }
  return map;
}
const strippedArtists = strippedMap(artistValues);
const strippedTags = strippedMap(tagValues);
const strippedThemes = strippedMap(themeValues);

// Song-set proof for tag -> artist: every song carrying the tag must appear on
// the artist page (same match as src/pages/browse/artists/[artist].astro).
const proofCache = new Map();
function artistTagProof(slug) {
  if (proofCache.has(slug)) return proofCache.get(slug);
  const tagged = songs.filter((song) => (song.tags ?? []).some((tag) => slugifyBrowseValue(tag) === slug)).map((song) => song.slug);
  const onArtistPage = new Set();
  for (const raw of artistValues.get(slug) ?? []) {
    const lower = raw.toLowerCase();
    for (const song of songs) {
      const songArtist = (song.primary_artist || '').toLowerCase();
      if (songArtist === lower || songArtist.includes(lower)) onArtistPage.add(song.slug);
    }
  }
  const missing = tagged.filter((songSlug) => !onArtistPage.has(songSlug)).length;
  const proof = {
    ok: missing === 0,
    note: missing === 0 ? null : `tag has ${missing} of ${tagged.length} songs not on the artist page (${onArtistPage.size} songs)`,
  };
  proofCache.set(slug, proof);
  return proof;
}

const aliases = new Map(); // from -> { from, to, mechanism, evidence }
const rejected = [];
function propose(from, to, mechanism, evidence, note = null) {
  if (!STATIC_SAFE.test(from)) return rejected.push({ from, to, mechanism, why: 'path not static-safe' });
  if (routes.has(from)) return rejected.push({ from, to, mechanism, why: 'a real page exists at this path' });
  if (!routes.has(to)) return rejected.push({ from, to, mechanism, why: 'target page does not exist' });
  if (from === to) return;
  if (note) return rejected.push({ from, to, mechanism, why: note });
  const existing = aliases.get(from);
  if (existing) {
    if (existing.to !== to) throw new Error(`conflicting targets for ${from}: ${existing.to} vs ${to}`);
    if (!existing.evidence.includes(evidence)) existing.evidence.push(evidence);
    return;
  }
  aliases.set(from, { from, to, mechanism, evidence: [evidence] });
}

// This exact old tag URL was independently fetched as 404 on October 14;
// its artist successor was 200. The original accented tag value has already
// been normalized in the catalog, so the historical spelling is no longer
// derivable from today's raw tags. Preserve the verified exception explicitly.
propose('/browse/tags/generacin-12/', '/browse/artists/generacion-12/',
  'accent-stripped', 'live-verified-2026-10-14', artistTagProof('generacion-12').note);

// artist-tag for every GSC-reported lowercase tag URL whose slug is an artist.
// accent-stripped for GSC-reported artist URLs whose slug is a stripped form.
for (const from of GSC_REPORTED) {
  const tag = from.match(/^\/browse\/tags\/([a-z0-9-]+)\/$/);
  if (tag && artistValues.has(tag[1])) {
    const proof = artistTagProof(tag[1]);
    propose(from, `/browse/artists/${tag[1]}/`, 'artist-tag', 'gsc-reported', proof.note);
    continue;
  }
  if (tag && strippedTags.has(tag[1])) {
    const slug = strippedTags.get(tag[1]);
    const to = artistValues.has(slug) ? `/browse/artists/${slug}/` : `/browse/tags/${slug}/`;
    propose(from, to, 'accent-stripped', 'gsc-reported', artistValues.has(slug) ? artistTagProof(slug).note : null);
    continue;
  }
  const artist = from.match(/^\/browse\/artists\/([a-z0-9-]+)\/$/);
  if (artist && strippedArtists.has(artist[1])) {
    propose(from, `/browse/artists/${strippedArtists.get(artist[1])}/`, 'accent-stripped', 'gsc-reported');
    continue;
  }
  rejected.push({ from, to: null, mechanism: null, why: 'no catalog rule resolves this GSC-reported path' });
}

// artist-tag where the raw tag value already equals its slug, so the
// pre-818b105 tag page lived at exactly /browse/tags/<slug>/.
for (const [slug, raws] of tagValues) {
  if (!artistValues.has(slug)) continue;
  if (![...raws].some((raw) => raw === slug)) continue;
  propose(`/browse/tags/${slug}/`, `/browse/artists/${slug}/`, 'artist-tag', 'catalog-slug-form', artistTagProof(slug).note);
}

// accent-stripped, derived from the catalog for every accented value.
for (const [stripped, slug] of strippedArtists) {
  propose(`/browse/artists/${stripped}/`, `/browse/artists/${slug}/`, 'accent-stripped', 'catalog-derived');
}
for (const [stripped, slug] of strippedTags) {
  if (artistValues.has(slug)) {
    propose(`/browse/tags/${stripped}/`, `/browse/artists/${slug}/`, 'accent-stripped', 'catalog-derived', artistTagProof(slug).note);
  } else {
    propose(`/browse/tags/${stripped}/`, `/browse/tags/${slug}/`, 'accent-stripped', 'catalog-derived');
  }
}
for (const [stripped, slug] of strippedThemes) {
  propose(`/browse/themes/${stripped}/`, `/browse/themes/${slug}/`, 'accent-stripped', 'catalog-derived');
}

// No chains: a target is never itself an alias source.
for (const alias of aliases.values()) {
  if (aliases.has(alias.to)) throw new Error(`redirect chain: ${alias.from} -> ${alias.to} -> ${aliases.get(alias.to).to}`);
}

const output = {
  about: 'Explicit legacy aliases for retired /browse/ URLs. Generated by scripts/generate-legacy-aliases.mjs; astro.config.mjs emits each as a static redirect page (HTTP 200, canonical, noindex, meta refresh) and keeps it out of the sitemap. Edit the script, not this file.',
  aliases: [...aliases.values()]
    .map((alias) => ({ ...alias, evidence: [...alias.evidence].sort() }))
    .sort((left, right) => left.from.localeCompare(right.from)),
};
const text = `${JSON.stringify(output, null, 2)}\n`;

const count = (key, value) => output.aliases.filter((alias) => alias[key] === value || (Array.isArray(alias[key]) && alias[key].includes(value))).length;
console.log(`${output.aliases.length} legacy aliases: mechanism artist-tag ${count('mechanism', 'artist-tag')}, accent-stripped ${count('mechanism', 'accent-stripped')}; evidence gsc-reported ${count('evidence', 'gsc-reported')}, catalog-slug-form ${count('evidence', 'catalog-slug-form')}, catalog-derived ${count('evidence', 'catalog-derived')}; ${rejected.length} candidates rejected.`);
if (VERBOSE) {
  for (const entry of rejected) console.log(`  rejected ${entry.from} -> ${entry.to} [${entry.mechanism}]: ${entry.why}`);
}

if (CHECK) {
  let current = '';
  try { current = readFileSync(OUTPUT, 'utf8'); } catch { /* missing file fails below */ }
  if (current !== text) {
    console.error('src/data/legacyAliases.json is out of date; run node scripts/generate-legacy-aliases.mjs');
    process.exit(1);
  }
  console.log('src/data/legacyAliases.json matches the catalog.');
} else {
  writeFileSync(OUTPUT, text);
  console.log(`Wrote ${OUTPUT.replace(ROOT, '')}`);
}
