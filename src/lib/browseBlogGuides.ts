export interface BrowseBlogGuideLink {
  title: string;
  href: string;
}

const browseBlogGuides: Record<string, BrowseBlogGuideLink[]> = {
  'keys-male/g': [
    {
      title: 'Worship Songs in the Key of G',
      href: '/blog/worship-songs-in-the-key-of-g/',
    },
  ],
  'keys-male/d': [
    {
      title: 'Worship Songs in the Key of D',
      href: '/blog/worship-songs-in-the-key-of-d/',
    },
  ],
  'keys-male/e': [
    {
      title: 'Worship Songs in the Key of E',
      href: '/blog/worship-songs-in-the-key-of-e/',
    },
  ],
  'time-signatures/3-4': [
    {
      title: 'Hymns in 3/4',
      href: '/blog/hymns-in-3-4/',
    },
    // In Christ Alone is catalogued in 3/4 and its guide leans on the meter.
    {
      title: 'Songs Like In Christ Alone',
      href: '/blog/songs-like-in-christ-alone/',
    },
  ],
  // Added 2026-10-14. Reverse links: these guides already link to the browse
  // page, and the browse page is the one that ranks (6/8 is the largest page on
  // the site in GSC), so it should send readers to the guide that cites it.
  'time-signatures/6-8': [
    {
      title: 'Hymns in 6/8',
      href: '/blog/hymns-in-6-8/',
    },
    {
      title: 'Worship Songs by BPM',
      href: '/blog/worship-songs-by-bpm/',
    },
  ],
  // The obedience editorial names Build My Life and points to the surrender
  // theme; the Build My Life guide is the consecration and surrender family.
  'themes/obedience': [
    {
      title: 'Songs Like Build My Life',
      href: '/blog/songs-like-build-my-life/',
    },
  ],
  'themes/surrender': [
    {
      title: 'Songs Like Build My Life',
      href: '/blog/songs-like-build-my-life/',
    },
  ],
  // Added 2026-10-16. The transformation editorial frames its songs as
  // testimony (before-and-after sung in the first person); the Goodness of God
  // guide maps that testimony family and already sits one click from it.
  'themes/transformation': [
    {
      title: 'Songs Like Goodness of God',
      href: '/blog/songs-like-goodness-of-god/',
    },
  ],
};

export function getBrowseBlogGuides(
  browseType: 'keys-male' | 'time-signatures' | 'themes',
  slug: string,
): BrowseBlogGuideLink[] {
  return browseBlogGuides[`${browseType}/${slug}`] ?? [];
}
