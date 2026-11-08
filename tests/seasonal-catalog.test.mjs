import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const manifest = read('public/songs-manifest.json');
const additions = read('public/songs-chunk-21.json');
const expected = new Map([
  ['Come Light Our Hearts', '7054135'],
  ['O Come, All You Unfaithful', '7160115'],
  ['Sing We the Song of Emmanuel', '7078042'],
  ['He Who Is Mighty', '7031870'],
  ['Joy Has Dawned', '4408246'],
]);
const normalized = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

test('seasonal additions are exactly the five approved distinct compositions', () => {
  assert.equal(additions.length, 5);
  assert.deepEqual(new Set(additions.map(s => s.title)), new Set(expected.keys()));
  const all = manifest.chunk_files.flatMap(read);
  for (const song of additions) {
    assert.equal(all.filter(s => normalized(s.title) === normalized(song.title)).length, 1);
    assert.match(song.editorial_markdown, new RegExp('CCLI ' + expected.get(song.title)));
    assert.ok(song.editorial_markdown.includes('https://'));
    assert.doesNotMatch(JSON.stringify(song), /\/Users\/|Obsidian Vault|COWORK-|CODEX_|\/Volumes\//);
  }
});

test('version-specific source facts do not become invented generic musical values', () => {
  for (const song of additions) {
    for (const field of ['default_male_key', 'default_female_key', 'tempo_bpm', 'time_signature']) {
      assert.equal(song[field], null, song.title + ': ' + field);
    }
    assert.deepEqual(song.tags, []);
    assert.ok(song.themes.length > 0 && song.scripture_refs.length > 0);
    assert.ok(song.summary_theology.length > 40);
    assert.ok(song.practical_worship_leadership.length > 40);
    assert.ok(song.arrangement_tips.length > 40);
  }
});

test('manifest and source import include the added chunk once', () => {
  assert.equal(manifest.chunk_files.filter(f => f === 'public/songs-chunk-21.json').length, 1);
  assert.equal(manifest.chunks, manifest.chunk_files.length);
  const all = manifest.chunk_files.flatMap(read);
  assert.equal(manifest.total_songs, all.length);
  assert.equal(new Set(all.map(s => s.slug)).size, all.length);
  const source = fs.readFileSync(new URL('../src/lib/songs.ts', import.meta.url), 'utf8');
  assert.equal((source.match(/import chunk21 from '\.\.\/\.\.\/public\/songs-chunk-21\.json';/g) || []).length, 1);
  assert.equal((source.match(/\.\.\.chunk21,/g) || []).length, 1);
});
