export interface SongFamilyGuideLink {
  title: string;
  href: string;
}

const songFamilyGuides: Record<string, SongFamilyGuideLink> = {
  'way-maker': {
    title: 'Songs Like Way Maker',
    href: '/blog/songs-like-way-maker/',
  },
  'goodness-of-god': {
    title: 'Songs Like Goodness of God',
    href: '/blog/songs-like-goodness-of-god/',
  },
  'oceans-where-feet-may-fail': {
    title: 'Songs Like Oceans',
    href: '/blog/songs-like-oceans/',
  },
  'reckless-love': {
    title: 'Songs Like Reckless Love',
    href: '/blog/songs-like-reckless-love/',
  },
  gratitude: {
    title: 'Songs Like Gratitude',
    href: '/blog/songs-like-gratitude/',
  },
  'i-speak-jesus': {
    title: 'Songs Like I Speak Jesus',
    href: '/blog/songs-like-i-speak-jesus/',
  },
  'build-my-life': {
    title: 'Songs Like Build My Life',
    href: '/blog/songs-like-build-my-life/',
  },
  'what-a-beautiful-name': {
    title: 'Songs Like What a Beautiful Name',
    href: '/blog/songs-like-what-a-beautiful-name/',
  },
};

export function getSongFamilyGuide(songSlug: string): SongFamilyGuideLink | null {
  return songFamilyGuides[songSlug] ?? null;
}
