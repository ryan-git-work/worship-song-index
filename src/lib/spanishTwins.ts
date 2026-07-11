export const spanishToEnglishTwins: Record<string, string> = {
  'oceanos-es': 'oceans-where-feet-may-fail',
  'que-hermoso-nombre': 'what-a-beautiful-name',
  'rey-de-reyes-es': 'king-of-kings-hillsong',
  'hosanna-es': 'hosanna-hillsong',
  'con-todo': 'with-everything-hillsong',
  'poderoso-para-salvar': 'mighty-to-save',
  'desde-mi-interior': 'from-the-inside-out',
  'bondad-de-dios': 'goodness-of-god',
  'ya-no-soy-esclavo': 'no-longer-slaves',
  'way-maker-espanol': 'way-maker',
  'amor-sin-condicion': 'reckless-love',
  'cuan-grande-es-mi-dios': 'how-great-is-our-god',
  'solo-en-jesus': 'in-christ-alone',
  'eres-mi-respirar': 'breathe-marie-barnett',
  'abre-mis-ojos-oh-cristo': 'open-the-eyes-of-my-heart',
  'diez-mil-razones': '10000-reasons-matt-redman',
  'tu-nombre-levantare': 'lord-i-lift-your-name-on-high',
  'vine-a-adorarte': 'here-i-am-to-worship',
  'ven-es-hora-de-adorarle': 'come-now-is-the-time-to-worship',
  'buen-buen-padre': 'good-good-father',
  'cuan-grande-es-el': 'how-great-thou-art',
  'grande-es-tu-fidelidad': 'great-is-thy-faithfulness',
  'santo-santo-santo-es': 'holy-holy-holy',
  'castillo-fuerte': 'a-mighty-fortress-is-our-god',
  'roca-de-la-eternidad': 'rock-of-ages',
  'oh-que-amigo-nos-es-cristo': 'what-a-friend-we-have-in-jesus',
  'a-solas-al-huerto': 'in-the-garden-c-austin-miles',
  'estad-por-cristo-firmes': 'stand-up-stand-up-for-jesus',
  'cuando-alla-se-pase-lista': 'when-the-roll-is-called-james-black',
  'al-mundo-paz': 'joy-to-the-world',
  'noche-de-paz': 'silent-night',
  'angeles-cantando-estan': 'angels-we-have-heard-on-high',
  'venid-fieles-todos': 'o-come-all-ye-faithful',
  'oh-ven-oh-ven-emanuel': 'o-come-o-come-emmanuel',
  'en-la-cruz': 'at-the-cross-watts-hudson',
  'hay-poder-en-jesus': 'there-is-power-in-the-blood-lewis-jones',
  'cristo-me-ama': 'jesus-loves-me',
  'cuan-dulce-el-nombre': 'how-sweet-the-name-of-jesus-sounds-john-newton',
  'dad-gracias': 'give-thanks-henry-smith',
  'majestad-es': 'majesty-jack-hayford',
  'te-amo-rey': 'i-love-you-lord-laurie-klein',
  'tal-como-soy-es': 'just-as-i-am-without-one-plea-philip-bliss',
  'como-el-ciervo': 'as-the-deer',
  'dulce-oracion': 'sweet-hour-of-prayer-walford',
  'al-cristo-vivo-sirvo': 'i-serve-a-risen-savior-ackley',
  'grato-es-decir-la-historia': 'i-love-to-tell-the-story-kate-hankey',
  'la-bendicion': 'the-blessing',
  'lo-haras-otra-vez': 'do-it-again-elevation-worship',
  'mismo-dios': 'same-god-elevation',
  'encuentrame-otra-vez': 'here-again',
  'promesas-maverick-city': 'promises-maverick-city',
  'mi-todo-hillsong': 'christ-is-enough',
  'es-nuestro-dios': 'this-is-our-god',
  'el-cordero-y-leon': 'the-lion-and-the-lamb',
  'tu-dices-twice-musica': 'you-say-lauren-daigle',
  'santo-por-siempre': 'holy-forever-chris-tomlin',
  'dios-de-esta-ciudad': 'god-of-this-city',
  'porque-el-vive': 'because-he-lives-gaither',
  'pon-tus-ojos-en-cristo': 'turn-your-eyes-upon-jesus',
  'glorioso-dia-miel-san-marcos': 'glorious-day-passion',
  'cerca-de-ti-senor': 'nearer-my-god-to-thee',
  'oh-amor-que-no-me-dejaras': 'o-love-that-wilt-not-let-me-go-red-records',
  'a-dios-el-padre-celestial': 'doxology',
};

export const englishToSpanishTwins = Object.fromEntries(
  Object.entries(spanishToEnglishTwins).map(([spanishSlug, englishSlug]) => [englishSlug, spanishSlug]),
) as Record<string, string>;

export function getSpanishAlternates(spanishSlug: string) {
  const englishSlug = spanishToEnglishTwins[spanishSlug];
  if (!englishSlug) return [];
  const englishHref = `https://worshipsongindex.com/songs/${englishSlug}/`;
  const spanishHref = `https://worshipsongindex.com/canciones/${spanishSlug}/`;
  return [
    { hreflang: 'en', href: englishHref },
    { hreflang: 'es', href: spanishHref },
    { hreflang: 'x-default', href: englishHref },
  ];
}

export function getEnglishAlternates(englishSlug: string) {
  const spanishSlug = englishToSpanishTwins[englishSlug];
  if (!spanishSlug) return [];
  const englishHref = `https://worshipsongindex.com/songs/${englishSlug}/`;
  const spanishHref = `https://worshipsongindex.com/canciones/${spanishSlug}/`;
  return [
    { hreflang: 'en', href: englishHref },
    { hreflang: 'es', href: spanishHref },
    { hreflang: 'x-default', href: englishHref },
  ];
}
