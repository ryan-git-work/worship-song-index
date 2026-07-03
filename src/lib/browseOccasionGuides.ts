import {
  getOccasionGuideMetadata,
  type OccasionGuideLink,
} from './occasionGuideIndex';

const browseGuideSlugs: Record<string, string[]> = {
  'time-signatures/6-8': [
    'worship-songs-for-christmas-eve-service',
    'worship-songs-for-communion',
    'worship-songs-for-a-worship-night',
  ],
  'time-signatures/3-4': [
    'worship-songs-for-a-hymn-sunday',
    'worship-songs-for-advent',
  ],
  'time-signatures/4-4': [
    'worship-songs-for-easter-sunday',
    'worship-songs-for-outreach-sunday',
  ],
  'themes/healing': [
    'worship-songs-for-a-healing-service',
    'worship-songs-for-mental-health-sunday',
  ],
  'themes/repentance': [
    'worship-songs-for-ash-wednesday',
    'worship-songs-for-lent',
  ],
  'themes/thanksgiving': [
    'worship-songs-for-thanksgiving-service',
    'worship-songs-for-a-church-anniversary',
  ],
  'themes/surrender': [
    'worship-songs-for-a-covenant-renewal-sunday',
    'worship-songs-for-a-prayer-and-fasting-week',
  ],
  'themes/faithfulness': [
    'worship-songs-for-a-church-anniversary',
    'worship-songs-for-senior-adults-sunday',
  ],
  'themes/comfort': [
    'worship-songs-for-a-grief-support-sunday',
    'worship-songs-for-a-funeral',
    'worship-songs-for-sunday-after-a-tragedy',
  ],
  'themes/suffering': [
    'worship-songs-for-a-night-of-lament',
    'worship-songs-for-good-friday',
  ],
  'themes/hope': [
    'worship-songs-for-advent',
    'worship-songs-for-an-end-of-year-service',
  ],
  'themes/incarnation': [
    'worship-songs-for-christmas-eve-service',
    'worship-songs-for-epiphany-sunday',
  ],
  'themes/resurrection': [
    'worship-songs-for-easter-sunday',
    'worship-songs-for-an-easter-sunrise-service',
  ],
  'themes/cross': [
    'worship-songs-for-good-friday',
    'worship-songs-for-communion',
  ],
  'themes/atonement': [
    'worship-songs-for-good-friday',
    'worship-songs-for-maundy-thursday',
  ],
  'themes/justice': [
    'worship-songs-for-an-anti-trafficking-or-justice-sunday',
    'worship-songs-for-mlk-sunday',
  ],
  'themes/mission': [
    'worship-songs-for-a-missions-conference',
    'worship-songs-for-a-missionary-send-off-sunday',
    'worship-songs-for-vision-sunday',
  ],
  'themes/prayer': [
    'worship-songs-for-a-prayer-meeting',
    'worship-songs-for-a-24-hour-prayer-vigil',
    'worship-songs-for-global-day-of-prayer',
  ],
  'themes/revival': [
    'worship-songs-for-a-revival-service',
    'worship-songs-for-outreach-sunday',
  ],
  'themes/community': [
    'worship-songs-for-small-group-launch-sunday',
    'worship-songs-for-church-homecoming-sunday',
  ],
  'themes/salvation': [
    'worship-songs-for-baptism-sunday',
    'worship-songs-for-outreach-sunday',
  ],
  'themes/hymn': [
    'worship-songs-for-a-hymn-sunday',
    'worship-songs-for-senior-adults-sunday',
  ],
  'themes/celebration': [
    'worship-songs-for-easter-sunday',
    'worship-songs-for-a-church-anniversary',
  ],
  'themes/gratitude': [
    'worship-songs-for-thanksgiving-service',
    'worship-songs-for-generosity-sunday',
  ],
  'themes/peace': [
    'worship-songs-for-mental-health-sunday',
    'worship-songs-for-sunday-after-a-tragedy',
  ],
  'themes/holiness': [
    'worship-songs-for-a-deliverance-service',
    'worship-songs-for-a-prayer-and-fasting-week',
  ],
  'themes/adoration': [
    'worship-songs-for-a-worship-night',
    'worship-songs-for-communion',
  ],
};

export async function getBrowseOccasionGuides(
  browseType: 'themes' | 'time-signatures',
  slug: string,
): Promise<OccasionGuideLink[]> {
  const guideSlugs = browseGuideSlugs[`${browseType}/${slug}`] ?? [];
  if (!guideSlugs.length) return [];

  const metadata = await getOccasionGuideMetadata();
  return guideSlugs.map((guideSlug) => {
    const guide = metadata.get(guideSlug);
    if (!guide) {
      throw new Error(`Browse occasion mapping references missing guide: ${guideSlug}`);
    }
    return guide;
  });
}

export const mappedBrowseOccasionPageCount = Object.keys(browseGuideSlugs).length;
