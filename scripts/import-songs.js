import fs from 'fs';

const rtfContent = fs.readFileSync('attached_assets/Another_new_Batch_1765649701337.rtf', 'utf8');

let text = rtfContent
  .replace(/\\'92/g, "'")
  .replace(/\\par\s*/g, '\n')
  .replace(/\\\\/g, '⏎')
  .replace(/\\[a-z0-9]+\s?/gi, '')
  .replace(/[{}]/g, '')
  .replace(/⏎/g, '')
  .replace(/\r/g, '');

const lines = text.split('\n').filter(line => line.trim());

let currentSong = {};
let allSongs = [];

for (const line of lines) {
  const trimmed = line.trim();
  
  if (trimmed.startsWith('"title":')) {
    if (currentSong.title) {
      allSongs.push({...currentSong});
    }
    currentSong = {};
    currentSong.title = trimmed.match(/"title":\s*"([^"]+)"/)?.[1] || '';
  } else if (trimmed.startsWith('"artist":')) {
    currentSong.artist = trimmed.match(/"artist":\s*"([^"]+)"/)?.[1] || '';
  } else if (trimmed.startsWith('"suggested_male_key":')) {
    currentSong.maleKey = trimmed.match(/"suggested_male_key":\s*"([^"]+)"/)?.[1] || '';
  } else if (trimmed.startsWith('"suggested_female_key":')) {
    currentSong.femaleKey = trimmed.match(/"suggested_female_key":\s*"([^"]+)"/)?.[1] || '';
  } else if (trimmed.startsWith('"tempo":')) {
    currentSong.tempo = trimmed.match(/"tempo":\s*"([^"]+)"/)?.[1] || '';
  } else if (trimmed.startsWith('"bpm":')) {
    currentSong.bpm = parseInt(trimmed.match(/"bpm":\s*(\d+)/)?.[1] || '80');
  } else if (trimmed.startsWith('"themes":')) {
    const themesMatch = trimmed.match(/\[(.*?)\]/);
    if (themesMatch) {
      currentSong.themes = themesMatch[1].match(/"([^"]+)"/g)?.map(t => t.replace(/"/g, '')) || [];
    }
  } else if (trimmed.startsWith('"scripture_references":')) {
    const refsMatch = trimmed.match(/\[(.*?)\]/);
    if (refsMatch) {
      currentSong.scriptureRefs = refsMatch[1].match(/"([^"]+)"/g)?.map(t => t.replace(/"/g, '')) || [];
    }
  } else if (trimmed.startsWith('"summary":')) {
    currentSong.summary = trimmed.match(/"summary":\s*"(.+)"/)?.[1] || '';
  } else if (trimmed.startsWith('"theology":')) {
    currentSong.theology = trimmed.match(/"theology":\s*"(.+)"/)?.[1] || '';
  } else if (trimmed.startsWith('"practical_worship_leadership":')) {
    currentSong.leadership = trimmed.match(/"practical_worship_leadership":\s*"(.+)"/)?.[1] || '';
  }
}

if (currentSong.title) {
  allSongs.push(currentSong);
}

console.log(`Parsed ${allSongs.length} songs from RTF`);

const existingSongs = JSON.parse(fs.readFileSync('public/songs.json', 'utf8'));

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeThemes(themes) {
  return themes.map(t => t.toLowerCase().replace(/[^a-z0-9\s&]/g, '').trim());
}

function generateTags(song) {
  const tags = ['modern'];
  if (song.bpm < 80) tags.push('slow');
  else if (song.bpm > 110) tags.push('upbeat');
  return tags;
}

const convertedSongs = allSongs.filter(s => s.title && s.artist).map(song => ({
  slug: slugify(song.title),
  title: song.title,
  primary_artist: song.artist,
  default_male_key: song.maleKey || 'G',
  default_female_key: song.femaleKey || 'B',
  tempo_bpm: song.bpm || 80,
  time_signature: '4/4',
  themes: normalizeThemes(song.themes || []),
  scripture_refs: song.scriptureRefs || [],
  summary_theology: song.theology || song.summary || '',
  practical_worship_leadership: song.leadership || '',
  arrangement_tips: `${song.summary || ''} Use the practical leadership notes above for arrangement guidance.`,
  tags: generateTags(song)
}));

console.log(`Converted ${convertedSongs.length} valid songs`);

const existingSlugs = new Set(existingSongs.map(s => s.slug));
const newUniqueSongs = convertedSongs.filter(s => !existingSlugs.has(s.slug));

console.log(`${newUniqueSongs.length} are new (not duplicates)`);

const mergedSongs = [...existingSongs, ...newUniqueSongs];

fs.writeFileSync('public/songs.json', JSON.stringify(mergedSongs, null, 2));

console.log(`Total songs now: ${mergedSongs.length}`);
