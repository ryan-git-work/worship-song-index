/**
 * Song interface defining the structure of each song entry.
 * Add new fields here to extend song data across the entire application.
 * 
 * Field naming matches the JSON data structure from songs.json
 */
export interface Song {
  /** URL-friendly slug for the song (e.g., "way-maker") */
  slug: string;
  
  /** The title of the worship song */
  title: string;
  
  /** The primary artist or band who performs the song */
  primary_artist: string;
  
  /** Default/suggested key for male vocalists */
  default_male_key: string;
  
  /** Default/suggested key for female vocalists */
  default_female_key: string;
  
  /** Beats per minute */
  tempo_bpm: number;
  
  /** Time signature (e.g., "4/4", "6/8", "3/4") */
  time_signature: string;
  
  /** Array of theme tags for categorization */
  themes: string[];
  
  /** Array of Scripture references related to the song */
  scripture_refs: string[];
  
  /** Theological summary explaining the song's meaning and focus */
  summary_theology: string;
  
  /** Tips for worship leaders on when and how to use this song */
  practical_worship_leadership: string;
  
  /** Musical arrangement tips for bands and musicians */
  arrangement_tips: string;
  
  /** Additional categorization tags */
  tags: string[];
  
  /** Optional YouTube video URL for embedding */
  youtube?: string;
  
  /** Optional Spotify track URL */
  spotify?: string;
  
  /** Optional Amazon Music link */
  amazon_link?: string;

  /** Optional long-form editorial content for enhanced song pages */
  editorial_markdown?: string;

  /** Content language. Existing English catalog entries default to "en" at load time. */
  language?: 'en' | 'es';
}

export interface SpanishSong {
  slug: string;
  title: string;
  primary_artist: string;
  year: number | null;
  default_male_key: string | null;
  default_female_key: string | null;
  tempo_bpm: number | null;
  time_signature: string | null;
  themes: string[];
  scripture_refs: string[];
  summary_theology: string;
  language: 'es';
  url: string;
  cluster?: string;
  verified?: boolean;
  verify_flags?: string[];
  tags: string[];
  practical_worship_leadership: string;
  arrangement_tips: string;
  editorial_markdown: string;
}

/**
 * Generates a URL-friendly slug from a song title.
 * Converts "Living Hope" to "living-hope"
 * 
 * @param title - The song title to convert
 * @returns URL-friendly slug string
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Extracts YouTube video ID from a YouTube URL.
 * Supports both youtube.com/watch?v= and youtu.be/ formats.
 * 
 * @param url - The YouTube URL
 * @returns The video ID or null if not found
 */
export function getYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Converts tempo BPM to a descriptive tempo label
 * @param bpm - Beats per minute
 * @returns Tempo description string
 */
export function getTempoLabel(bpm: number): string {
  if (bpm < 66) return 'Slow';
  if (bpm < 90) return 'Medium';
  if (bpm < 120) return 'Upbeat';
  return 'Fast';
}

/**
 * Formats a theme string for display (capitalizes and removes hyphens)
 * @param theme - Raw theme string
 * @returns Formatted theme string
 */
export function formatTheme(theme: string): string {
  return theme
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
