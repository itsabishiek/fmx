/**
 * The Home feed now comes live from YouTube Music (`FEmusic_home`, see `getHome`), so the old
 * curated JioSaavn playlist IDs are gone. The Browse tab still uses these category tiles, each of
 * which drives a YouTube Music search query.
 *
 * Content focus: Tamil + Hindi primary, with some English.
 */

/** Categories shown on the Browse tab. */
export interface BrowseCategory {
  key: string;
  title: string;
  /** Search query used to populate the category. */
  query: string;
  colors: [string, string];
}

export const BROWSE_CATEGORIES: BrowseCategory[] = [
  { key: 'tamil', title: 'Tamil', query: 'tamil hits', colors: ['#fd356d', '#7b1f3a'] },
  { key: 'hindi', title: 'Hindi', query: 'hindi hits', colors: ['#8e2de2', '#4a00e0'] },
  { key: 'english', title: 'English', query: 'english top', colors: ['#2193b0', '#6dd5ed'] },
  { key: 'punjabi', title: 'Punjabi', query: 'punjabi hits', colors: ['#f7971e', '#ffd200'] },
  { key: 'romance', title: 'Romance', query: 'romantic hits', colors: ['#ff5e8a', '#fd356d'] },
  { key: 'party', title: 'Party', query: 'party hits', colors: ['#ee0979', '#ff6a00'] },
  { key: 'workout', title: 'Workout', query: 'workout', colors: ['#11998e', '#38ef7d'] },
  { key: 'devotional', title: 'Devotional', query: 'devotional', colors: ['#f12711', '#f5af19'] },
  { key: 'lofi', title: 'Lo-Fi & Chill', query: 'lofi chill', colors: ['#373b44', '#4286f4'] },
  { key: 'trending', title: 'Trending', query: 'trending', colors: ['#fd356d', '#c41d4e'] },
];
