import test from 'node:test';import assert from 'node:assert/strict';
import {contentHash,contentLastmod,reconcileContentDates} from '../scripts/reconcile-sitemap-content.mjs';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
test('unchanged rendered HTML preserves its date despite a changed template date',()=>{
 const hash=contentHash('<main>Untouched</main>');assert.equal(contentLastmod({hash,lastmod:'2026-11-01'},hash,'2026-11-10','2026-11-10'),'2026-11-01');
});
test('new or changed output dates the actual build and never moves a later source date backwards',()=>{
 assert.equal(contentLastmod({hash:'old',lastmod:'2026-11-01'},'new','2026-11-01','2026-11-10'),'2026-11-10');
 assert.equal(contentLastmod(undefined,'new','2026-11-11','2026-11-10'),'2026-11-11');
});
test('rendered sitemap ledger handles real unchanged, changed, new and retired routes idempotently',()=>{
 const root=mkdtempSync(join(tmpdir(),'wsi-content-dates-'));
 try{
  mkdirSync(join(root,'src/data'),{recursive:true});for(const slug of ['same','changed','new']){mkdirSync(join(root,'dist',slug),{recursive:true});writeFileSync(join(root,'dist',slug,'index.html'),'<main>'+slug+'</main>')}
  const routes={'/same/':{hash:contentHash('<main>same</main>'),lastmod:'2026-11-01'},'/changed/':{hash:'old',lastmod:'2026-11-01'},'/retired/':{hash:'old',lastmod:'2026-11-01'}};
  writeFileSync(join(root,'src/data/sitemapContentHashes.json'),JSON.stringify({schemaVersion:1,origin:'https://worshipsongindex.com',routes}));
  writeFileSync(join(root,'src/data/sitemapLastmod.json'),JSON.stringify({routes:{}}));
  writeFileSync(join(root,'dist/sitemap-0.xml'),'<urlset>'+['same','changed','new'].map(s=>`<url><loc>https://worshipsongindex.com/${s}/</loc><lastmod>2026-11-10</lastmod></url>`).join('')+'</urlset>');
  assert.deepEqual(reconcileContentDates(root,'2026-11-10'),{routes:3,preserved:1,changed:2});
  const first=readFileSync(join(root,'dist/sitemap-0.xml'),'utf8');assert.match(first,/<loc>https:\/\/worshipsongindex.com\/same\/<\/loc><lastmod>2026-11-01<\/lastmod>/);
  assert.equal(JSON.parse(readFileSync(join(root,'src/data/sitemapContentHashes.json'),'utf8')).routes['/retired/'],undefined);
  assert.deepEqual(reconcileContentDates(root,'2026-11-11'),{routes:3,preserved:3,changed:0});assert.equal(readFileSync(join(root,'dist/sitemap-0.xml'),'utf8'),first);
 }finally{rmSync(root,{recursive:true,force:true})}
});
