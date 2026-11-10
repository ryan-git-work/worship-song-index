import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const contentHash = html => createHash('sha256').update(html).digest('hex');
export function contentLastmod(previous, hash, proposed, today) {
  // Never advance an unchanged rendered page because its shared template or
  // dictionary changed elsewhere. New or changed output has a real build date.
  return previous?.hash === hash ? previous.lastmod : [proposed,today].filter(Boolean).sort().at(-1);
}
export function reconcileContentDates(root=process.cwd(),today=new Date().toISOString().slice(0,10)) {
  const ledgerPath=join(root,'src/data/sitemapContentHashes.json');
  const prior=JSON.parse(readFileSync(ledgerPath,'utf8'));
  if(prior.schemaVersion!==1 || prior.origin!=='https://worshipsongindex.com')throw new Error('Invalid sitemap content ledger');
  const path=join(root,'dist/sitemap-0.xml');
  const xml=readFileSync(path,'utf8');
  const next={schemaVersion:1,origin:prior.origin,routes:{}};
  const dates=JSON.parse(readFileSync(join(root,'src/data/sitemapLastmod.json'),'utf8'));
  let preserved=0,changed=0;
  const result=xml.replace(/<url>([\s\S]*?)<\/url>/g,(whole,body)=>{
    const loc=body.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if(!loc)throw new Error('Sitemap URL without location');
    const url=new URL(loc);if(url.origin!==prior.origin)throw new Error(`Unexpected origin: ${loc}`);
    const route=decodeURIComponent(url.pathname);
    if(!route.startsWith('/') || route.includes('..'))throw new Error(`Unsafe route: ${route}`);
    const html=readFileSync(join(root,'dist',route,'index.html'),'utf8');
    const hash=contentHash(html);
    const proposed=body.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.slice(0,10);
    const lastmod=contentLastmod(prior.routes[url.pathname],hash,proposed,today);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(lastmod||''))throw new Error(`Invalid lastmod: ${loc}`);
    next.routes[url.pathname]={hash,lastmod};dates.routes[url.pathname]=lastmod;
    if(prior.routes[url.pathname]?.hash===hash)preserved++;else changed++;
    const tag=`<lastmod>${lastmod}</lastmod>`;
    return '<url>'+(body.includes('<lastmod>')?body.replace(/<lastmod>[^<]*<\/lastmod>/,tag):body+tag)+'</url>';
  });
  if(!Object.keys(next.routes).length)throw new Error('No sitemap routes reconciled');
  writeFileSync(path,result);
  writeFileSync(ledgerPath,JSON.stringify(next,null,2)+'\n');
  writeFileSync(join(root,'src/data/sitemapLastmod.json'),JSON.stringify(dates,null,2)+'\n');
  return {routes:Object.keys(next.routes).length,preserved,changed};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log('Rendered sitemap dates:',JSON.stringify(reconcileContentDates()));
