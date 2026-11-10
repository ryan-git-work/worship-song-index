import catalogIntegrity from '../data/catalogIntegrity.json' with { type: 'json' };
import songRedirects from '../data/songRedirects.json' with { type: 'json' };
import { displayedTempo, displayedMeter } from './musicalClaims.mjs';

const hiddenSongSlugs = new Set([
  ...catalogIntegrity.deleted,
  ...catalogIntegrity.quarantined,
  ...Object.keys(songRedirects),
]);

// Retain every source record and its route. Discovery should not recommend a
// quarantined record or an alias instead of the canonical destination.
export function isDiscoverableSong(song) {
  return song.quarantined !== true && !hiddenSongSlugs.has(song.slug);
}

export function hasUnverifiedMusicalMetadata(song) {
  return song.metadata_confidence === 'unverified_metadata'
    || song.metadata_confidence === 'song_verified_metadata_unverified';
}

export function buildSongSearchIndex(songs) {
  const seen = new Set();
  return songs.flatMap((song) => {
    // Filter before deduplication so a hidden row cannot shadow a good sibling.
    if (!isDiscoverableSong(song)) return [];
    const identity = `${song.title}|${song.primary_artist}`
      .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (seen.has(identity)) return [];
    seen.add(identity);
    const hideMusic = hasUnverifiedMusicalMetadata(song);
    return [{
      s: song.slug,
      t: song.title,
      a: song.primary_artist,
      m: hideMusic ? null : song.default_male_key,
      f: hideMusic ? null : song.default_female_key,
      b: hideMusic ? null : displayedTempo(song.slug, song.tempo_bpm),
      x: hideMusic ? null : displayedMeter(song.slug, song.time_signature),
    }];
  });
}
