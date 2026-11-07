import type { APIRoute } from 'astro';
import { songs } from '../lib/songs';
import { displayedTempo, displayedMeter } from '../lib/musicalClaims.mjs';

export const GET: APIRoute = () => {
  const seen = new Set<string>();
  const searchIndex = songs.flatMap((song) => {
    const identity = `${song.title}|${song.primary_artist}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    if (seen.has(identity)) return [];
    seen.add(identity);

    return [{
      s: song.slug,
      t: song.title,
      a: song.primary_artist,
      m: song.default_male_key,
      f: song.default_female_key,
      b: displayedTempo(song.slug, song.tempo_bpm),
      x: displayedMeter(song.slug, song.time_signature),
    }];
  });

  return new Response(JSON.stringify(searchIndex), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
};
