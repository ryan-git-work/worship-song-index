import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { buildSongSearchIndex, isDiscoverableSong } from '../src/lib/songDiscovery.mjs';
import integrity from '../src/data/catalogIntegrity.json' with {type:'json'};
import redirects from '../src/data/songRedirects.json' with {type:'json'};
const fixture = (slug, extra={}) => ({slug,title:'Example',primary_artist:'Artist',default_male_key:'G',default_female_key:'C',tempo_bpm:80,time_signature:'4/4',...extra});
const rows = readdirSync(new URL('../public/',import.meta.url))
  .filter(file => /^songs-chunk-.*\.json$/.test(file) && !file.includes('spanish'))
  .flatMap(file => JSON.parse(readFileSync(new URL(`../public/${file}`,import.meta.url),'utf8')));

test('discovery excludes every quarantined/deleted/retired catalog slug', () => {
  const forbidden = new Set([...integrity.deleted,...integrity.quarantined,...Object.keys(redirects)]);
  const index = buildSongSearchIndex(rows);
  assert.ok(index.length > 2500);
  for (const row of index) assert.ok(!forbidden.has(row.s),row.s);
  for (const slug of forbidden) assert.equal(isDiscoverableSong(fixture(slug)),false,slug);
  assert.equal(isDiscoverableSong(fixture('new-hold',{quarantined:true})),false);
});

test('filtering before deduplication does not hide a valid same-title sibling', () => {
  assert.deepEqual(buildSongSearchIndex([fixture('hidden',{quarantined:true}),fixture('valid')]).map(s=>s.s),['valid']);
});

test('verified songs with unverified music stay findable without false values', () => {
  for (const metadata_confidence of ['unverified_metadata','song_verified_metadata_unverified']) {
    const [row] = buildSongSearchIndex([fixture('valid',{metadata_confidence})]);
    assert.deepEqual([row.m,row.f,row.b,row.x],[null,null,null,null]);
    assert.equal(row.s,'valid');
  }
});

test('sourced catalog values and narrow claim holds are preserved', () => {
  const [verified] = buildSongSearchIndex([fixture('way-maker',{tempo_bpm:68})]);
  assert.deepEqual([verified.m,verified.f,verified.b,verified.x],['G','C',68,'4/4']);
  const [held] = buildSongSearchIndex([fixture('take-you-at-your-word')]);
  assert.equal(held.b,null);assert.equal(held.x,null);
});

test('the full search payload obeys song-page metadata suppression without mutating data', () => {
  const before = JSON.stringify(rows);
  const source = new Map(rows.map(row=>[row.slug,row]));
  const index = buildSongSearchIndex(rows);
  for (const row of index) {
    if (['unverified_metadata','song_verified_metadata_unverified'].includes(source.get(row.s).metadata_confidence)) {
      assert.deepEqual([row.m,row.f,row.b,row.x],[null,null,null,null],row.s);
    }
  }
  assert.equal(JSON.stringify(rows),before);
});
