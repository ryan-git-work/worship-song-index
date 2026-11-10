import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const ORIGIN='https://worshipsongindex.com';
export function canonicalSiteLink(value, inventory, page=ORIGIN+'/') {
  if(typeof value!=='string'||!value||/^[?#]/.test(value))return value;
  if(!/^(?:https?:\/\/|\/|\.\.?\/)/i.test(value))return value;
  let url;try{url=new URL(value,page)}catch{return value}
  if(url.origin!==ORIGIN)return value;
  const canonical=inventory.get(url.pathname.replace(/\/$/,'')||'/');
  if(!canonical)return value;
  const suffix=value.match(/[?#].*$/)?.[0]||'';
  if(value.startsWith('//'))return '//'+url.host+canonical+suffix;
  if(/^https?:\/\//i.test(value))return url.origin+canonical+suffix;
  return canonical+suffix;
}
function schemaLinks(value,inventory,page,key='') {
  if(Array.isArray(value))return value.map(item=>schemaLinks(item,inventory,page,key));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,schemaLinks(v,inventory,page,k)]));
  return ['url','item','@id','mainEntityOfPage','sameAs','contentUrl','embedUrl'].includes(key)?canonicalSiteLink(value,inventory,page):value;
}
export function canonicalizeHtml(html,inventory,page) {
  let changed=0;
  let result=html.replace(/(\bhref\s*=\s*)(["'])([^"']*)\2/gi,(whole,prefix,quote,value)=>{
    const next=canonicalSiteLink(value,inventory,page);if(next!==value)changed++;
    return prefix+quote+next+quote;
  });
  result=result.replace(/(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,(whole,open,text,close)=>{
    const before=JSON.parse(text),after=schemaLinks(before,inventory,page);
    if(JSON.stringify(before)===JSON.stringify(after))return whole;
    changed++;return open+JSON.stringify(after)+close;
  });
  return {html:result,changes:changed};
}
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(dir,e.name)):e.name.endsWith('.html')?[join(dir,e.name)]:[])}
export function canonicalizeBuild(root='dist') {
  const paths=files(root),inventory=new Map();
  for(const path of paths){const html=readFileSync(path,'utf8'),href=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];if(!href)continue;const url=new URL(href);if(url.origin===ORIGIN&&url.pathname.endsWith('/'))inventory.set(url.pathname.replace(/\/$/,'')||'/',url.pathname);}
  const aliases=JSON.parse(readFileSync(new URL('../src/data/songRedirects.json',import.meta.url),'utf8'));
  for(const [from,to] of Object.entries(aliases)){const target=`/songs/${to}/`;if(!inventory.has(target.slice(0,-1)))throw new Error(`Missing alias target ${target}`);inventory.set(`/songs/${from}`,target);}
  let pages=0,changes=0;
  for(const path of paths){const html=readFileSync(path,'utf8'),page=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1]||ORIGIN+'/',next=canonicalizeHtml(html,inventory,page);if(next.changes){writeFileSync(path,next.html);pages++;changes+=next.changes;}}
  return {htmlPages:paths.length,knownCanonicalPaths:inventory.size,changedPages:pages,linkOrSchemaChanges:changes};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log('Canonical internal links:',JSON.stringify(canonicalizeBuild(process.argv[2]||'dist')));
