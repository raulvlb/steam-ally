/**
 * Steam API Response Types
 */

export interface SearchUserResult {
  steamId: string;
  personaName: string;
  avatar: string;
  profileUrl: string;
}

export interface SteamPlayer {
  steamid: string;
  communityvisibilitystate: number;
  profilestate: number;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  avatarhash: string;
  lastlogoff?: number;
  personastate: number;
  realname?: string;
  primaryclanid?: string;
  timecreated?: number;
  personastateflags?: number;
  loccountrycode?: string;
  locstatecode?: string;
  loccityid?: number;
}

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  playtime_windows_forever?: number;
  playtime_mac_forever?: number;
  playtime_linux_forever?: number;
  img_icon_url?: string;
  img_logo_url?: string;
  has_community_visible_stats?: boolean;
  playtime_2weeks?: number;
}

export interface OwnedGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
  img_logo_url: string;
  has_community_visible_stats?: boolean;
  playtime_2weeks?: number;
}

export interface Achievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
  name?: string;
  description?: string;
}

export interface GameAchievement {
  name: string;
  defaultvalue: number;
  displayName: string;
  hidden: number;
  description: string;
  icon: string;
  icongray: string;
}

export interface PlayerAchievements {
  steamID: string;
  gameName: string;
  achievements: Achievement[];
  success: boolean;
}

export interface GameSchema {
  gameName: string;
  gameVersion: string;
  availableGameStats: {
    achievements: GameAchievement[];
  };
}

export interface RecentGame {
  appid: number;
  name: string;
  playtime_2weeks: number;
  playtime_forever: number;
  img_icon_url: string;
  img_logo_url: string;
}

export interface UserStatsForGame {
  steamID: string;
  gameName: string;
  achievements?: Achievement[];
  stats?: Array<{
    name: string;
    value: number;
  }>;
  success: boolean;
}

export interface SteamLevel {
  player_level: number;
}

export interface VanityURLResponse {
  response: {
    steamid?: string;
    success: number;
    message?: string;
  };
}

export interface PlayerSummaryResponse {
  response: {
    players: SteamPlayer[];
  };
}

export interface OwnedGamesResponse {
  response: {
    game_count: number;
    games: OwnedGame[];
  };
}

export interface RecentGamesResponse {
  response: {
    total_count: number;
    games: RecentGame[];
  };
}

export interface PlayerAchievementsResponse {
  playerstats: PlayerAchievements;
}

export interface GameSchemaResponse {
  game: GameSchema;
}

export interface SteamLevelResponse {
  response: SteamLevel;
}

/**
 * Application Types
 */

export interface UserProfile {
  steamId: string;
  personaName: string;
  avatar: string;
  avatarFull: string;
  profileUrl: string;
  realName?: string;
  personaState: PersonaState;
  timeCreated?: number;
  countryCode?: string;
  level?: number;
  gamesCount?: number;
  totalPlaytime?: number;
}

export enum PersonaState {
  Offline = 0,
  Online = 1,
  Busy = 2,
  Away = 3,
  Snooze = 4,
  LookingToTrade = 5,
  LookingToPlay = 6,
}

export interface GameDetails {
  appId: number;
  name: string;
  playtime: number;
  playtimeRecent?: number;
  iconUrl: string;
  logoUrl: string;
  hasStats?: boolean;
}

export interface SteamStoreGame {
  id: number;
  name: string;
  tiny_image?: string;
  header_image?: string;
  capsule_image?: string;
  short_description?: string;
  price?: {
    final: number;
    discount_percent: number;
    initial: number;
    currency: string;
  };
}

export interface GameFullDetails {
  appId: number;
  name: string;
  type: string;
  shortDescription: string;
  detailedDescription: string;
  headerImage: string;
  screenshots: Array<{
    id: number;
    path_thumbnail: string;
    path_full: string;
  }>;
  movies?: Array<{
    id: number;
    name: string;
    thumbnail: string;
    webm: { [quality: string]: string };
    mp4: { [quality: string]: string };
  }>;
  developers: string[];
  publishers: string[];
  releaseDate: {
    coming_soon: boolean;
    date: string;
  };
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  metacritic?: {
    score: number;
    url: string;
  };
  categories?: Array<{
    id: number;
    description: string;
  }>;
  genres?: Array<{
    id: string;
    description: string;
  }>;
  price?: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
  };
  isFree: boolean;
  website?: string;
}

export interface AchievementWithDetails extends Achievement {
  displayName: string;
  description: string;
  icon: string;
  iconGray: string;
  hidden: boolean;
  percentage?: number;
}

export interface AchievementStats {
  total: number;
  unlocked: number;
  percentage: number;
}

/**
 * API Error Types
 */

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

/**
 * UI State Types
 */

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SearchState {
  query: string;
  results: unknown[];
  isSearching: boolean;
}

/**
 * Store Types
 */

export interface ThemeStore {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

/**
 * Guide Types
 */

export type EntryType = 'achievement' | 'general';

export interface GuideEntry {
  id: string;
  type: EntryType;
  achievementId?: string;
  title?: string;
  content: string;
}

export interface Guide {
  entries: GuideEntry[];
}

/**
 * Cache Types
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

export type CacheStore = Map<string, CacheEntry<unknown>>;
