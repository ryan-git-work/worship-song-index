import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const files=[...readFileSync(new URL('src/lib/songs.ts',root),'utf8').matchAll(/from ['"]\.\.\/\.\.\/public\/(songs-chunk-[^'"]+\.json)['"]/g)].map(m=>m[1]).filter(f=>!f.includes('spanish'));
const rows=files.flatMap(f=>JSON.parse(readFileSync(new URL('public/'+f,root),'utf8')));
const expected={'gratitude':'6/8','silent-night':'6/8','the-first-noel-traditional':'3/4','angels-we-have-heard-on-high':'4/4','o-come-all-ye-faithful':'4/4','hark-the-herald-angels-sing':'4/4','go-tell-it-on-the-mountain':'4/4','o-little-town-of-bethlehem':'4/4'};
test('eight reviewed canonical records withhold unsupported keys and BPM and scope sourced meter',()=>{
 for(const [slug,meter] of Object.entries(expected)){
  const row=rows.find(r=>r.slug===slug);assert.ok(row,slug);
  assert.deepEqual([row.default_male_key,row.default_female_key,row.tempo_bpm],[null,null,null],slug);
  assert.equal(row.time_signature,meter,slug);assert.ok(row.time_signature_scope?.length>15,slug);
  assert.match(row.editorial_markdown,/## (?:Tune|Recording) and source notes/,slug);
  assert.doesNotMatch(row.editorial_markdown,/\b\d+(?:\.\d+)?\s*bpm\b/i,slug);
 }
});
test('year-end sets use rehearsal feel rather than unsupported key and tempo defaults',()=>{
 for(const name of ['a-watchnight','an-end-of-year','new-years-eve']){
  const slug='worship-songs-for-'+name+'-service';const text=readFileSync(new URL('src/content/articles/'+slug+'.md',root),'utf8');
  assert.doesNotMatch(text,/Key of [A-G].*?BPM|approx\. \d+ BPM/);assert.match(text,/Keys are left to you and your leader/);
  assert.match(text,/Feel:/);assert.match(text,/\[.*?guide\]\(\/articles\//);
 }
});
