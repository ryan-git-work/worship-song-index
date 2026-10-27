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
