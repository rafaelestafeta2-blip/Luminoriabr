import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  AppNotification,
  Channel,
  CinemaRoomState,
  ColorSchemeId,
  ColorSchemePreset,
  FriendContact,
  NavSectionId,
  PlaylistSource,
  RankEntry,
  ShopProduct,
  UserProfileState,
  VodItem,
  VodReview,
} from '../types/luminoria';
import { TmdbMovieItem, TmdbSyncMetadata } from '../types/tmdb';
import { fetchMoviesWithSmartCache } from '../services/tmdbService';
import { mergeTmdbIntoVodCatalog } from '../services/tmdbMapper';
import { INITIAL_TMDB_SEED_MOVIES } from '../data/tmdbSeed';
import { parseUnifiedM3U } from '../services/m3uParserAdvanced';
import {
  loadCatalogFromIdb,
  loadPersistedPlaylists,
  OFFICIAL_ELITEDNS_PLAYLIST,
  saveCatalogToIdb,
  savePersistedPlaylists,
} from '../services/playlistStorageDb';
import { fetchOfficialEliteDnsCatalog } from '../services/tmdbEnrichClient';
import {
  COLOR_SCHEME_PRESETS,
  INITIAL_CHANNELS,
  INITIAL_CINEMA_ROOM,
  INITIAL_FRIENDS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PLAYLISTS,
  INITIAL_RANK_ENTRIES,
  INITIAL_SHOP_PRODUCTS,
  INITIAL_USER_PROFILE,
  INITIAL_VOD_ITEMS,
  INITIAL_VOD_REVIEWS,
} from '../data/seedData';
import {
  getRankForXp,
  parseM3U,
  processShopPurchase,
  sanitizeProfileForBlueprint,
  validateCinemaCode,
} from '../utils/luminoriaLogic';
import {
  buildCinemaFriendJoinNotification,
  buildEpgReminderNotification,
} from '../utils/notificationLogic';
import {
  auth,
  signInWithGooglePopup,
  signOutFirebaseUser,
} from '../services/firebaseClient';
import {
  ensureUserAndRankingInFirestore,
  subscribeToGlobalRankings,
  subscribeToUserProfile,
  syncProfileAndRankingToFirestore,
} from '../services/firestoreSyncService';
import {
  createFirestoreNotification,
  deleteFirestoreNotification,
  markFirestoreNotificationRead,
  subscribeToUserNotifications,
} from '../services/notificationFirestoreService';

