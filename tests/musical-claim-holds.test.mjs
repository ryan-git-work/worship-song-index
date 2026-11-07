import test from 'node:test';import assert from 'node:assert/strict';
import {applyMusicalClaimHold,displayedTempo,displayedMeter,musicalClaimHolds} from '../src/lib/musicalClaims.mjs';
test('only the four source-contradicted records are held without inserting a replacement tempo',()=>{
 assert.deepEqual(Object.keys(musicalClaimHolds).sort(),['holy-is-the-lord-chris-tomlin','our-god-tomlin','see-a-victory-elevation','take-you-at-your-word']);
 for(const slug of Object.keys(musicalClaimHolds))assert.equal(displayedTempo(slug,172),null);
 assert.equal(displayedTempo('way-maker',68),68);assert.equal(displayedTempo('goodness-of-god',null),null);
 assert.equal(displayedMeter('take-you-at-your-word','12/8'),null);assert.equal(displayedMeter('our-god-tomlin','4/4'),'4/4');
});
test('presentation holds preserve stored values/identity and useful non-musical prose',()=>{
 const source={slug:'take-you-at-your-word',title:'Take You At Your Word',primary_artist:'Cody Carnes & Benjamin Hastings',tempo_bpm:172,time_signature:'12/8',themes:['trust'],editorial_markdown:'## Theology\n\nTrust Christ.\n\n## Music\n\nAt 172 BPM the band follows.\n\nThis 12/8 compound-meter claim needs proof.\n\nKeep a prayer handoff.'};
 const copy=structuredClone(source),shown=applyMusicalClaimHold(source);assert.deepEqual(source,copy);assert.equal(shown.slug,source.slug);assert.equal(shown.primary_artist,source.primary_artist);assert.equal(shown.tempo_bpm,null);assert.equal(shown.time_signature,null);assert.match(shown.editorial_markdown,/Trust Christ/);assert.match(shown.editorial_markdown,/Keep a prayer handoff/);assert.doesNotMatch(shown.editorial_markdown,/172|12\/8/);
 const other={slug:'way-maker',tempo_bpm:68};assert.equal(applyMusicalClaimHold(other),other);
});
