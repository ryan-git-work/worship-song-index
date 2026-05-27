const fs = require('fs');

const rtfContent = fs.readFileSync('attached_assets/Kari_Jobe_United_Persuit_Batches_1766080882564.rtf', 'utf8');
const existingSongs = require('../public/songs.json');

const existingKeys = new Set(
  existingSongs.map(s => `${s.title.toLowerCase().trim()}|${(s.primary_artist || s.artist || '').toLowerCase().trim()}`)
);

// Extract just the text content, removing RTF formatting
let text = rtfContent
  // Remove RTF header up to the first [
  .replace(/^[\s\S]*?(?=\[)/, '')
  // Remove trailing }
  .replace(/\}$/, '')
  // Convert RTF special chars
  .replace(/\\'92/g, "'")
  .replace(/\\'93/g, '"')
  .replace(/\\'94/g, '"')
  .replace(/\\'96/g, '-')
  .replace(/\\'97/g, '-')
  // Remove backslash-newline (RTF line continuation)
  .replace(/\\\n/g, '')
  // Convert escaped braces to actual braces
  .replace(/\\\{/g, '{')
  .replace(/\\\}/g, '}')
  // Convert RTF double-backslash to single backslash
  .replace(/\\\\/g, '\\')
  .trim();

// Merge multiple JSON arrays into one
text = text.replace(/\]\s*\[/g, ',');

// Clean any remaining issues
text = text.trim();
if (!text.startsWith('[')) text = '[' + text;
if (!text.endsWith(']')) text = text + ']';

let newSongs;
try {
  newSongs = JSON.parse(text);
} catch (e) {
  console.error('Failed to parse JSON:', e.message);
  // Write debug output
  fs.writeFileSync('/tmp/debug-json.txt', text.substring(0, 5000));
  console.log('Debug written to /tmp/debug-json.txt');
  process.exit(1);
}

console.log(`Parsed ${newSongs.length} songs from RTF file`);

function slugify(title, artist) {
  const base = `${title}-${artist || ''}`
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base;
}

const convertedSongs = [];
const duplicates = [];
const usedSlugs = new Set(existingSongs.map(s => s.slug));

for (const song of newSongs) {
  const key = `${song.title.toLowerCase().trim()}|${(song.artist || '').toLowerCase().trim()}`;
  
  if (existingKeys.has(key)) {
    duplicates.push(`${song.title} - ${song.artist}`);
    continue;
  }

  let baseSlug = slugify(song.title, song.artist);
  let slug = baseSlug;
  let counter = 2;
  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  usedSlugs.add(slug);

  const converted = {
    slug: slug,
    title: song.title,
    primary_artist: song.artist,
    default_male_key: song.suggested_male_key,
    default_female_key: song.suggested_female_key,
    tempo_bpm: song.bpm,
    time_signature: "4/4",
    themes: (song.themes || []).map(t => t.toLowerCase().replace(/\s+/g, '-')),
    scripture_refs: song.scripture_references || [],
    summary_theology: (song.summary || '') + ' ' + (song.theology || ''),
    practical_worship_leadership: song.practical_worship_leadership || '',
    arrangement_tips: "",
    tags: [
      song.tempo ? song.tempo.toLowerCase() : "",
      "modern"
    ].filter(Boolean)
  };

  convertedSongs.push(converted);
  existingKeys.add(key);
}

console.log(`Found ${duplicates.length} duplicates (skipped)`);
if (duplicates.length > 0) {
  console.log('Duplicates:', duplicates.slice(0, 10).join(', ') + (duplicates.length > 10 ? '...' : ''));
}

console.log(`Adding ${convertedSongs.length} new songs`);

const updatedSongs = [...existingSongs, ...convertedSongs];
fs.writeFileSync('public/songs.json', JSON.stringify(updatedSongs, null, 2));

console.log(`Total songs now: ${updatedSongs.length}`);
