import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  // Handle theme URLs with spaces → redirect to hyphenated version
  if (pathname.includes('/browse/themes/')) {
    const themeMatch = pathname.match(/^\/browse\/themes\/(.+?)\/?$/);
    if (themeMatch) {
      const theme = themeMatch[1];
      // If the theme contains spaces, redirect to hyphenated version
      if (theme.includes(' ')) {
        const hyphenated = theme.replace(/\s+/g, '-').toLowerCase();
        return context.redirect(`/browse/themes/${hyphenated}/`, 301);
      }
    }
  }

  // Handle key URLs with uppercase or sharp encoding → redirect to lowercase/sharp format
  if (pathname.includes('/browse/keys/')) {
    const keyMatch = pathname.match(/^\/browse\/keys\/(male|female)\/(.+?)\/?$/);
    if (keyMatch) {
      const gender = keyMatch[1];
      const key = keyMatch[2];
      
      // Handle F# and F%23 → f-sharp, C# and C%23 → c-sharp
      if (key === 'F%23' || key === 'F#') {
        return context.redirect(`/browse/keys/${gender}/f-sharp/`, 301);
      }
      if (key === 'C%23' || key === 'C#') {
        return context.redirect(`/browse/keys/${gender}/c-sharp/`, 301);
      }
      
      // If key contains uppercase, redirect to lowercase
      if (key !== key.toLowerCase()) {
        const lowercase = key.toLowerCase();
        return context.redirect(`/browse/keys/${gender}/${lowercase}/`, 301);
      }
    }
  }

  return next();
});
