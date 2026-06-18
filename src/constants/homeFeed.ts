/**
 * The saavn API has no native "home feed" endpoint, so the Listen Now screen is
 * assembled from curated JioSaavn featured-playlist IDs. Every ID below was validated
 * against the live API (https://saavn.sumit.co/api/playlists?id=...).
 *
 * Content focus: Tamil + Hindi primary, with some English.
 */

export interface FeedSection {
  key: string;
  title: string;
  /** JioSaavn playlist IDs rendered as cards in this shelf. */
  playlistIds: string[];
}

/** Hero / "Top Picks" — a few flagship playlists shown large at the top. */
export const HERO_PLAYLIST_IDS = ['1219737282', '1134543272', '47599074', '1297282877'];

export const FEED_SECTIONS: FeedSection[] = [
  {
    key: 'trending',
    title: 'Trending Now',
    playlistIds: ['47599074', '1297282877', '1134548194', '6689255'],
  },
  {
    key: 'tamil',
    title: 'Tamil Hits',
    playlistIds: ['1219737282', '1219740946', '1170578783', '1170578779', '901538755'],
  },
  {
    key: 'hindi',
    title: 'Hindi & Bollywood',
    playlistIds: ['1134543272', '1208889749', '1139074020', '932189657', '1167751270'],
  },
  {
    key: 'english',
    title: 'English Essentials',
    playlistIds: ['63116930', '63116921'],
  },
  {
    key: 'decades',
    title: 'Rewind the Decades',
    playlistIds: ['1170578779', '1167751266', '63116921', '1170578842'],
  },
];

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
