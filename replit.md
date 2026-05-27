# Worship Song Index

A static worship song directory built with Astro and Tailwind CSS. The site reads song data from a JSON file and generates SEO-optimized pages for each worship song.

## Project Structure

```
├── public/
│   ├── songs.json          # Song data source (559+ songs)
│   └── generated-icon.png  # Site favicon/logo
├── src/
│   ├── components/
│   │   ├── SongCard.astro       # Card component with clickable filter badges
│   │   ├── SongListItem.astro   # Compact list row component for list view
│   │   ├── ThemeTag.astro       # Theme pill/badge component
│   │   ├── YouTubeEmbed.astro   # Responsive YouTube embed
│   │   ├── StreamingButtons.astro # Spotify/Amazon buttons
│   │   ├── PillarCards.astro    # Grid of 7 devotional pillar cards
│   │   ├── RelatedSongs.astro   # Song links by slug for devotionals
│   │   └── RelatedLinks.astro   # Podcast/TCC links for devotionals
│   ├── layouts/
│   │   └── Layout.astro         # Base layout with SEO support
│   ├── pages/
│   │   ├── index.astro          # Homepage with song grid and sorting
│   │   ├── browse/
│   │   │   ├── index.astro      # Browse hub page
│   │   │   ├── artists/
│   │   │   │   ├── index.astro  # All artists listing
│   │   │   │   └── [artist].astro # Songs by artist
│   │   │   ├── categories/
│   │   │   │   └── index.astro  # Themes and tags listing
│   │   │   ├── themes/[theme].astro     # Filter by theme
│   │   │   ├── tags/[tag].astro         # Filter by tag
│   │   │   ├── keys/male/[key].astro    # Filter by male key
│   │   │   ├── keys/female/[key].astro  # Filter by female key
│   │   │   └── time-signatures/[signature].astro # Filter by time sig
│   │   ├── songs/[slug].astro   # Dynamic song detail pages
│   │   └── worship-team-devotionals/
│   │       ├── index.astro      # Main devotionals hub
│   │       ├── [pillar].astro   # Pillar hub pages (7 topics)
│   │       └── [pillar]/[slug].astro # Individual devotional pages
│   ├── styles/
│   │   └── global.css           # Tailwind imports and custom theme
│   └── types/
│       └── song.ts              # TypeScript types and utility functions
├── src/
│   └── content.config.ts        # Astro v5 Content Layer collections config
├── src/content/
│   ├── devotionalHubs/          # MDX hub pages (index + 7 pillars)
│   └── devotionals/             # MDX devotional content by pillar
├── scripts/
│   └── import-new-songs.cjs     # Script to import songs from RTF files
```

## Features

### Filtering
- Click any theme, tag, key, or time signature to see all matching songs
- Browse page at `/browse` shows all available categories
- Filter pages auto-generated from song data

### Search
- Real-time search by title, artist, theme, or tag
- Results update as you type with visible count

### Sorting
- Homepage includes sort dropdown (A-Z, Z-A, BPM low-high, BPM high-low)

### View Toggle
- Switch between Card View and List View on the homepage
- Card View: Rich cards with all song details
- List View: Compact vertical list for quick scanning
- Preference saved to localStorage

### Clickable Elements
- Song cards: Male/Female keys, time signatures link to filter pages
- Song details: Themes, tags, keys all link to filter pages

## Song Data Structure

Each song in `public/songs.json` has these fields:

```json
{
  "slug": "way-maker",
  "title": "Way Maker",
  "primary_artist": "Leeland",
  "default_male_key": "D",
  "default_female_key": "F",
  "tempo_bpm": 68,
  "time_signature": "4/4",
  "themes": ["miracles", "faith", "presence", "comfort"],
  "scripture_refs": ["Isaiah 43:16-19", "Psalm 77:13-15", "John 14:6"],
  "summary_theology": "Theological explanation of the song...",
  "practical_worship_leadership": "Tips for worship leaders...",
  "arrangement_tips": "Musical arrangement guidance...",
  "tags": ["modern", "ccli_top", "miracle", "faith"]
}
```

### Required Fields
- `slug`: URL-friendly identifier (used in /songs/[slug])
- `title`: Song title
- `primary_artist`: Main artist/band
- `default_male_key`: Suggested key for male vocalists
- `default_female_key`: Suggested key for female vocalists
- `tempo_bpm`: Beats per minute
- `time_signature`: Time signature (4/4, 6/8, etc.)
- `themes`: Array of theme categories
- `scripture_refs`: Related Bible passages
- `summary_theology`: Theological meaning and focus
- `practical_worship_leadership`: When and how to use the song
- `arrangement_tips`: Musical arrangement advice
- `tags`: Additional categorization tags

### Optional Fields
- `youtube`: YouTube video URL
- `spotify`: Spotify track URL
- `amazon_link`: Amazon Music link

## Adding/Editing Songs

1. Edit `public/songs.json`
2. Add a new song object with all required fields
3. The site will automatically generate a page at `/songs/[slug]`
4. Filter pages are auto-generated for new themes/tags/keys

## Extending the Data

