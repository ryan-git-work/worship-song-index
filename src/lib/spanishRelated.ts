import type { SpanishSong } from '../types/song';

export function getRelatedSpanishSongs(song: SpanishSong, allSongs: SpanishSong[], limit = 5): SpanishSong[] {
  const candidates = allSongs.filter((candidate) => candidate.slug !== song.slug);
  const related: SpanishSong[] = [];
  const seen = new Set<string>();

  const add = (candidate: SpanishSong) => {
    if (related.length >= limit || seen.has(candidate.slug)) return;
    seen.add(candidate.slug);
    related.push(candidate);
  };

  if (song.cluster) {
    candidates
      .filter((candidate) => candidate.cluster === song.cluster)
      .sort((left, right) => left.title.localeCompare(right.title, 'es'))
      .slice(0, 3)
      .forEach(add);
  }

  candidates
    .map((candidate) => ({
      song: candidate,
      score: candidate.themes.filter((theme) => song.themes.includes(theme)).length,
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.song.title.localeCompare(right.song.title, 'es'))
    .forEach((entry) => add(entry.song));

  return related;
}
