import { defineMiddleware } from 'astro:middleware';
import { keyToSlug, slugifyBrowseValue } from './lib/browseSlugs';
import { songs } from './lib/songs';

const artistSlugs = new Set(songs.map((song) => slugifyBrowseValue(song.primary_artist)));

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function redirectIfNeeded(context: Parameters<Parameters<typeof defineMiddleware>[0]>[0], canonicalPath: string) {
  if (context.url.pathname !== canonicalPath) {
    return context.redirect(canonicalPath, 301);
  }
  return null;
}

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  // Canonicalize theme URLs: lowercase, hyphenated, punctuation-stripped, trailing slash.
  if (pathname.includes('/browse/themes/')) {
    const themeMatch = pathname.match(/^\/browse\/themes\/(.+?)\/?$/);
    if (themeMatch) {
      const theme = decodeSegment(themeMatch[1]);
      const canonical = `/browse/themes/${slugifyBrowseValue(theme)}/`;
      const redirect = redirectIfNeeded(context, canonical);
      if (redirect) return redirect;
    }
  }

  // Handle key URLs with uppercase or sharp encoding → redirect to lowercase/sharp format.
  if (pathname.includes('/browse/keys/')) {
    const keyMatch = pathname.match(/^\/browse\/keys\/(male|female)\/(.+?)\/?$/);
    if (keyMatch) {
      const gender = keyMatch[1];
      const key = decodeSegment(keyMatch[2]);
      const canonical = `/browse/keys/${gender}/${keyToSlug(key)}/`;
      const redirect = redirectIfNeeded(context, canonical);
      if (redirect) return redirect;
    }
  }

  // Canonicalize tag URLs and consolidate artist-name tags onto artist pages.
  if (pathname.includes('/browse/tags/')) {
    const tagMatch = pathname.match(/^\/browse\/tags\/(.+?)\/?$/);
    if (tagMatch) {
      const tag = decodeSegment(tagMatch[1]);
      const tagSlug = slugifyBrowseValue(tag);
      const canonical = artistSlugs.has(tagSlug)
        ? `/browse/artists/${tagSlug}/`
        : `/browse/tags/${tagSlug}/`;
      const redirect = redirectIfNeeded(context, canonical);
      if (redirect) return redirect;
    }
  }

  // Canonicalize artist URLs without changing the established artist slug format.
  if (pathname.includes('/browse/artists/')) {
    const artistMatch = pathname.match(/^\/browse\/artists\/(.+?)\/?$/);
    if (artistMatch) {
      const artist = decodeSegment(artistMatch[1]);
      const canonical = `/browse/artists/${slugifyBrowseValue(artist)}/`;
      const redirect = redirectIfNeeded(context, canonical);
      if (redirect) return redirect;
    }
  }

  return next();
});
