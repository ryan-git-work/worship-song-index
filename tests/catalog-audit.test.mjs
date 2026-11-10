import test from 'node:test';
import assert from 'node:assert/strict';
import {auditCatalog} from '../scripts/audit-catalog.mjs';
const row=(slug,extra={})=>({slug,title:'Example',primary_artist:'Artist',default_male_key:'G',default_female_key:'C',tempo_bpm:80,time_signature:'4/4',...extra});
test('catalog audit separates duplicated identities, musical disagreements and route collisions',()=>{
 const r=auditCatalog([row('one'),row('two',{tempo_bpm:90}),row('three',{title:'Other'}),row('three',{title:'Duplicate slug'})]);
 assert.equal(r.counts.catalog,4);assert.equal(r.counts.duplicateGroups,1);assert.equal(r.counts.conflictingMusicGroups,1);
 assert.deepEqual(r.duplicateGroups[0].slugs,['one','two']);assert.deepEqual(r.duplicateSlugs,[{slug:'three',count:2}]);
});
test('audit never treats a quarantine or confidence hold as proof a song is false',()=>{
 const r=auditCatalog([row('one',{quarantined:true}),row('two',{metadata_confidence:'unverified_metadata'})]);
 assert.equal(r.counts.hiddenFromDiscovery,1);assert.equal(r.counts.metadataUnverified,1);assert.equal(r.counts.search,1);
 assert.match(r.note,/review candidates, not automatic merge decisions/);
});