To add new fields:
1. Update the `Song` interface in `src/types/song.ts`
2. Add the field to songs in `public/songs.json`
3. Display the field in `src/pages/songs/[slug].astro`

## SEO Features

- Meta title and description on all pages
- JSON-LD structured data (MusicRecording, CollectionPage, BreadcrumbList schemas)
- Scripture references included in structured data
- Auto-generated URL slugs
- Open Graph tags for social sharing
- Canonical URLs on all pages
- Breadcrumb navigation with structured data

## Running Locally

```bash
npm run dev    # Start dev server on port 5000
npm run build  # Build for production
npm run preview # Preview production build
```

## Recent Changes

- 2026-04-16: Applied content corrections to 1,700 songs (summary_theology, practical_worship_leadership, arrangement_tips); added 300 new songs — total now 3,470
- 2026-04-03: Added 83 new songs (now 911 total) — Israel Houghton, Jeremy Riddle, Shane & Shane, Matt Redman, Michael W. Smith, Andraé Crouch, Graham Kendrick, Robin Mark, Fernando Ortega, Chris Rice, and others; 17 duplicates skipped; fixed "3/4 time" tag (replaced with "triple-time") across 5 songs
- 2026-03-03: Added Elevation Worship "So Be It" album (10 songs, now 828 total) — So Be It, Alleluia, I Know a Name, Jesus Be the Name, Call God, Keep On, Your Name Is God, Thank You, I Got Saved, God I'm Just Grateful
- 2026-03-03: Added 98 new songs (now 818 total) — CeCe Winans, Zach Williams, Maverick City, Casting Crowns, Chris Tomlin, Hillsong, Jesus Culture, and more; 2 duplicate slugs skipped (glorious-day, everlasting-god); CSV regenerated
- 2026-03-02: Added 8 devotional background images to individual devotional pages — deterministic slug-based assignment via src/lib/devotionalImage.ts, images compressed to 65-126KB each, header image with gradient overlay and text overlay showing pillar, title, and verse ref. Images in public/devotional-images/
- 2026-03-02: Visual refinement pass — editorial pastoral design with warm off-white (#FAF9F6) background, sage green (#6B7F6A) accents, soft charcoal (#1F1F1F) text, Cormorant Garamond serif headings, Inter sans-serif body, improved spacing/typography hierarchy, subtle borders (#E8E6E1), refined card hover states, and consistent design language across all pages
- 2026-02-12: Added complete Worship Team Devotionals section with MDX support, Astro v5 Content Layer API, 3-level routing (hub/pillar/devotional), 7 pillar topics, and 1 sample devotional ("The Turn")
- 2025-12-26: Added 115 Elevation Worship songs (now 674 total)
- 2025-12-18: Restructured browse navigation with /browse as hub page linking to /browse/artists and /browse/categories
- 2025-12-18: Added SEO structured data (BreadcrumbList, CollectionPage) to all browse pages
- 2025-12-18: Fixed artist matching to include collaborations (e.g., "Kari Jobe" shows songs where artist name appears)
- 2025-12-18: Added 83 Kari Jobe and United Pursuit songs (now 559 total)
- 2025-12-13: Added browse by artist feature
- 2025-12-13: Added 170 more songs (now 476 total) including The King Is In The Room, Song Of The Saints, Victory In Jesus, Come To Jesus, He Who Is To Come, and many Christmas songs
- 2025-12-13: Added 141 new songs including Holy Forever, Gratitude, Trust In God, Praise, I Thank God, Oceans, Here I Am To Worship, Forever Reign, The Stand, and many more
- 2025-12-13: Renamed site to Worship Song Index
- 2025-12-12: Added Card/List view toggle on homepage with localStorage preference
- 2025-12-12: Added 49 more songs (now 165 total) including Come As You Are, Run Devil Run, Build Your Kingdom Here, My Lighthouse, One Thing Remains, Firm Foundation, Christ Is Enough, He Will Hold Me Fast, and more from Crowder, Rend Collective, Vertical Worship, Jesus Culture, Maverick City Music, and others
- 2025-12-12: Added real-time search functionality (search by title, artist, theme, or tag)
- 2025-12-12: Added 19 more songs (now 116 total) including How Great Is Our God, Holy Is The Lord, Whom Shall I Fear, Man of Sorrows, When I Survey The Wondrous Cross, and more
- 2025-12-11: Added Batch 3 with 29 more songs (now 97 total) including Jireh, Build Your Church, Fear Is Not My Future, Thank You Jesus For The Blood, and more
- 2025-12-11: Added 18 more songs (now 68 total) including Blessed Be Your Name, His Mercy Is More, The Blessing, No Longer Slaves, and more
- 2025-12-11: Added filtering by themes, tags, keys, and time signatures with clickable badges
- 2025-12-11: Added alphabetical and BPM sorting on homepage
- 2025-12-11: Expanded to 50 songs with full data including theology, leadership tips, arrangement guidance, and scripture references
- 2025-12-11: Added time signature display and improved card design
- 2025-12-11: Enhanced song detail pages with dedicated sections for theology, leadership, and arrangement
- 2025-12-10: Initial project setup with Astro + Tailwind CSS
