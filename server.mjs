import { createReadStream, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

const DIST_ROOT = resolve('dist');
const PORT = Number(process.env.PORT || 5000);
const compressedCache = new Map();
const songRedirects = JSON.parse(readFileSync(new URL('./src/data/songRedirects.json', import.meta.url), 'utf8'));

const contentTypes = new Map([
  ['.avif', 'image/avif'],
  ['.css', 'text/css; charset=utf-8'],
  ['.csv', 'text/csv; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.mp3', 'audio/mpeg'],
  ['.mp4', 'video/mp4'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webm', 'video/webm'],
  ['.webp', 'image/webp'],
  ['.xml', 'application/xml; charset=utf-8'],
]);

function resolveRequestFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relative = normalize(decoded).replace(/^[/\\]+/, '');
  const candidate = resolve(DIST_ROOT, relative);
  if (candidate !== DIST_ROOT && !candidate.startsWith(`${DIST_ROOT}${sep}`)) return null;

  const attempts = extname(candidate)
    ? [candidate]
    : [join(candidate, 'index.html'), `${candidate}.html`];

  for (const file of attempts) {
    try {
      if (statSync(file).isFile()) return file;
    } catch {
      // Try the next static-path form.
    }
  }
  return null;
}

function chooseEncoding(acceptEncoding, contentType, size) {
  if (size < 1024 || !/^(text\/|application\/(javascript|json|xml))/.test(contentType)) return null;
  if (/\bbr\b/.test(acceptEncoding)) return 'br';
  if (/\bgzip\b/.test(acceptEncoding)) return 'gzip';
  return null;
}

function compressedBody(file, encoding, stat) {
  const key = `${file}:${stat.mtimeMs}:${stat.size}:${encoding}`;
  const cached = compressedCache.get(key);
  if (cached) return cached;

  const source = readFileSync(file);
  const body = encoding === 'br'
    ? brotliCompressSync(source, {
        params: { [constants.BROTLI_PARAM_QUALITY]: 6 },
      })
    : gzipSync(source, { level: 6 });
  compressedCache.set(key, body);
  return body;
}

function serveFile(request, response, file, statusCode = 200) {
  const stat = statSync(file);
  const contentType = contentTypes.get(extname(file).toLowerCase()) || 'application/octet-stream';
  const encoding = chooseEncoding(request.headers['accept-encoding'] || '', contentType, stat.size);
  const etag = `W/\"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}\"`;

  response.statusCode = statusCode;
  response.setHeader('Content-Type', contentType);
  response.setHeader('ETag', etag);
  response.setHeader('Last-Modified', stat.mtime.toUTCString());
  response.setHeader('Vary', 'Accept-Encoding');
  response.setHeader(
    'Cache-Control',
    file.includes(`${sep}_astro${sep}`)
      ? 'public, max-age=31536000, immutable'
      : contentType.startsWith('text/html')
        ? 'public, max-age=0, must-revalidate'
        : 'public, max-age=3600, stale-while-revalidate=86400',
  );

  if (request.headers['if-none-match'] === etag) {
    response.statusCode = 304;
    response.end();
    return;
  }

  if (encoding) {
    const body = compressedBody(file, encoding, stat);
    response.setHeader('Content-Encoding', encoding);
    response.setHeader('Content-Length', body.length);
    response.end(request.method === 'HEAD' ? undefined : body);
    return;
  }

  response.setHeader('Content-Length', stat.size);
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(file).pipe(response);
}

const catalogIntegrity = JSON.parse(readFileSync(new URL('./src/data/catalogIntegrity.json', import.meta.url), 'utf8'));
const deletedSongSlugs = new Set(catalogIntegrity.deleted || []);

// Fixed one-off redirects for URLs Google reports as 404 (GSC, 2026-09-26).
const staticRedirects = new Map([
  ['/canciones/artistas', '/canciones/'],
  ['/canciones/artistas/', '/canciones/'],
  ['/canciones/temas', '/canciones/'],
  ['/canciones/temas/', '/canciones/'],
  ['/canciones', '/canciones/'],
]);

// Mirrors src/lib/browseSlugs.ts. Astro middleware does not run in a static
// build, so the canonicalization in src/middleware.ts never reached production.
// GSC listed 926 404s on 2026-09-26; 900+ were non-canonical spellings of real
// browse pages ("/browse/tags/Holy Spirit/", "/browse/themes/gods_power",
// "/browse/keys/male/A"). This does the same canonicalization at serve time and
// only redirects when the canonical page actually exists in dist.
function slugifyBrowseValue(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\/\\]/g, '-')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function keyToSlug(key) {
  const normalized = key.trim()
    .replace(/\s*minor$/i, 'm')
    .replace(/\s*major$/i, '');
  return slugifyBrowseValue(normalized.replace('#', '-sharp'));
}

function decodeSegment(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function distPageExists(pathname) {
  try {
    return statSync(join(DIST_ROOT, pathname, 'index.html')).isFile();
  } catch {
    return false;
  }
}

function canonicalBrowsePath(pathname) {
  const facet = pathname.match(/^\/browse\/(tags|themes|artists)\/(.+?)\/?$/);
  if (facet) {
    const [, kind, raw] = facet;
    const slug = slugifyBrowseValue(decodeSegment(raw));
    if (!slug) return null;
    if (kind === 'tags' && distPageExists(`/browse/artists/${slug}/`) && !distPageExists(`/browse/tags/${slug}/`)) {
      return `/browse/artists/${slug}/`;
    }
    const candidate = `/browse/${kind}/${slug}/`;
    return distPageExists(candidate) ? candidate : null;
  }
  const key = pathname.match(/^\/browse\/keys\/(male|female)\/(.+?)\/?$/);
  if (key) {
    const candidate = `/browse/keys/${key[1]}/${keyToSlug(decodeSegment(key[2]))}/`;
    return distPageExists(candidate) ? candidate : null;
  }
  return null;
}

function redirect(response, location) {
  response.statusCode = 301;
  response.setHeader('Location', location);
  response.end();
}

createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.statusCode = 405;
    response.setHeader('Allow', 'GET, HEAD');
    response.end('Method Not Allowed');
    return;
  }

  let pathname;
  try {
    pathname = new URL(request.url || '/', 'http://localhost').pathname;
  } catch {
    pathname = '/';
  }

  let file = null;
  const staticTarget = staticRedirects.get(pathname);
  if (staticTarget) {
    redirect(response, staticTarget);
    return;
  }

  const songMatch = pathname.match(/^\/songs\/([^/]+)\/?$/);
  const redirectSlug = songMatch ? songRedirects[songMatch[1]] : null;
  if (redirectSlug) {
    response.statusCode = 301;
    response.setHeader('Location', `/songs/${redirectSlug}/`);
    response.end();
    return;
  }

  if (songMatch && deletedSongSlugs.has(songMatch[1])) {
    response.statusCode = 410;
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    response.end('Gone');
    return;
  }

  try {
    file = resolveRequestFile(pathname);
  } catch {
    file = null;
  }

  if (file) {
    serveFile(request, response, file);
    return;
  }

  if (pathname.startsWith('/browse/')) {
    const canonical = canonicalBrowsePath(pathname);
    if (canonical && canonical !== pathname) {
      redirect(response, canonical);
      return;
    }
  }

  const notFound = join(DIST_ROOT, '404.html');
  try {
    serveFile(request, response, notFound, 404);
  } catch {
    response.statusCode = 404;
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    response.end('Page Not Found');
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Worship Song Index serving dist on port ${PORT}`);
});
