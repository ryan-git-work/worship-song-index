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
  ],
};

export function getBrowseBlogGuides(
  browseType: 'keys-male' | 'time-signatures',
  slug: string,
): BrowseBlogGuideLink[] {
  return browseBlogGuides[`${browseType}/${slug}`] ?? [];
}
