import type { APIRoute } from 'astro';
import { songs } from '../lib/songs';
import { buildSongSearchIndex } from '../lib/songDiscovery.mjs';

export const GET: APIRoute = () => new Response(JSON.stringify(buildSongSearchIndex(songs)), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  },
});
