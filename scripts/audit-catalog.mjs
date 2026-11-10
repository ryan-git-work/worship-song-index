import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSongSearchIndex, isDiscoverableSong, hasUnverifiedMusicalMetadata } from '../src/lib/songDiscovery.mjs';

export function auditCatalog(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const identity = `${row.title}|${row.primary_artist}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!grouped.has(identity)) grouped.set(identity, []);
    grouped.get(identity).push(row);
  }
  const duplicateGroups = [...grouped.entries()].filter(([,group])=>group.length>1).map(([identity,group])=>({
    identity,
    slugs: group.map(row=>row.slug),
    values: group.map(row=>({slug:row.slug,maleKey:row.default_male_key,femaleKey:row.default_female_key,bpm:row.tempo_bpm,meter:row.time_signature,confidence:row.metadata_confidence??null,discoverable:isDiscoverableSong(row)})),
    conflictingMusic: new Set(group.map(row=>JSON.stringify([row.default_male_key,row.default_female_key,row.tempo_bpm,row.time_signature]))).size>1,
  }));
  const search = buildSongSearchIndex(rows);
  const counts = new Map(); for(const row of rows) counts.set(row.slug,(counts.get(row.slug)||0)+1);
  return {
    note:'Title/artist matches are review candidates, not automatic merge decisions. Distinct tunes and arrangements require source verification. No URLs are deleted or deindexed by this audit.',
    counts:{catalog:rows.length,search:search.length,hiddenFromDiscovery:rows.filter(row=>!isDiscoverableSong(row)).length,metadataUnverified:rows.filter(hasUnverifiedMusicalMetadata).length,duplicateGroups:duplicateGroups.length,conflictingMusicGroups:duplicateGroups.filter(group=>group.conflictingMusic).length},
    duplicateSlugs:[...counts].filter(([,count])=>count>1).map(([slug,count])=>({slug,count})),
    hiddenFromDiscovery:rows.filter(row=>!isDiscoverableSong(row)).map(row=>row.slug),
    duplicateGroups,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = new URL('../',import.meta.url);
  // Use the exact imports that feed the app, never an obsolete manifest/count.
  const source = readFileSync(new URL('src/lib/songs.ts',root),'utf8');
  const files = [...source.matchAll(/from ['"]\.\.\/\.\.\/public\/(songs-chunk-[^'"]+\.json)['"]/g)].map(match=>match[1]).filter(file=>!file.includes('spanish'));
  const rows = files.flatMap(file=>JSON.parse(readFileSync(new URL(`public/${file}`,root),'utf8')));
  const report = auditCatalog(rows);
  const outputIndex = process.argv.indexOf('--output');
  if(outputIndex !== -1) {
    const path = process.argv[outputIndex+1];if(!path)throw new Error('--output requires a path');
    writeFileSync(path,JSON.stringify(report,null,2)+'\n');
  }
  console.log(JSON.stringify(report.counts,null,2));
  if(report.duplicateSlugs.length) {console.error('Duplicate route slugs:',report.duplicateSlugs);process.exitCode=1;}
}
