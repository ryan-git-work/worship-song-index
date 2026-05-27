# Replit Prompt: Build Blog Section for WorshipSongIndex.com

Paste this entire prompt into Replit AI.

---

I need to add a full blog section to this Astro static site. I'll describe every file to create. Please create them exactly as specified.

---

## Step 1 — Upload the blog posts data

I will upload a file called `blog-posts.json`. Please save it to `public/blog-posts.json`. This file contains an array of blog post objects with the following fields:
- `slug` (string) — used as the URL path
- `title` (string)
- `publishDate` (string, ISO date)
- `metaTitle` (string) — for `<title>` tag
- `metaDescription` (string) — for meta description
- `excerpt` (string)
- `category` (string)
- `tags` (string array)
- `author` (string)
- `body` (string) — Markdown content
- `songLinks` (string array) — slugs of songs referenced in the post
- `featuredImage` (string or null)

---

## Step 2 — Install the Markdown renderer

Run this command to install the `marked` package so we can render Markdown in Astro:

```
npm install marked
```

---

## Step 3 — Create the Blog List Page

Create the file `src/pages/blog/index.astro` with this exact content:

```astro
---
import Layout from '../../layouts/Layout.astro';
import blogData from '../../../public/blog-posts.json';

const posts = blogData.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

const title = 'Worship Leader Blog | Keys, Tempos, Theology & Set Planning | Worship Song Index';
const description = 'Practical guides for worship leaders — how to choose song keys, plan worship sets, select songs for Communion and healing services, and navigate the church calendar.';
---

<Layout title={title} description={description}>
  <div class="max-w-4xl mx-auto px-4 py-10">

    <nav class="mb-8 text-sm" style="color: var(--color-text-muted);">
      <a href="/" class="text-primary-600 hover:text-primary-800 transition-colors">Home</a>
      <span class="mx-2">/</span>
      <span>Blog</span>
    </nav>

    <header class="mb-12">
      <h1 class="text-4xl font-bold mb-4" style="color: var(--color-text-primary);">
        Worship Leader Resources
      </h1>
      <p class="text-lg" style="color: var(--color-text-muted);">
        Practical guides on keys, tempos, theology, and set planning — built from data on 1,500+ worship songs.
      </p>
    </header>

    <div class="space-y-10">
      {posts.map(post => (
        <article class="border-b pb-10" style="border-color: var(--color-border);">
          <div class="mb-2">
            <span class="text-xs uppercase tracking-widest font-semibold px-2 py-1 rounded"
                  style="background: var(--color-bg-secondary); color: var(--color-text-muted);">
              {post.category.replace(/-/g, ' ')}
            </span>
            <span class="text-xs ml-3" style="color: var(--color-text-muted);">
              {new Date(post.publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h2 class="text-2xl font-bold mt-3 mb-3">
            <a href={`/blog/${post.slug}`}
               class="text-primary-700 hover:text-primary-900 transition-colors">
              {post.title}
            </a>
          </h2>
          <p class="mb-4" style="color: var(--color-text-secondary);">
            {post.excerpt}
          </p>
          <div class="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 4).map(tag => (
              <span class="text-xs px-2 py-1 rounded-full"
                    style="background: var(--color-bg-tag); color: var(--color-text-muted);">
                {tag.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
          <a href={`/blog/${post.slug}`}
             class="text-sm font-semibold text-primary-600 hover:text-primary-800 transition-colors">
            Read the full guide →
          </a>
        </article>
      ))}
    </div>

  </div>
</Layout>
```

---

## Step 4 — Create the Individual Blog Post Page

Create the file `src/pages/blog/[slug].astro` with this exact content:

