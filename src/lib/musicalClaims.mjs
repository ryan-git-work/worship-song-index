import holds from '../data/musicalClaimHolds.json' with {type:'json'};
export const musicalClaimHolds=holds;
export const tempoIsHeld=slug=>holds[slug]?.tempo===true;
export const displayedTempo=(slug,value)=>tempoIsHeld(slug)?null:value;
export const displayedMeter=(slug,value)=>holds[slug]?.meter===true?null:value;
// Retain source records and route membership. Suppress only unsupported musical
// assertions at presentation time while an exact arrangement match is pending.
export function applyMusicalClaimHold(song) {
  if(!holds[song.slug])return song;
  const filter=text=>typeof text!=='string'?text:text.split(/\n\s*\n/).filter(paragraph=>
    !/\b\d+(?:\.\d+)?\s*bpm\b/i.test(paragraph)&&
    !/\bfast (?:song|tempo)\b|\bup[- ]?tempo\b/i.test(paragraph)&&
    !(holds[song.slug].meter&&/12\/8|compound[- ]meter/i.test(paragraph))
  ).join('\n\n').replace(/(^|\n)##[^\n]+\n+(?=##|$)/g,'$1');
  return {...song,tempo_bpm:displayedTempo(song.slug,song.tempo_bpm),time_signature:displayedMeter(song.slug,song.time_signature),
    editorial_markdown:filter(song.editorial_markdown),summary_theology:filter(song.summary_theology),
    practical_worship_leadership:filter(song.practical_worship_leadership),arrangement_tips:filter(song.arrangement_tips)};
}
