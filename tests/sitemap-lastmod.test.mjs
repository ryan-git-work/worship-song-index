import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, rm, copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';

const baselineDate='2026-09-26';
const today=new Date().toISOString().slice(0,10);
async function fixture(run) {
  const root=await mkdtemp(join(tmpdir(),'wsi-lastmod-'));
  const files={
    'src/layouts/Layout.astro':'layout', 'src/pages/index.astro':'home',
    'src/pages/songs/[slug].astro':'song', 'src/pages/blog/[slug].astro':'blog',
    'src/pages/browse/index.astro':'browse', 'src/pages/articles/[slug].astro':'article',
    'src/pages/canciones/[slug].astro':'spanish',
    'src/pages/worship-team-devotionals/[pillar]/[slug].astro':'devotional',
    'src/data/songPageMeta.json':'{}', 'src/data/songPageMetaHoldout.json':'{}',
    'public/songs-chunk-1.json':'[{"slug":"example"}]',
    'public/browse-editorials.json':'{}', 'public/blog-posts.json':'[]',
    'src/data/sitemapLastmod.json':JSON.stringify({default:baselineDate,prefixes:{},routes:{}}),
  };
  try {
    for (const [name,body] of Object.entries(files)) {
      await mkdir(join(root,name,'..'),{recursive:true});
      await writeFile(join(root,name),body);
    }
    for (const name of ['src/content/articles','src/content/devotionals','scripts']) await mkdir(join(root,name),{recursive:true});
    await copyFile(new URL('../scripts/generate-sitemap-lastmod.mjs',import.meta.url),join(root,'scripts/generate-sitemap-lastmod.mjs'));
    const git=(...args)=>execFileSync('git',args,{cwd:root,stdio:'pipe',env:{...process.env,GIT_AUTHOR_DATE:baselineDate+'T12:00:00Z',GIT_COMMITTER_DATE:baselineDate+'T12:00:00Z'}});
    git('init','-q');git('config','user.name','Local test');git('config','user.email','local-test@example.invalid');git('add','.');git('commit','-qm','fixture');
    const generate=async()=>{
      execFileSync(process.execPath,['scripts/generate-sitemap-lastmod.mjs'],{cwd:root,stdio:'pipe'});
      return JSON.parse(await readFile(join(root,'src/data/sitemapLastmod.json'),'utf8'));
    };
    await run({root,generate});
  } finally {await rm(root,{recursive:true,force:true});}
}

test('clean rebuild dates come from source history, not today',()=>fixture(async({generate})=>{
  const first=await generate();const second=await generate();
  assert.deepEqual(second,first);
  assert.equal(first.default,baselineDate);
  assert.equal(first.routes['/'],baselineDate);
  assert.equal(first.routes['/songs/example/'],baselineDate);
}));

test('a homepage edit advances only the homepage date',()=>fixture(async({root,generate})=>{
  const before=await generate();await writeFile(join(root,'src/pages/index.astro'),'corrected catalog count');
  const after=await generate();assert.equal(after.routes['/'],today);
  delete before.routes['/'];delete after.routes['/'];assert.deepEqual(after,before);
}));

test('a real shared-layout edit retains the existing template date policy',()=>fixture(async({root,generate})=>{
  await generate();await writeFile(join(root,'src/layouts/Layout.astro'),'changed structured data');
  const after=await generate();assert.equal(after.default,today);
  assert.equal(after.routes['/songs/example/'],today);
  assert.ok(Object.values(after.prefixes).every(date=>date===today));
}));

test('a song revision preserves the date of an unchanged chunk neighbor',()=>fixture(async({root,generate})=>{
  const data='public/songs-chunk-1.json';
  await writeFile(join(root,data),JSON.stringify([{slug:'example',title:'Before'},{slug:'neighbor',title:'Unchanged'}]));
  const env={...process.env,GIT_AUTHOR_DATE:baselineDate+'T12:00:00Z',GIT_COMMITTER_DATE:baselineDate+'T12:00:00Z'};
  execFileSync('git',['add',data],{cwd:root,env});
  execFileSync('git',['commit','-qm','two source songs'],{cwd:root,env});
  const before=await generate();
  await writeFile(join(root,data),JSON.stringify([{slug:'example',title:'Revised'},{slug:'neighbor',title:'Unchanged'}]));
  const after=await generate();
  assert.equal(after.routes['/songs/example/'],today);
  assert.equal(after.routes['/songs/neighbor/'],before.routes['/songs/neighbor/']);
  assert.equal(after.routes['/songs/neighbor/'],baselineDate);
}));