```astro
---
import Layout from '../../layouts/Layout.astro';
import SongCard from '../../components/SongCard.astro';
import blogData from '../../../public/blog-posts.json';
import songsData from '../../../public/songs.json';
import { marked } from 'marked';
import type { Song } from '../../types/song';

export async function getStaticPaths() {
  return blogData.map(post => ({
    params: { slug: post.slug },
    props: { post }
  }));
}

const { post } = Astro.props;
const songs: Song[] = songsData as Song[];

// Find the actual song objects for the songLinks
const linkedSongs = (post.songLinks || [])
  .map((slug: string) => songs.find(s => s.slug === slug))
  .filter(Boolean) as Song[];

// Render markdown body to HTML
const htmlBody = marked(post.body);

// Format publish date
const formattedDate = new Date(post.publishDate).toLocaleDateString('en-US', {
  year: 'numeric', month: 'long', day: 'numeric'
});
---

<Layout title={post.metaTitle} description={post.metaDescription}>
  <div class="max-w-3xl mx-auto px-4 py-10">

    <nav class="mb-8 text-sm" style="color: var(--color-text-muted);">
      <a href="/" class="text-primary-600 hover:text-primary-800 transition-colors">Home</a>
      <span class="mx-2">/</span>
      <a href="/blog" class="text-primary-600 hover:text-primary-800 transition-colors">Blog</a>
      <span class="mx-2">/</span>
      <span>{post.title}</span>
    </nav>

    <!-- Post Header -->
    <header class="mb-10">
      <div class="mb-3">
        <span class="text-xs uppercase tracking-widest font-semibold px-2 py-1 rounded"
              style="background: var(--color-bg-secondary); color: var(--color-text-muted);">
          {post.category.replace(/-/g, ' ')}
        </span>
        <span class="text-xs ml-3" style="color: var(--color-text-muted);">
          {formattedDate}
        </span>
      </div>
      <h1 class="text-4xl font-bold mb-5 leading-tight" style="color: var(--color-text-primary);">
        {post.title}
      </h1>
      <p class="text-lg leading-relaxed" style="color: var(--color-text-secondary);">
        {post.excerpt}
      </p>
    </header>

    <!-- Post Body (rendered Markdown) -->
    <article
      class="prose prose-lg max-w-none mb-16"
      style="
        color: var(--color-text-primary);
        --tw-prose-headings: var(--color-text-primary);
        --tw-prose-links: var(--color-primary-600);
        --tw-prose-bold: var(--color-text-primary);
        --tw-prose-body: var(--color-text-secondary);
      "
      set:html={htmlBody}
    />

    <!-- Related Songs Section -->
    {linkedSongs.length > 0 && (
      <section class="mt-12 pt-10 border-t" style="border-color: var(--color-border);">
        <h2 class="text-2xl font-bold mb-2" style="color: var(--color-text-primary);">
          Songs Referenced in This Guide
        </h2>
        <p class="text-sm mb-6" style="color: var(--color-text-muted);">
          Every song below includes keys, BPM, theology notes, arrangement tips, and worship leadership guidance in the full index.
        </p>
        <div class="grid gap-4 sm:grid-cols-2">
          {linkedSongs.map(song => (
            <SongCard song={song} />
          ))}
        </div>
        <div class="mt-6">
          <a href="/songs" class="text-sm font-semibold text-primary-600 hover:text-primary-800 transition-colors">
            Browse all 1,500+ songs in the index →
          </a>
        </div>
      </section>
    )}

    <!-- Tags -->
    <div class="mt-10 pt-8 border-t" style="border-color: var(--color-border);">
      <div class="flex flex-wrap gap-2">
        {post.tags.map((tag: string) => (
          <a href={`/browse/tags/${tag}`}
             class="text-xs px-3 py-1 rounded-full transition-colors hover:opacity-80"
             style="background: var(--color-bg-tag); color: var(--color-text-muted);">
            {tag.replace(/-/g, ' ')}
          </a>
        ))}
      </div>
    </div>

    <!-- Back to Blog -->
    <div class="mt-8">
      <a href="/blog" class="text-sm text-primary-600 hover:text-primary-800 transition-colors">
        ← Back to all guides
      </a>
    </div>

  </div>
</Layout>
```

---

## Step 5 — Add a prose style to your global CSS

Open `src/styles/global.css` (or wherever your global styles live). Add these prose styles so the blog post body renders well:

```css
/* =============================================
   Blog / Prose Styles
   ============================================= */
.prose h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  color: var(--color-text-primary);
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 0.4rem;
}

.prose h3 {
  font-size: 1.15rem;
  font-weight: 600;
  margin-top: 1.8rem;
  margin-bottom: 0.6rem;
  color: var(--color-text-primary);
}

.prose p {
  line-height: 1.8;
  margin-bottom: 1.2rem;
  color: var(--color-text-secondary);
}

.prose ul, .prose ol {
  padding-left: 1.5rem;
  margin-bottom: 1.2rem;
}

.prose li {
  margin-bottom: 0.4rem;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.prose a {
  color: var(--color-primary-600);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.prose a:hover {
  color: var(--color-primary-800);
}

.prose strong {
  font-weight: 700;
  color: var(--color-text-primary);
}

.prose em {
  font-style: italic;
}

.prose blockquote {
  border-left: 4px solid var(--color-primary-400);
  padding-left: 1.2rem;
  margin: 1.5rem 0;
  color: var(--color-text-muted);
  font-style: italic;
}

.prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.9rem;
}

.prose th {
  background: var(--color-bg-secondary);
  text-align: left;
  padding: 0.6rem 0.8rem;
  font-weight: 600;
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.prose td {
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  vertical-align: top;
}

.prose td a {
  color: var(--color-primary-600);
}

.prose hr {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 2.5rem 0;
}

.prose code {
  background: var(--color-bg-secondary);
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.85em;
}
```

