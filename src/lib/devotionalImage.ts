const IMAGE_COUNT = 8;

export function getDevotionalImageIndex(slug: string): number {
  let sum = 0;
  for (let i = 0; i < slug.length; i++) {
    sum += slug.charCodeAt(i);
  }
  return (sum % IMAGE_COUNT) + 1;
}

export function getDevotionalImagePath(slug: string): string {
  const index = getDevotionalImageIndex(slug);
  return `/devotional-images/devo-${index}.jpg`;
}