test('new songs get their introduction date and committed rebuilds remain stable',()=>fixture(async({root,generate})=>{
  const data='public/songs-chunk-new.json';
  await writeFile(join(root,data),JSON.stringify([{slug:'new-song',title:'New'}]));
  const uncommitted=await generate();assert.equal(uncommitted.routes['/songs/new-song/'],today);
  assert.equal(uncommitted.routes['/'],today, 'the homepage count changes with the catalog');
  const env={...process.env,GIT_AUTHOR_DATE:today+'T12:00:00Z',GIT_COMMITTER_DATE:today+'T12:00:00Z'};
  execFileSync('git',['add',data],{cwd:root,env});
  execFileSync('git',['commit','-qm','introduce new song'],{cwd:root,env});
  const first=await generate();const second=await generate();assert.deepEqual(first,second);
  assert.equal(first.routes['/songs/new-song/'],today);
  assert.equal(first.routes['/songs/example/'],baselineDate);
}));

test('real-sized song chunks do not overflow Git reads and get false current dates',()=>fixture(async({root,generate})=>{
  const data='public/songs-chunk-1.json';
  await writeFile(join(root,data),JSON.stringify([{slug:'example',editorial_markdown:'source '.repeat(180000)}]));
  const env={...process.env,GIT_AUTHOR_DATE:baselineDate+'T12:00:00Z',GIT_COMMITTER_DATE:baselineDate+'T12:00:00Z'};
  execFileSync('git',['add',data],{cwd:root,env});
  execFileSync('git',['commit','-qm','real sized source chunk'],{cwd:root,env});
  const dates=await generate();assert.equal(dates.routes['/songs/example/'],baselineDate);
}));

test('a browse guide edit dates only that guide, not its dictionary neighbors or browse prefix',()=>fixture(async({root,generate})=>{
  const data='public/browse-editorials.json';
  const entries={themes:{eternity:{editorial_markdown:'Original'},hope:{editorial_markdown:'Unchanged'}}};
  await writeFile(join(root,data),JSON.stringify(entries));
  const env={...process.env,GIT_AUTHOR_DATE:baselineDate+'T12:00:00Z',GIT_COMMITTER_DATE:baselineDate+'T12:00:00Z'};
  execFileSync('git',['add',data],{cwd:root,env});
  execFileSync('git',['commit','-qm','two existing guides'],{cwd:root,env});
  const before=await generate();
  entries.themes.eternity.editorial_markdown='Revised';
  entries.themes['following-jesus']={editorial_markdown:'New guide on existing collection'};
  await writeFile(join(root,data),JSON.stringify(entries));
  const after=await generate();
  assert.equal(after.routes['/browse/themes/eternity/'],today);
  assert.equal(after.routes['/browse/themes/following-jesus/'],today);
  assert.equal(after.routes['/browse/themes/hope/'],before.routes['/browse/themes/hope/']);
  assert.equal(after.prefixes['/browse/'],before.prefixes['/browse/']);
  assert.equal(after.routes['/songs/example/'],before.routes['/songs/example/']);
  execFileSync('git',['add',data],{cwd:root,env});
  execFileSync('git',['commit','-qm','reviewed guide update'],{cwd:root,env:{...env,GIT_AUTHOR_DATE:today+'T12:00:00Z',GIT_COMMITTER_DATE:today+'T12:00:00Z'}});
  const clean=await generate();assert.deepEqual(await generate(),clean);
  assert.equal(clean.routes['/browse/themes/eternity/'],today);
  assert.equal(clean.routes['/browse/themes/hope/'],baselineDate);
}));