interface LuminoriaContextValue {
  activeNav: NavSectionId;
  setActiveNav: (nav: NavSectionId) => void;
  activeScheme: ColorSchemePreset;
  setSchemeById: (id: ColorSchemeId) => void;
  channels: Channel[];
  playlists: PlaylistSource[];
  vodItems: VodItem[];
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
  profile: UserProfileState;
  updateProfileInfo: (partial: Partial<UserProfileState>) => void;
  awardWatchSession: (xpEarned: number, coinsEarned: number) => void;
  shopProducts: ShopProduct[];
  purchaseProduct: (productId: string, deliveryAddress?: string) => { ok: boolean; message: string };
  equipItem: (productId: string) => void;
  rankEntries: RankEntry[];
  friends: FriendContact[];
  sendFriendMessage: (friendId: string, text: string) => void;
  addFriendByUsername: (username: string) => { ok: boolean; message: string };
  toggleFriendFavorite: (friendId: string) => void;
  cinemaRoom: CinemaRoomState;
  joinOrCreateCinemaRoom: (code: string, vodId?: string) => { ok: boolean; message: string };
  toggleCinemaPlay: () => void;
  seekCinemaTime: (sec: number) => void;
  sendCinemaChatMessage: (text: string) => void;
  importM3UPlaylist: (
    name: string,
    m3uContent: string
  ) => {
    ok: boolean;
    count: number;
    message: string;
    stats?: {
      liveChannelsCount: number;
      moviesCount: number;
      seriesCount: number;
    };
  };
  importXtreamData: (
    playlistName: string,
    host: string,
    username: string,
    channels: Channel[],
    movies: VodItem[],
    series?: VodItem[],
    stats?: {
      totalStreamsFound?: number;
      totalChannelsFound?: number;
      totalMoviesFound?: number;
      totalSeriesFound?: number;
    }
  ) => { ok: boolean; count: number; message: string };
  addXtreamPlaylist: (name: string, host: string, username: string) => { ok: boolean; message: string };
  removePlaylist: (id: string) => void;
  serverCatalogStats: {
    totalStreams: number;
    totalChannels: number;
    totalMovies: number;
    totalSeries: number;
    isSyncingCatalog: boolean;
  };
  syncFullEliteDnsPlaylist: () => Promise<{ ok: boolean; message: string }>;
  activeModalVod: VodItem | null;
  setActiveModalVod: (vod: VodItem | null) => void;
  vodReviews: Record<string, VodReview[]>;
  addVodReview: (vodId: string, rating: number, comment: string) => void;
  isFriendsDrawerOpen: boolean;
  setIsFriendsDrawerOpen: (open: boolean) => void;
  isRankDrawerOpen: boolean;
  setIsRankDrawerOpen: (open: boolean) => void;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  isNotificationsDrawerOpen: boolean;
  setIsNotificationsDrawerOpen: (open: boolean) => void;
  activeToastNotification: AppNotification | null;
  dismissToastNotification: () => void;
  triggerEpgFavoriteAlert: (
    channelId: string,
    channelName: string,
    programTitle: string,
    startTime: string
  ) => void;
  triggerCinemaFriendJoinedAlert: (friendName: string, roomCode?: string) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (notificationId: string) => void;
  authUser: User | null;
  isAuthReady: boolean;
  isCloudSynced: boolean;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  logoutFirebase: () => Promise<void>;
  tmdbMovies: TmdbMovieItem[];
  tmdbSyncMeta: TmdbSyncMetadata | null;
  isSyncingTmdb: boolean;
  isTmdbSyncModalOpen: boolean;
  setIsTmdbSyncModalOpen: (open: boolean) => void;
  selectedTmdbMovie: TmdbMovieItem | null;
  openTmdbMovieDetail: (movie: TmdbMovieItem) => void;
  closeTmdbMovieDetail: () => void;
  syncTmdbCatalog: (
    category?: 'trending' | 'popular' | 'top_rated' | 'now_playing',
    customKey?: string
  ) => Promise<{ ok: boolean; message: string }>;
  showIntro: boolean;
  setShowIntro: (show: boolean) => void;
}

const LuminoriaContext = createContext<LuminoriaContextValue | null>(null);

