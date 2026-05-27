import { getCollection } from 'astro:content';

let cachedMap: Map<string, any[]> | null = null;

async function buildIndex() {
  if (cachedMap) return cachedMap;
  const devotionals = await getCollection('devotionals');
  const map = new Map<string, any[]>();
  for (const entry of devotionals) {
    const slugs = entry.data.songSlugs;
    if (slugs && Array.isArray(slugs)) {
      for (const songSlug of slugs) {
        if (!map.has(songSlug)) {
          map.set(songSlug, []);
        }
        map.get(songSlug)!.push(entry);
      }
    }
  }
  cachedMap = map;
  return map;
}

export async function getDevotionalsBySongSlug(songSlug: string) {
  const map = await buildIndex();
  return map.get(songSlug) || [];
}