test('an occasion edit dates its page and rendered index without redating other occasions',()=>fixture(async({root,generate})=>{
  const env={...process.env,GIT_AUTHOR_DATE:baselineDate+'T12:00:00Z',GIT_COMMITTER_DATE:baselineDate+'T12:00:00Z'};
  for (const slug of ['veterans-day','advent']) await writeFile(join(root,'src/content/articles',slug+'.md'),slug);
  execFileSync('git',['add','src/content/articles'],{cwd:root,env});
  execFileSync('git',['commit','-qm','existing occasions'],{cwd:root,env});
  const before=await generate();
  await writeFile(join(root,'src/content/articles/veterans-day.md'),'corrected facts and word count');
  const after=await generate();
  assert.equal(after.routes['/articles/veterans-day/'],today);
  assert.equal(after.routes['/articles/'],today);
  assert.equal(after.routes['/articles/advent/'],before.routes['/articles/advent/']);
  assert.equal(after.prefixes['/articles/'],before.prefixes['/articles/']);
}));

test('nested key guide routes and committed guide removals retain accurate per-page dates',()=>fixture(async({root,generate})=>{
  const data='public/browse-editorials.json';
  const entries={themes:{eternity:{editorial_markdown:'Original'}},'keys-female':{d:{editorial_markdown:'Original key guide'}}};
  const env={...process.env,GIT_AUTHOR_DATE:baselineDate+'T12:00:00Z',GIT_COMMITTER_DATE:baselineDate+'T12:00:00Z'};
  await writeFile(join(root,data),JSON.stringify(entries));
  execFileSync('git',['add',data],{cwd:root,env});execFileSync('git',['commit','-qm','existing guides'],{cwd:root,env});
  const before=await generate();assert.equal(before.routes['/browse/keys/female/d/'],baselineDate);
  delete entries.themes.eternity;entries['keys-female'].d.editorial_markdown='Revised key guide';
  await writeFile(join(root,data),JSON.stringify(entries));
  const after=await generate();
  assert.equal(after.routes['/browse/themes/eternity/'],today);
  assert.equal(after.routes['/browse/keys/female/d/'],today);
  assert.equal(after.routes['/browse/keys-female/d/'],undefined);
  const currentEnv={...env,GIT_AUTHOR_DATE:today+'T12:00:00Z',GIT_COMMITTER_DATE:today+'T12:00:00Z'};
  execFileSync('git',['add',data],{cwd:root,env:currentEnv});execFileSync('git',['commit','-qm','remove guide and revise key guide'],{cwd:root,env:currentEnv});
  const clean=await generate();assert.deepEqual(await generate(),clean);
  assert.equal(clean.routes['/browse/themes/eternity/'],today);
  assert.equal(clean.routes['/browse/keys/female/d/'],today);
}));

test('song prose preserves collection dates while a verified BPM correction dates only dependent cards',()=>fixture(async({root,generate})=>{
  const data='public/songs-chunk-1.json';
  const rows=[{slug:'example',title:'Example',primary_artist:'Artist A',themes:['hope'],tags:['prayer'],default_male_key:'E',default_female_key:'F',tempo_bpm:72,time_signature:'4/4',editorial_markdown:'Original'}, {slug:'neighbor',title:'Neighbor',primary_artist:'Artist B',themes:['peace'],tags:[],default_male_key:'G',default_female_key:'A',tempo_bpm:90,time_signature:'6/8'}];
  await writeFile(join(root,data),JSON.stringify(rows));
  const env={...process.env,GIT_AUTHOR_DATE:baselineDate+'T12:00:00Z',GIT_COMMITTER_DATE:baselineDate+'T12:00:00Z'};
  execFileSync('git',['add',data],{cwd:root,env});execFileSync('git',['commit','-qm','existing cards'],{cwd:root,env});
  const before=await generate(); rows[0].editorial_markdown='Corrected source wording';
  await writeFile(join(root,data),JSON.stringify(rows)); const prose=await generate();
  assert.equal(prose.routes['/songs/example/'],today);
  for (const route of ['/browse/artists/artist-a/','/browse/themes/hope/','/browse/keys/male/e/','/songs/']) assert.equal(prose.routes[route],before.routes[route],route);
  rows[0].tempo_bpm=68; await writeFile(join(root,data),JSON.stringify(rows)); const music=await generate();
  for (const route of ['/browse/artists/artist-a/','/browse/themes/hope/','/browse/keys/male/e/','/songs/']) assert.equal(music.routes[route],today,route);
  for (const route of ['/browse/artists/artist-b/','/browse/themes/peace/','/browse/keys/male/g/']) assert.equal(music.routes[route],before.routes[route],route);
  assert.equal(music.prefixes['/browse/'],before.prefixes['/browse/']);
}));