export const LuminoriaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeNav, setActiveNav] = useState<NavSectionId>('home');
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [playlists, setPlaylists] = useState<PlaylistSource[]>(() => loadPersistedPlaylists());
  const [vodItems, setVodItems] = useState<VodItem[]>(() =>
    mergeTmdbIntoVodCatalog(INITIAL_VOD_ITEMS, INITIAL_TMDB_SEED_MOVIES)
  );
  const [serverCatalogStats, setServerCatalogStats] = useState({
    totalStreams: 302408,
    totalChannels: 3584,
    totalMovies: 28100,
    totalSeries: 9513,
    isSyncingCatalog: false,
  });
  const [favoriteIds, setFavoriteIds] = useState<string[]>(['ch-1', 'vod-1', 'vod-2']);
  const [profile, setProfile] = useState<UserProfileState>(INITIAL_USER_PROFILE);
  const [shopProducts] = useState<ShopProduct[]>(INITIAL_SHOP_PRODUCTS);
  const [rankEntries, setRankEntries] = useState<RankEntry[]>(INITIAL_RANK_ENTRIES);
  const [friends, setFriends] = useState<FriendContact[]>(INITIAL_FRIENDS);
  const [cinemaRoom, setCinemaRoom] = useState<CinemaRoomState>(INITIAL_CINEMA_ROOM);
  const [activeModalVod, setActiveModalVod] = useState<VodItem | null>(null);
  const [vodReviews, setVodReviews] = useState<Record<string, VodReview[]>>(INITIAL_VOD_REVIEWS);
  const [isFriendsDrawerOpen, setIsFriendsDrawerOpen] = useState(false);
  const [isRankDrawerOpen, setIsRankDrawerOpen] = useState(false);

  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] = useState(false);
  const [activeToastNotification, setActiveToastNotification] = useState<AppNotification | null>(
    null
  );

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [tmdbMovies, setTmdbMovies] = useState<TmdbMovieItem[]>(INITIAL_TMDB_SEED_MOVIES);
  const [tmdbSyncMeta, setTmdbSyncMeta] = useState<TmdbSyncMetadata | null>(null);
  const [isSyncingTmdb, setIsSyncingTmdb] = useState(false);
  const [isTmdbSyncModalOpen, setIsTmdbSyncModalOpen] = useState(false);
  const [selectedTmdbMovie, setSelectedTmdbMovie] = useState<TmdbMovieItem | null>(null);
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('autostart') === '1') return false;
      return sessionStorage.getItem('luminoria_intro_played') !== '1';
    }
    return true;
  });

  useEffect(() => {
    savePersistedPlaylists(playlists);
  }, [playlists]);

  const syncFullEliteDnsPlaylist = async () => {
    setServerCatalogStats((prev) => ({ ...prev, isSyncingCatalog: true }));
    try {
      const data = await fetchOfficialEliteDnsCatalog();
      if (!data || !data.ok) {
        return { ok: false, message: 'Não foi possível sincronizar o catálogo completo no momento.' };
      }

      const nextChannels = [...data.channels, ...INITIAL_CHANNELS];
      const nextVod = [
        ...data.movies,
        ...data.series,
        ...mergeTmdbIntoVodCatalog(INITIAL_VOD_ITEMS, INITIAL_TMDB_SEED_MOVIES),
      ];

      setChannels(nextChannels);
      setVodItems(nextVod);

      const totalStreams = data.stats.totalStreamsFound || 302408;
      const totalChannels = data.stats.totalChannelsFound || data.channels.length;
      const totalMovies = data.stats.totalMoviesFound || data.movies.length;
      const totalSeries = data.stats.totalSeriesFound || data.series.length;

      setServerCatalogStats({
        totalStreams,
        totalChannels,
        totalMovies,
        totalSeries,
        isSyncingCatalog: false,
      });

      setPlaylists((prev) => {
        const updatedOfficial: PlaylistSource = {
          ...OFFICIAL_ELITEDNS_PLAYLIST,
          channelCount: totalStreams,
          totalServerItems: totalStreams,
          liveCount: totalChannels,
          moviesCount: totalMovies,
          seriesCount: totalSeries,
          updatedAt: 'Sincronizado agora',
          isActive: true,
        };
        const others = prev.filter((p) => p.id !== OFFICIAL_ELITEDNS_PLAYLIST.id);
        const nextList = [updatedOfficial, ...others];
        savePersistedPlaylists(nextList);
        return nextList;
      });

      await saveCatalogToIdb({ channels: nextChannels, vodItems: nextVod });
      return {
        ok: true,
        message: `Catálogo EliteDNS sincronizado: ${totalChannels.toLocaleString('pt-BR')} canais ao vivo, ${totalMovies.toLocaleString('pt-BR')} filmes e ${totalSeries.toLocaleString('pt-BR')} séries (${totalStreams.toLocaleString('pt-BR')} transmissões totais) com capas TMDB!`,
      };
    } finally {
      setServerCatalogStats((prev) => ({ ...prev, isSyncingCatalog: false }));
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Load cached catalog from IndexedDB immediately (0ms offline persistence)
    loadCatalogFromIdb()
      .then((cached) => {
        if (!mounted || !cached) return;
        if (cached.channels.length > 0) setChannels(cached.channels);
        if (cached.vodItems.length > 0) setVodItems(cached.vodItems);
      })
      .catch(() => {});

    // 2. Sync official EliteDNS 302k catalog in background so new releases are always present
    syncFullEliteDnsPlaylist().catch(() => {});

    // 3. Also load TMDB smart cache
    fetchMoviesWithSmartCache('popular', false)
      .then((res) => {
        if (!mounted) return;
        if (res.movies.length > 0) {
          setTmdbMovies(res.movies);
          setVodItems((prev) => mergeTmdbIntoVodCatalog(prev, res.movies));
        }
        if (res.metadata) {
          setTmdbSyncMeta(res.metadata);
        }
      })
      .catch((err) => console.warn('Smart TMDB initial load:', err));
    return () => {
      mounted = false;
    };
  }, []);

  const openTmdbMovieDetail = (movie: TmdbMovieItem) => {
    setSelectedTmdbMovie(movie);
  };

  const closeTmdbMovieDetail = () => {
    setSelectedTmdbMovie(null);
  };

  const syncTmdbCatalog = async (
    category: 'trending' | 'popular' | 'top_rated' | 'now_playing' = 'popular',
    customKey?: string
  ) => {
    setIsSyncingTmdb(true);
    try {
      const res = await fetchMoviesWithSmartCache(category, true, customKey);
      if (res.movies.length > 0) {
        setTmdbMovies(res.movies);
        setVodItems((prev) => mergeTmdbIntoVodCatalog(prev, res.movies));
      }
      if (res.metadata) {
        setTmdbSyncMeta(res.metadata);
      }
      return { ok: true, message: res.message };
    } catch (error: any) {
      return { ok: false, message: error?.message || 'Falha ao sincronizar com TMDB.' };
    } finally {
      setIsSyncingTmdb(false);
    }
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setIsAuthReady(true);
      if (!user) {
        setIsCloudSynced(false);
        return;
      }

      try {
        await ensureUserAndRankingInFirestore(user.uid, {
          ...profile,
          userId: user.uid,
          username: user.displayName || profile.username,
          email: user.email || profile.email,
        });
        setIsCloudSynced(true);
      } catch (err) {
        console.error('Failed to initialize Firestore user/ranking:', err);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !authUser) return;

    const unsubProfile = subscribeToUserProfile(authUser.uid, (remoteProfile) => {
      setProfile((prev) => ({
        ...prev,
        ...remoteProfile,
        email: authUser.email || prev.email,
      }));
      setIsCloudSynced(true);
    });

    const unsubRankings = subscribeToGlobalRankings((remoteEntries) => {
      const mergedMap = new Map<string, Omit<RankEntry, 'rank'>>();
      for (const seed of INITIAL_RANK_ENTRIES) {
        if (seed.userId !== 'u-me') {
          mergedMap.set(seed.userId, seed);
        }
      }
      for (const rem of remoteEntries) {
        mergedMap.set(rem.userId, rem);
      }
      const combined = Array.from(mergedMap.values())
        .sort((a, b) => b.watchHours - a.watchHours || b.xp - a.xp)
        .map((item, idx) => ({ ...item, rank: idx + 1 }));
      setRankEntries(combined);
    });

    const unsubNotifs = subscribeToUserNotifications(authUser.uid, (remoteNotifs) => {
      if (remoteNotifs.length > 0) {
        setNotifications(remoteNotifs);
      }
    });

    return () => {
      unsubProfile();
      unsubRankings();
      unsubNotifs();
    };
  }, [isAuthReady, authUser]);

  const activeScheme =
    COLOR_SCHEME_PRESETS.find((s) => s.id === profile.equippedThemeId) || COLOR_SCHEME_PRESETS[0];

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const pushNotification = (built: {
    notificationId: string;
    userId: string;
    type: 'epg_reminder' | 'cinema_invite';
    title: string;
    message: string;
    targetId: string;
    read: boolean;
  }) => {
    const timeLabel = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newItem: AppNotification = {
      ...built,
      createdAtLabel: timeLabel,
    };

    setNotifications((prev) => [
      newItem,
      ...prev.filter((item) => item.notificationId !== newItem.notificationId),
    ]);
    setActiveToastNotification(newItem);

    if (authUser) {
      createFirestoreNotification(authUser.uid, newItem).catch((err) =>
        console.error('Firestore notification create error:', err)
      );
    }
  };

  const triggerEpgFavoriteAlert = (
    channelId: string,
    channelName: string,
    programTitle: string,
    startTime: string
  ) => {
    const selfId = authUser ? authUser.uid : profile.userId;
    const built = buildEpgReminderNotification({
      userId: selfId,
      channelId,
      channelName,
      programTitle,
      startTime,
    });
    pushNotification(built);
  };

  const triggerCinemaFriendJoinedAlert = (friendName: string, roomCode?: string) => {
    const selfId = authUser ? authUser.uid : profile.userId;
    const code = roomCode || cinemaRoom.code;
    const currentMovie = vodItems.find((v) => v.id === cinemaRoom.vodId)?.title;
    const built = buildCinemaFriendJoinNotification({
      userId: selfId,
      friendName,
      roomCode: code,
      movieTitle: currentMovie,
    });
    pushNotification(built);

    setCinemaRoom((prev) => {
      const exists = prev.participants.some(
        (p) => p.name.toLowerCase() === friendName.toLowerCase()
      );
      if (exists) return prev;
      return {
        ...prev,
        participants: [
          ...prev.participants,
          { id: `u-fr-${Date.now()}`, name: friendName, rank: 'MARATONEIRO', isHost: false },
        ],
      };
    });
  };

  const markNotificationRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === notificationId ? { ...n, read: true } : n))
    );
    if (authUser) {
      markFirestoreNotificationRead(authUser.uid, notificationId, true).catch((err) =>
        console.error('Firestore notification read error:', err)
      );
    }
  };

  const markAllNotificationsRead = () => {
    const unread = notifications.filter((n) => !n.read);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (authUser) {
      for (const item of unread) {
        markFirestoreNotificationRead(authUser.uid, item.notificationId, true).catch((err) =>
          console.error('Firestore notification read error:', err)
        );
      }
    }
  };

  const removeNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.notificationId !== notificationId));
    if (activeToastNotification?.notificationId === notificationId) {
      setActiveToastNotification(null);
    }
    if (authUser) {
      deleteFirestoreNotification(authUser.uid, notificationId).catch((err) =>
        console.error('Firestore notification delete error:', err)
      );
    }
  };

  const dismissToastNotification = () => setActiveToastNotification(null);

  const persistProfileChange = (next: UserProfileState, actionType: 'details' | 'progression') => {
    const sanitized = sanitizeProfileForBlueprint(next);
    const updatedState: UserProfileState = {
      ...next,
      ...sanitized,
    };
    setProfile(updatedState);

    setRankEntries((entries) => {
      const selfId = authUser ? authUser.uid : 'u-me';
      return entries
        .map((e) =>
          e.userId === selfId || e.userId === 'u-me'
            ? {
                ...e,
                userId: selfId,
                username: updatedState.username,
                countryCode: updatedState.countryCode,
                xp: updatedState.xp,
                watchHours: updatedState.watchHours,
                equippedBorderId: updatedState.equippedBorderId,
              }
            : e
        )
        .sort((a, b) => b.watchHours - a.watchHours || b.xp - a.xp)
        .map((e, idx) => ({ ...e, rank: idx + 1 }));
    });

    if (authUser) {
      syncProfileAndRankingToFirestore(authUser.uid, updatedState, actionType).catch((err) =>
        console.error('Firestore sync error:', err)
      );
    }
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithGooglePopup();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Falha ao autenticar com Google.');
    }
  };

  const logoutFirebase = async () => {
    setAuthError(null);
    await signOutFirebaseUser();
  };

  const setSchemeById = (id: ColorSchemeId) => {
    persistProfileChange({ ...profile, equippedThemeId: id }, 'details');
  };

  const toggleFavorite = (id: string) => {
    const isAdding = !favoriteIds.includes(id);
    setFavoriteIds((prev) => (isAdding ? [...prev, id] : prev.filter((item) => item !== id)));

    if (isAdding) {
      const favChannel = channels.find((ch) => ch.id === id);
      const nextProg = favChannel?.currentPrograms[1] || favChannel?.currentPrograms[0];
      if (favChannel && nextProg) {
        triggerEpgFavoriteAlert(
          favChannel.id,
          favChannel.name,
          nextProg.title,
          nextProg.startTime
        );
      }
    }
  };

  const updateProfileInfo = (partial: Partial<UserProfileState>) => {
    persistProfileChange({ ...profile, ...partial }, 'details');
  };

  const awardWatchSession = (xpEarned: number, coinsEarned: number) => {
    const nextXp = profile.xp + xpEarned;
    const nextCoins = profile.coins + coinsEarned;
    const nextHours = Number((profile.watchHours + 0.5).toFixed(1));
    persistProfileChange(
      { ...profile, xp: nextXp, coins: nextCoins, watchHours: nextHours },
      'progression'
    );
  };

  const purchaseProduct = (productId: string, _deliveryAddress?: string) => {
    const product = shopProducts.find((p) => p.id === productId);
    if (!product) return { ok: false, message: 'Produto não encontrado.' };
    if (profile.ownedProductIds.includes(productId) && !product.requiresDelivery) {
      return { ok: false, message: 'Você já possui este item no inventário.' };
    }
    const tx = processShopPurchase(profile.coins, product.priceCoins, 1);
    if (!tx.ok) return { ok: false, message: tx.error || 'Saldo insuficiente.' };

    const nextOwned = profile.ownedProductIds.includes(productId)
      ? profile.ownedProductIds
      : [...profile.ownedProductIds, productId].slice(0, 10);

    persistProfileChange(
      { ...profile, coins: tx.remainingCoins, ownedProductIds: nextOwned },
      'progression'
    );
    return { ok: true, message: `Compra concluída: ${product.name}!` };
  };

  const equipItem = (productId: string) => {
    const product = shopProducts.find((p) => p.id === productId);
    if (!product) return;
    if (product.category === 'borders') {
      persistProfileChange({ ...profile, equippedBorderId: productId }, 'details');
    } else if (product.id === 'prod-theme-sunset') {
      setSchemeById('sunset');
    } else if (product.id === 'prod-theme-ocean') {
      setSchemeById('ocean');
    }
  };

  const sendFriendMessage = (friendId: string, text: string) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setFriends((prev) =>
      prev.map((f) =>
        f.id === friendId
          ? {
              ...f,
              messages: [...f.messages, { id: `m-${Date.now()}`, fromMe: true, text: text.trim(), time: now }],
            }
          : f
      )
    );
  };

  const addFriendByUsername = (username: string) => {
    const clean = username.trim();
    if (clean.length < 3) return { ok: false, message: 'Digite um nome de utilizador válido.' };
    if (friends.some((f) => f.username.toLowerCase() === clean.toLowerCase())) {
      return { ok: false, message: 'Este utilizador já está na sua lista de amigos.' };
    }
    setFriends((prev) => [
      ...prev,
      {
        id: `fr-${Date.now()}`,
        username: clean,
        status: 'online',
        lastSeenLabel: 'Online agora',
        isFavorite: false,
        avatarColor: '#0EA5E9',
        activity: 'Acabou de aceitar seu convite',
        countryCode: 'BR',
        xp: 1200,
        messages: [{ id: `m-${Date.now()}`, fromMe: false, text: 'Olá! Vamos assistir algo na Sala de Cinema?', time: 'Agora' }],
      },
    ]);
    return { ok: true, message: `${clean} foi adicionado aos seus amigos!` };
  };

  const toggleFriendFavorite = (friendId: string) => {
    setFriends((prev) =>
      prev.map((f) => (f.id === friendId ? { ...f, isFavorite: !f.isFavorite } : f))
    );
  };

  const joinOrCreateCinemaRoom = (rawCode: string, vodId?: string) => {
    const check = validateCinemaCode(rawCode);
    if (!check.valid) return { ok: false, message: check.error || 'Código inválido.' };
    setCinemaRoom((prev) => ({
      ...prev,
      code: check.normalized,
      vodId: vodId || prev.vodId,
      currentTimeSec: 0,
      isPlaying: true,
    }));
    setActiveNav('cinema');
    return { ok: true, message: `Conectado à Sala #${check.normalized}` };
  };

  const toggleCinemaPlay = () => {
    setCinemaRoom((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const seekCinemaTime = (sec: number) => {
    setCinemaRoom((prev) => ({ ...prev, currentTimeSec: Math.max(0, Math.min(prev.durationSec, sec)) }));
  };

  const sendCinemaChatMessage = (text: string) => {
    if (!text.trim()) return;
    const rank = getRankForXp(profile.xp).name;
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setCinemaRoom((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { id: `cm-${Date.now()}`, senderName: profile.username, senderRank: rank, text: text.trim(), timestamp },
      ],
    }));
  };

  const importM3UPlaylist = (name: string, m3uContent: string) => {
    const parsed = parseUnifiedM3U(m3uContent, name);
    const totalItems =
      parsed.channels.length + parsed.movies.length + parsed.series.length;

    if (totalItems === 0) {
      return {
        ok: false,
        count: 0,
        message: 'Nenhum item válido encontrado no conteúdo M3U.',
      };
    }

    const newPlaylistId = `pl-${Date.now()}`;
    const newPl: PlaylistSource = {
      id: newPlaylistId,
      name: name.trim() || 'Lista M3U Importada',
      type: 'm3u',
      urlOrHost: 'Importação Direta M3U',
      channelCount: totalItems,
      totalServerItems: totalItems,
      liveCount: parsed.stats.liveChannelsCount,
      moviesCount: parsed.stats.moviesCount,
      seriesCount: parsed.stats.seriesCount,
      epgUrl: parsed.epgUrl || undefined,
      updatedAt: 'Importado e salvo permanentemente',
      isActive: true,
    };

    setPlaylists((prev) => {
      const next = [newPl, ...prev];
      savePersistedPlaylists(next);
      return next;
    });

    const nextChannels = parsed.channels.length > 0 ? [...parsed.channels, ...channels] : channels;
    const nextVod =
      parsed.movies.length > 0 || parsed.series.length > 0
        ? [...parsed.movies, ...parsed.series, ...vodItems]
        : vodItems;

    setChannels(nextChannels);
    setVodItems(nextVod);
    saveCatalogToIdb({ channels: nextChannels, vodItems: nextVod }).catch(() => {});

    const message = `Lista importada e salva permanentemente: ${parsed.stats.liveChannelsCount.toLocaleString('pt-BR')} canais de TV ao vivo, ${parsed.stats.moviesCount.toLocaleString('pt-BR')} filmes VOD e ${parsed.stats.seriesCount.toLocaleString('pt-BR')} séries distribuídos automaticamente!`;

    return {
      ok: true,
      count: totalItems,
      message,
      stats: {
        liveChannelsCount: parsed.stats.liveChannelsCount,
        moviesCount: parsed.stats.moviesCount,
        seriesCount: parsed.stats.seriesCount,
      },
    };
  };

  const importXtreamData = (
    playlistName: string,
    host: string,
    username: string,
    newChannels: Channel[],
    newMovies: VodItem[],
    newSeries: VodItem[] = [],
    stats?: {
      totalStreamsFound?: number;
      totalChannelsFound?: number;
      totalMoviesFound?: number;
      totalSeriesFound?: number;
    }
  ) => {
    const totalLoaded = newChannels.length + newMovies.length + newSeries.length;
    const totalServer = stats?.totalStreamsFound || totalLoaded;
    const liveTotal = stats?.totalChannelsFound || newChannels.length;
    const moviesTotal = stats?.totalMoviesFound || newMovies.length;
    const seriesTotal = stats?.totalSeriesFound || newSeries.length;

    const newPl: PlaylistSource = {
      id: username === 'Rafalaila' ? OFFICIAL_ELITEDNS_PLAYLIST.id : `pl-xt-${Date.now()}`,
      name: playlistName.trim() || `Xtream (${username})`,
      type: 'xtream',
      urlOrHost: host,
      username,
      channelCount: totalServer,
      totalServerItems: totalServer,
      liveCount: liveTotal,
      moviesCount: moviesTotal,
      seriesCount: seriesTotal,
      epgUrl: `${host.replace(/\/$/, '')}/xmltv.php`,
      updatedAt: 'Sincronizado e salvo permanentemente',
      isActive: true,
    };

    setPlaylists((prev) => {
      const filtered = prev.filter((p) => p.id !== newPl.id);
      const next = [newPl, ...filtered];
      savePersistedPlaylists(next);
      return next;
    });

    const nextChannels = newChannels.length > 0 ? [...newChannels, ...channels] : channels;
    const nextVod =
      newMovies.length > 0 || newSeries.length > 0
        ? [...newMovies, ...newSeries, ...vodItems]
        : vodItems;

    setChannels(nextChannels);
    setVodItems(nextVod);
    setServerCatalogStats({
      totalStreams: totalServer,
      totalChannels: liveTotal,
      totalMovies: moviesTotal,
      totalSeries: seriesTotal,
      isSyncingCatalog: false,
    });
    saveCatalogToIdb({ channels: nextChannels, vodItems: nextVod }).catch(() => {});

    return {
      ok: true,
      count: totalServer,
      message: `Lista oficial sincronizada e salva: ${liveTotal.toLocaleString('pt-BR')} canais ao vivo, ${moviesTotal.toLocaleString('pt-BR')} filmes e ${seriesTotal.toLocaleString('pt-BR')} séries (${totalServer.toLocaleString('pt-BR')} itens totais no catálogo) com capas TMDB!`,
    };
  };

  const addXtreamPlaylist = (name: string, host: string, username: string) => {
    if (!name.trim() || !host.trim() || !username.trim()) {
      return { ok: false, message: 'Preencha todos os campos do servidor Xtream Codes.' };
    }
    const newPl: PlaylistSource = {
      id: `pl-xt-${Date.now()}`,
      name: name.trim(),
      type: 'xtream',
      urlOrHost: host.trim(),
      username: username.trim(),
      channelCount: 302408,
      epgUrl: `${host.trim().replace(/\/$/, '')}/xmltv.php`,
      updatedAt: 'Sincronizado agora',
      isActive: true,
    };
    setPlaylists((prev) => {
      const next = [newPl, ...prev];
      savePersistedPlaylists(next);
      return next;
    });
    return { ok: true, message: `Servidor Xtream "${name}" conectado e salvo!` };
  };

  const removePlaylist = (id: string) => {
    setPlaylists((prev) => {
      const next = prev.filter((p) => p.id !== id);
      savePersistedPlaylists(next);
      return next;
    });
  };

  const addVodReview = (vodId: string, rating: number, comment: string) => {
    if (!comment.trim()) return;
    setVodReviews((prev) => ({
      ...prev,
      [vodId]: [
        { id: `rev-${Date.now()}`, author: profile.username, rating, comment: comment.trim(), createdAt: 'Agora mesmo' },
        ...(prev[vodId] || []),
      ],
    }));
    awardWatchSession(50, 10);
  };

  return (
    <LuminoriaContext.Provider
      value={{
        activeNav,
        setActiveNav,
        activeScheme,
        setSchemeById,
        channels,
        playlists,
        vodItems,
        favoriteIds,
        toggleFavorite,
        profile,
        updateProfileInfo,
        awardWatchSession,
        shopProducts,
        purchaseProduct,
        equipItem,
        rankEntries,
        friends,
        sendFriendMessage,
        addFriendByUsername,
        toggleFriendFavorite,
        cinemaRoom,
        joinOrCreateCinemaRoom,
        toggleCinemaPlay,
        seekCinemaTime,
        sendCinemaChatMessage,
        importM3UPlaylist,
        importXtreamData,
        addXtreamPlaylist,
        removePlaylist,
        serverCatalogStats,
        syncFullEliteDnsPlaylist,
        activeModalVod,
        setActiveModalVod,
        vodReviews,
        addVodReview,
        isFriendsDrawerOpen,
        setIsFriendsDrawerOpen,
        isRankDrawerOpen,
        setIsRankDrawerOpen,
        notifications,
        unreadNotificationCount,
        isNotificationsDrawerOpen,
        setIsNotificationsDrawerOpen,
        activeToastNotification,
        dismissToastNotification,
        triggerEpgFavoriteAlert,
        triggerCinemaFriendJoinedAlert,
        markNotificationRead,
        markAllNotificationsRead,
        removeNotification,
        authUser,
        isAuthReady,
        isCloudSynced,
        authError,
        loginWithGoogle,
        logoutFirebase,
        tmdbMovies,
        tmdbSyncMeta,
        isSyncingTmdb,
        isTmdbSyncModalOpen,
        setIsTmdbSyncModalOpen,
        selectedTmdbMovie,
        openTmdbMovieDetail,
        closeTmdbMovieDetail,
        syncTmdbCatalog,
        showIntro,
        setShowIntro,
      }}
    >
      {children}
    </LuminoriaContext.Provider>
  );
};

export function useLuminoria() {
  const ctx = useContext(LuminoriaContext);
  if (!ctx) throw new Error('useLuminoria must be used inside LuminoriaProvider');
  return ctx;
}
