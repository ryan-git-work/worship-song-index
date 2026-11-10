import redirects from '../data/songRedirects.json' with {type:'json'};
export function canonicalSongSlug(slug, aliases=redirects) {
  const seen=new Set();
  while(Object.hasOwn(aliases,slug)) {
    if(seen.has(slug))throw new Error(`Song alias cycle at ${slug}`);
    seen.add(slug);slug=aliases[slug];
  }
  return slug;
}
// Route generation keeps all source rows. For recommendations, map a reviewed
// alias to its source-verified canonical and show each composition only once.
export function canonicalSongSelection(selection, catalog, aliases=redirects) {
  const bySlug=new Map(catalog.map(song=>[song.slug,song]));const seen=new Set();
  return selection.flatMap(song=>{
    const slug=canonicalSongSlug(song.slug,aliases);const canonical=bySlug.get(slug);
    if(!canonical)throw new Error(`Missing canonical song ${slug} for ${song.slug}`);
    if(seen.has(slug))return [];seen.add(slug);return [canonical];
  });
}
