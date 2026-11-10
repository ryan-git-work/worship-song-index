import test from 'node:test';import assert from 'node:assert/strict';
import {canonicalSongSlug,canonicalSongSelection} from '../src/lib/songSelection.mjs';
test('reviewed aliases resolve directly and cycles fail loudly',()=>{
 assert.equal(canonicalSongSlug('gratitude-lake'),'gratitude');assert.equal(canonicalSongSlug('silent-night-traditional'),'silent-night');
 assert.equal(canonicalSongSlug('untouched'),'untouched');assert.equal(canonicalSongSlug('a',{a:'b',b:'c'}),'c');assert.throws(()=>canonicalSongSlug('a',{a:'b',b:'a'}),/cycle/);
});
test('collections preserve taxonomy access while using only canonical source facts',()=>{
 const alias={slug:'old',tempo_bpm:90},canonical={slug:'new',tempo_bpm:null},other={slug:'other',tempo_bpm:80};const catalog=[alias,canonical,other];
 assert.deepEqual(canonicalSongSelection([alias,canonical,other],catalog,{old:'new'}),[canonical,other]);
 assert.equal(alias.tempo_bpm,90);assert.throws(()=>canonicalSongSelection([alias],[alias],{old:'missing'}),/Missing canonical/);
});
