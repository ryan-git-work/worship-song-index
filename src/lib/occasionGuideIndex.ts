import { getCollection } from 'astro:content';

export type OccasionGuideCategory =
  | 'liturgical-calendar'
  | 'pastoral-care'
  | 'church-life'
  | 'special-service';

export interface OccasionGuideLink {
  slug: string;
  title: string;
  category: OccasionGuideCategory;
}

interface OccasionGuideIndex {
  bySongSlug: Map<string, OccasionGuideLink[]>;
  byGuideSlug: Map<string, OccasionGuideLink>;
  totalSourceLinks: number;
  uniqueSongGuidePairs: number;
}

const SONG_LINK_PATTERN = /\]\(\/songs\/([^/)#?]+)\/?(?:[?#][^)]*)?\)/g;

const categoryPatterns: Array<{
  category: OccasionGuideCategory;
  pattern: RegExp;
}> = [
  {
    category: 'liturgical-calendar',
    pattern: /advent|christmas|easter|good-friday|lent|ash-wednesday|palm-sunday|maundy-thursday|holy-saturday|pentecost|epiphany|trinity|all-saints|reformation|ascension|transfiguration|christ-the-king|baptism-of-the-lord|new-years|thanksgiving|first-communion|world-communion/,
  },
  {
    category: 'pastoral-care',
    pattern: /funeral|healing|tragedy|mental-health|grief|pregnancy|infant-loss|addiction|divorce|lament|prodigal|deliverance|prison|empty-nesters|singles|marriage-enrichment/,
  },
  {
    category: 'church-life',
    pattern: /church|baptism-sunday|baby-dedication|mothers-day|fathers-day|youth-service|graduation|senior-adults|membership|commissioning|ordination|installation|pastor-appreciation|small-group|discipleship|stewardship|generosity|building-dedication|capital-campaign|vbs|back-to-school|teacher-appreciation|vision-sunday/,
  },
];

let indexPromise: Promise<OccasionGuideIndex> | null = null;

function classifyGuide(slug: string): OccasionGuideCategory {
  return categoryPatterns.find(({ pattern }) => pattern.test(slug))?.category ?? 'special-service';
}

function selectDiverseGuides(guides: OccasionGuideLink[]): OccasionGuideLink[] {
  const sorted = [...guides].sort(
    (left, right) => left.title.localeCompare(right.title) || left.slug.localeCompare(right.slug),
  );
  const selected: OccasionGuideLink[] = [];
  const seenCategories = new Set<OccasionGuideCategory>();

  for (const guide of sorted) {
    if (seenCategories.has(guide.category)) continue;
    selected.push(guide);
    seenCategories.add(guide.category);
    if (selected.length === 4) break;
  }

  return selected;
}

async function buildOccasionGuideIndex(): Promise<OccasionGuideIndex> {
  const articles = await getCollection('articles');
  const allBySongSlug = new Map<string, OccasionGuideLink[]>();
  const byGuideSlug = new Map<string, OccasionGuideLink>();
  let totalSourceLinks = 0;

  for (const article of articles) {
    const guide: OccasionGuideLink = {
      slug: article.data.slug,
      title: `Worship Songs for ${article.data.target_occasion}`,
      category: classifyGuide(article.data.slug),
    };
    byGuideSlug.set(guide.slug, guide);

    const body = article.body ?? '';
    const articleSongSlugs = new Set<string>();
    for (const match of body.matchAll(SONG_LINK_PATTERN)) {
      totalSourceLinks += 1;
      articleSongSlugs.add(match[1]);
    }

    for (const songSlug of articleSongSlugs) {
      const guides = allBySongSlug.get(songSlug) ?? [];
      guides.push(guide);
      allBySongSlug.set(songSlug, guides);
    }
  }

  const bySongSlug = new Map<string, OccasionGuideLink[]>();
  for (const [songSlug, guides] of allBySongSlug) {
    bySongSlug.set(songSlug, selectDiverseGuides(guides));
  }

  return {
    bySongSlug,
    byGuideSlug,
    totalSourceLinks,
    uniqueSongGuidePairs: [...allBySongSlug.values()].reduce(
      (total, guides) => total + guides.length,
      0,
    ),
  };
}

async function getIndex() {
  indexPromise ??= buildOccasionGuideIndex();
  return indexPromise;
}

export async function getOccasionGuidesBySongSlug(songSlug: string) {
  const index = await getIndex();
  return index.bySongSlug.get(songSlug) ?? [];
}

export async function getOccasionGuideMetadata() {
  const index = await getIndex();
  return index.byGuideSlug;
}

export async function getOccasionGuideIndexStats() {
  const index = await getIndex();
  return {
    songsCovered: index.bySongSlug.size,
    linksEmitted: [...index.bySongSlug.values()].reduce(
      (total, guides) => total + guides.length,
      0,
    ),
    totalSourceLinks: index.totalSourceLinks,
    uniqueSongGuidePairs: index.uniqueSongGuidePairs,
  };
}