test('shared key-intro corrections date only their two voice routes',()=>fixture(async({root,generate})=>{
  await mkdir(join(root,'src/lib'),{recursive:true});
  const data='src/lib/keyDescriptions.js';
  await writeFile(join(root,data),'export const keyDescriptions = {\n  "g": "Original G",\n  "d": "Unchanged D"\n};\n');
  const env={...process.env,GIT_AUTHOR_DATE:baselineDate+'T12:00:00Z',GIT_COMMITTER_DATE:baselineDate+'T12:00:00Z'};
  execFileSync('git',['add',data],{cwd:root,env});execFileSync('git',['commit','-qm','existing intros'],{cwd:root,env});
  const before=await generate();
  await writeFile(join(root,data),'export const keyDescriptions = {\n  "g": "Corrected G",\n  "d": "Unchanged D"\n};\n');
  const after=await generate();
  for(const voice of ['male','female']){
    assert.equal(after.routes[`/browse/keys/${voice}/g/`],today);
    assert.equal(after.routes[`/browse/keys/${voice}/d/`],before.routes[`/browse/keys/${voice}/d/`]);
  }
  assert.equal(after.prefixes['/browse/'],before.prefixes['/browse/']);
}));

test('a corrected card dates a linked blog without revising unrelated blog bodies',()=>fixture(async({root,generate})=>{
  const songFile='public/songs-chunk-1.json',blogFile='public/blog-posts.json';
  await writeFile(join(root,songFile),JSON.stringify([{slug:'example',title:'Example',tempo_bpm:72}]));
  await writeFile(join(root,blogFile),JSON.stringify([{slug:'linked',body:'Guide',songLinks:['example']},{slug:'other',body:'Other',songLinks:[]} ]));
  const env={...process.env,GIT_AUTHOR_DATE:baselineDate+'T12:00:00Z',GIT_COMMITTER_DATE:baselineDate+'T12:00:00Z'};
  execFileSync('git',['add',songFile,blogFile],{cwd:root,env});execFileSync('git',['commit','-qm','existing linked cards'],{cwd:root,env});
  const before=await generate();
  await writeFile(join(root,songFile),JSON.stringify([{slug:'example',title:'Example',tempo_bpm:68}]));
  const after=await generate(); assert.equal(after.routes['/blog/linked/'],today);
  assert.equal(after.routes['/blog/other/'],before.routes['/blog/other/']);
}));

test('a scoped musical presentation hold dates its cards without changing route membership',()=>fixture(async({root,generate})=>{
 const data='public/songs-chunk-1.json';const rows=[{slug:'example',title:'Example',primary_artist:'Artist A',default_male_key:'D',tempo_bpm:172,time_signature:'12/8',themes:['trust'],tags:[]},{slug:'neighbor',title:'Neighbor',primary_artist:'Artist B',default_male_key:'G',tempo_bpm:90,time_signature:'4/4',themes:[],tags:[]}];
 await writeFile(join(root,data),JSON.stringify(rows));const env={...process.env,GIT_AUTHOR_DATE:baselineDate+'T12:00:00Z',GIT_COMMITTER_DATE:baselineDate+'T12:00:00Z'};execFileSync('git',['add',data],{cwd:root,env});execFileSync('git',['commit','-qm','existing source rows'],{cwd:root,env});const before=await generate();
 const hold='src/data/musicalClaimHolds.json';await writeFile(join(root,hold),JSON.stringify({example:{tempo:true,meter:true}}));const after=await generate();assert.equal(after.routes['/browse/artists/artist-a/'],today);assert.equal(after.routes['/browse/time-signatures/12-8/'],today);assert.equal(after.routes['/browse/artists/artist-b/'],before.routes['/browse/artists/artist-b/']);assert.equal(after.prefixes['/browse/'],before.prefixes['/browse/']);assert.deepEqual(JSON.parse(await readFile(join(root,data),'utf8')),rows);
 const current={...env,GIT_AUTHOR_DATE:today+'T12:00:00Z',GIT_COMMITTER_DATE:today+'T12:00:00Z'};execFileSync('git',['add',hold],{cwd:root,env:current});execFileSync('git',['commit','-qm','reviewed display hold'],{cwd:root,env:current});const clean=await generate();assert.equal(clean.routes['/browse/artists/artist-a/'],today);assert.deepEqual(await generate(),clean);
}));
