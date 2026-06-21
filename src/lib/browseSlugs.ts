export function slugifyBrowseValue(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\/\\]/g, '-')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function keyToSlug(key: string): string {
  return slugifyBrowseValue(key.replace('#', '-sharp'));
}

export function timeSignatureToSlug(signature: string): string {
  return signature.replace('/', '-');
}

export function formatKeySlug(slug: string): string {
  const sharpMatch = slug.match(/^([a-g])-sharp$/i);
  if (sharpMatch) return `${sharpMatch[1].toUpperCase()}#`;
  const flatMatch = slug.match(/^([a-g])b$/i);
  if (flatMatch) return `${flatMatch[1].toUpperCase()}b`;
  const naturalMatch = slug.match(/^[a-g]$/i);
  if (naturalMatch) return slug.toUpperCase();

  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function canonicalBrowsePath(kind: string, value: string): string {
  return `/browse/${kind}/${slugifyBrowseValue(value)}/`;
}
