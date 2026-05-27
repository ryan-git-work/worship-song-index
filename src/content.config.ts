import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const devotionalHubs = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/devotionalHubs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const devotionals = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/devotionals' }),
  schema: z.object({
    title: z.string(),
    pillar: z.enum([
      'heart-and-motives',
      'team-culture-and-unity',
      'sustainable-ministry',
      'excellence-and-craft',
      'pastoral-leadership',
      'congregational-worship',
      'presence-and-prayer',
    ]),
    verseRef: z.string(),
    description: z.string(),
    songSlugs: z.array(z.string()).optional(),
    discussionQuestions: z.array(z.string()).optional(),
    prayer: z.string().optional(),
    podcastUrl: z.string().optional(),
    tccUrl: z.string().optional(),
  }),
});

export const collections = { devotionalHubs, devotionals };
