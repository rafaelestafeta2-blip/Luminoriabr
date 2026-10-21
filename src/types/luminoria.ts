export type NavSectionId =
  | 'home'
  | 'channels'
  | 'series'
  | 'playlists'
  | 'favorites'
  | 'shop'
  | 'profile'
  | 'cinema';

export type ColorSchemeId =
  | 'lotus'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'lavender'
  | 'midnight';

export interface ColorSchemePreset {
  id: ColorSchemeId;
  name: string;
  description: string;
  primaryHex: string;
  secondaryHex: string;
}

export interface EpgProgram {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  progress: number;
}

export interface Channel {
  id: string;
  name: string;
  epgId: string;
  groupName: string;
  url: string;
  sources: string[];
  playlistId: string;
  logoUrl?: string;
  artworkVariant: 'news' | 'sports' | 'cinema' | 'doc' | 'anime' | 'music';
  quality: '4K UHD' | 'FHD 60fps' | 'HD';
  isLive: boolean;
  currentPrograms: EpgProgram[];
}

export interface PlaylistSource {
  id: string;
  name: string;
  type: 'm3u' | 'xtream';
  urlOrHost: string;
  m3uUrl?: string;
  username?: string;
  password?: string;
  channelCount: number;
  totalServerItems?: number;
  liveCount?: number;
  moviesCount?: number;
  seriesCount?: number;
  epgUrl?: string;
  updatedAt: string;
  isActive: boolean;
}

export interface VodReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type ArtworkVariantKey =
  | 'cyber_odyssey'
  | 'crimson_freq'
  | 'solaris_titan'
  | 'shadow_protocol'
  | 'tokyo_drift_neo'
  | 'lusitania_noir'
  | 'abyssal_horizon'
  | 'valkyrie_code'
  | 'silk_road_2099'
  | 'quantum_heist'
  | 'tulsa_king'
  | 'reacher_series'
  | 'the_boys_series'
  | 'breaking_bad_series'
  | 'origem_series'
  | 'arcane_series'
  | 'aot_theme'
  | 'naruto_theme'
  | 'ryan_theme'
  | 'fast_theme'
  | 'dune_2'
  | 'crimson_protocol'
  | 'neon_valkyrie'
  | 'emerald_dynasty'
  | 'velvet_noir'
  | (string & {});

export interface SeriesEpisodeItem {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  duration: string;
  synopsis?: string;
  stillUrl?: string;
  streamUrl: string;
}

export interface VodItem {
  id: string;
  title: string;
  year: number;
  duration: string;
  rating: number;
  category: string;
  rawCategoryName?: string;
  mediaType?: 'movie' | 'series';
  synopsis: string;
  director: string;
  cast: string[];
  actorsList?: string[];
  streamUrl: string;
  artworkKey: ArtworkVariantKey;
  posterUrl?: string;
  backdropUrl?: string;
  tmdbId?: number;
  xtreamStreamId?: number;
  xtreamSeriesId?: number;
  youtubeTrailerId?: string;
  episodes?: SeriesEpisodeItem[];
  rankPosition?: number;
  watchProgress?: number;
  isComingSoon?: boolean;
  hasM3uStream?: boolean;
}

export interface SportsSlide {
  id: string;
  competition: string;
  teamHome: string;
  teamAway: string;
  scoreHome: number;
  scoreAway: number;
  statusText: string;
  channelId: string;
}

export interface CinemaChatMessage {
  id: string;
  senderName: string;
  senderRank: string;
  text: string;
  timestamp: string;
}

export interface CinemaRoomState {
  code: string;
  hostName: string;
  vodId: string;
  isPlaying: boolean;
  currentTimeSec: number;
  durationSec: number;
  participants: { id: string; name: string; rank: string; isHost: boolean }[];
  messages: CinemaChatMessage[];
}

export type ShopCategoryType = 'all' | 'themes' | 'borders' | 'special' | 'merch';

export interface ShopProduct {
  id: string;
  name: string;
  description: string;
  category: Exclude<ShopCategoryType, 'all'>;
  priceCoins: number;
  previewColor: string;
  artworkKey?: ArtworkVariantKey;
  badgeLabel?: string;
  requiresDelivery: boolean;
}

export interface RankEntry {
  rank: number;
  userId: string;
  username: string;
  countryCode: string;
  watchHours: number;
  watchTimeFormatted?: string;
  xp: number;
  equippedBorderId: string;
  avatarColor?: string;
  avatarUrl?: string;
  isAdminCrown?: boolean;
}

export interface DirectChatMessage {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  reaction?: string;
  sharedMovieTitle?: string;
}

export interface FriendContact {
  id: string;
  username: string;
  handle?: string;
  status: 'online' | 'watching' | 'offline';
  lastSeenLabel?: string;
  lastSeenAt?: string;
  isTyping?: boolean;
  unreadCount?: number;
  isFavorite?: boolean;
  isBlocked?: boolean;
  avatarColor?: string;
  avatarUrl?: string;
  activity?: string;
  bio?: string;
  countryCode: string;
  xp: number;
  messages: DirectChatMessage[];
}

export interface FriendRequestItem {
  id: string;
  fromUserId: string;
  fromHandle: string;
  fromUsername: string;
  fromAvatarUrl?: string;
  fromCountryCode?: string;
  toUserId: string;
  toHandle: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAtLabel: string;
  createdAtIso?: string;
}

export interface TimelineEntry {
  id: string;
  vodId: string;
  title: string;
  year: number;
  timeAgo: string;
  artworkKey: ArtworkVariantKey;
  category: string;
  watchPercent?: number;
}

export interface UserProfileState {
  userId: string;
  username: string;
  handle?: string;
  email: string;
  bio: string;
  countryCode: string;
  city?: string;
  maritalStatus: string;
  favoriteGenres: string[];
  xp: number;
  coins: number;
  watchHours: number;
  watchedCount?: number;
  favoritesCount?: number;
  avatarUrl?: string;
  coverUrl?: string;
  onlineStatus?: 'online' | 'watching' | 'busy';
  equippedBorderId: string;
  equippedThemeId: ColorSchemeId;
  ownedProductIds: string[];
}

export type NotificationType = 'epg_reminder' | 'cinema_invite' | 'chat_message' | 'friend_request';

export interface AppNotification {
  notificationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  targetId: string;
  read: boolean;
  createdAtLabel: string;
}

export interface WeeklyTop10State {
  weekKey: string;
  weekNumber: number;
  year: number;
  updatedAtIso: string;
  nextRefreshIso: string;
  daysUntilRefresh: number;
  source: 'tmdb_weekly_api' | 'hybrid_catalog';
  items: VodItem[];
}