---

## Step 6 — Add Blog to the Homepage

Open `src/pages/index.astro`. Find the section near the end of the page — after the Browse section but before the closing `</Layout>` tag. Add this block:

```astro
---
// Add to the existing imports at the top of the file:
import blogData from '../../public/blog-posts.json';
const recentPosts = blogData
  .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
  .slice(0, 3);
---
```

Then add this HTML section in the page body:

```html
<!-- Blog / Resources Section -->
<section class="mt-20 mb-16">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h2 class="text-2xl font-bold" style="color: var(--color-text-primary);">
        Worship Leader Guides
      </h2>
      <p class="text-sm mt-1" style="color: var(--color-text-muted);">
        Practical help for keys, tempos, set planning, and seasonal worship
      </p>
    </div>
    <a href="/blog" class="text-sm font-semibold text-primary-600 hover:text-primary-800 transition-colors">
      View all guides →
    </a>
  </div>

  <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {recentPosts.map(post => (
      <a href={`/blog/${post.slug}`}
         class="block p-5 rounded-xl border transition-shadow hover:shadow-md"
         style="background: var(--color-bg-card); border-color: var(--color-border);">
        <div class="text-xs uppercase tracking-wide font-semibold mb-2"
             style="color: var(--color-primary-500);">
          {post.category.replace(/-/g, ' ')}
        </div>
        <h3 class="font-bold leading-snug mb-2" style="color: var(--color-text-primary);">
          {post.title}
        </h3>
        <p class="text-sm line-clamp-3" style="color: var(--color-text-muted);">
          {post.excerpt}
        </p>
      </a>
    ))}
  </div>
</section>
```

**Important:** The `{recentPosts.map(...)}` JSX block needs to be inside the Astro template (between the Layout tags), not in a raw HTML comment. Make sure you're inserting it correctly in the Astro file's template section.

---

## Step 7 — Add Blog to the Site Navigation

Open `src/layouts/Layout.astro` (or wherever your nav links live). Find the navigation links (likely containing links to `/browse`, `/songs`, etc.). Add a link to `/blog`:

```html
<a href="/blog" class="nav-link">Guides</a>
```

Place it after the "Browse" or "Songs" link.

---

## Step 8 — Verify the build works

Run:
```
npm run build
```

If there are any TypeScript or import errors:
- The `marked` import may need to be: `import { marked } from 'marked';` — this is correct for marked v5+.
- If you get a type error on `post.songLinks`, add `songLinks?: string[]` to the blog post type.
- If `SongCard` has required props that differ, adjust the `linkedSongs.map` section to match the actual SongCard props.

After a successful build, verify these URLs work:
- `/blog` — the blog listing page
- `/blog/what-key-should-worship-songs-be-in` — first post
- `/blog/worship-songs-for-communion` — second post
- The homepage now shows the 3 most recent blog posts

---

## What This Creates

- `public/blog-posts.json` — all 5 post objects including Markdown body, song links, tags, and SEO metadata
- `src/pages/blog/index.astro` — blog listing page at `/blog`
- `src/pages/blog/[slug].astro` — individual post pages at `/blog/[slug]`
- Updated `src/pages/index.astro` — homepage shows 3 most recent blog cards linking to `/blog`
- Updated `src/layouts/Layout.astro` — nav includes "Guides" link to `/blog`
- Updated global CSS — prose styles for rendered Markdown blog bodies

Each blog post page automatically renders a **"Songs Referenced in This Guide"** section at the bottom, pulling the actual song cards (with keys, BPM, and all metadata) from `public/songs.json` using the `songLinks` array. Internal links in the Markdown body (e.g., `/songs/goodness-of-god`) resolve as standard Astro static routes.
