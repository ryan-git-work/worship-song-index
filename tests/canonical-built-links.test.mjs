import test from 'node:test';import assert from 'node:assert/strict';
import {canonicalSiteLink,canonicalizeHtml} from '../scripts/canonicalize-built-links.mjs';
const inventory=new Map([['/','/'],['/browse','/browse/'],['/songs/example','/songs/example/']]);
test('known page links use established canonical slashes and preserve queries/fragments byte for byte',()=>{
 for(const [a,b]of [['/browse','/browse/'],['/songs/example?q=a%20b&amp;sort=1#verse','/songs/example/?q=a%20b&amp;sort=1#verse'],['https://worshipsongindex.com/browse?x=1#keys','https://worshipsongindex.com/browse/?x=1#keys'],['//worshipsongindex.com/browse','//worshipsongindex.com/browse/'],['../example#details','/songs/example/#details']])assert.equal(canonicalSiteLink(a,inventory,'https://worshipsongindex.com/songs/other/'),b);
});
test('assets, external URLs, unknown routes, fragments and query-only links remain untouched',()=>{
 for(const value of ['/song-search.json?q=x','/image.png','https://example.com/browse','mailto:test@example.invalid','#verse','?page=2','/unknown','/legacy-alias'])assert.equal(canonicalSiteLink(value,inventory),value);
});
test('HTML and nested JSON-LD links change without rewriting asset URLs or prose',()=>{
 const h=`<a href="/browse?q=1&amp;b=2#keys">Browse</a><img src="/image.png"><script type="application/ld+json">{"url":"https://worshipsongindex.com/browse","itemListElement":[{"item":"https://worshipsongindex.com/songs/example"}],"description":"/browse","image":"/image.png"}</script>`;
 const result=canonicalizeHtml(h,inventory,'https://worshipsongindex.com/');assert.match(result.html,/href="\/browse\/\?q=1&amp;b=2#keys"/);const schema=JSON.parse(result.html.match(/<script[^>]*>(.*?)<\/script>/)[1]);assert.equal(schema.url,'https://worshipsongindex.com/browse/');assert.equal(schema.itemListElement[0].item,'https://worshipsongindex.com/songs/example/');assert.equal(schema.description,'/browse');assert.equal(schema.image,'/image.png');assert.equal(canonicalizeHtml(result.html,inventory).changes,0);
});

test('legacy aliases retain their own contract and target links normalize only when the target is known',()=>{
 const h=`<link rel="canonical" href="https://worshipsongindex.com/songs/example/"><meta http-equiv="refresh" content="0;url=/songs/example/"><a href="/legacy-alias?keep=1#x">Alias</a><a href="/songs/example">Target</a>`;
 const result=canonicalizeHtml(h,inventory,'https://worshipsongindex.com/legacy-alias/').html;
 assert.match(result,/content="0;url=\/songs\/example\/"/);assert.match(result,/href="\/legacy-alias\?keep=1#x"/);assert.match(result,/href="\/songs\/example\/"/);assert.equal(canonicalizeHtml(result,inventory).changes,0);
});
