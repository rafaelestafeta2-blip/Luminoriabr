import {
  DirectChatMessage,
  FriendContact,
  FriendRequestItem,
  UserProfileState,
} from '../types/luminoria';
import { loadStoredAccounts, normalizeInstagramHandle } from './authService';
import { STUDIO_AVATAR_PRESETS } from '../utils/avatarUploadHelper';

const LEGACY_FAKE_KEYS = ['luminoria_friends_vault_v1', 'luminoria_friends_vault_v2'];
const REAL_FRIENDS_PREFIX = 'luminoria_real_friends_v3_';
const FRIEND_REQUESTS_KEY = 'luminoria_friend_requests_v3';

const LEGACY_FAKE_IDS = new Set([
  'fr-1',
  'fr-2',
  'fr-3',
  'fr-4',
  'fr-5',
  'fr-6',
  'fr-7',
  'fr-8',
  'fr-9',
  'fr-10',
  'fr-11',
  'fr-12',
]);

export function purgeLegacyFakeFriendsStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const key of LEGACY_FAKE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {}
}

export function loadPersistedFriends(userId: string = 'default'): FriendContact[] {
  if (typeof window === 'undefined') return [];
  purgeLegacyFakeFriendsStorage();
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${REAL_FRIENDS_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((f: FriendContact) => f && f.id && !LEGACY_FAKE_IDS.has(f.id));
    }
  } catch {}
  return [];
}

export function savePersistedFriends(friends: FriendContact[], userId: string = 'default'): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const clean = friends
      .filter((f) => f && f.id && !LEGACY_FAKE_IDS.has(f.id))
      .map((f) => ({ ...f, isTyping: false }));
    localStorage.setItem(`${REAL_FRIENDS_PREFIX}${userId}`, JSON.stringify(clean));
  } catch {}
}

export function loadFriendRequests(): FriendRequestItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FRIEND_REQUESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFriendRequests(requests: FriendRequestItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(requests));
  } catch {}
}

export interface DirectoryUserMatch {
  userId: string;
  handle: string;
  username: string;
  avatarUrl?: string;
  countryCode: string;
  bio: string;
  xp: number;
}

export function searchDirectoryByHandle(
  queryText: string,
  currentUserId: string
): DirectoryUserMatch[] {
  const q = queryText.trim().toLowerCase().replace(/^@+/, '');
  const accounts = loadStoredAccounts();
  return accounts
    .filter((acc) => acc.userId !== currentUserId)
    .filter((acc) => {
      if (!q) return true;
      const h = (acc.handle || '').toLowerCase().replace(/^@+/, '');
      const u = (acc.profile?.username || '').toLowerCase();
      return h.includes(q) || u.includes(q);
    })
    .map((acc) => ({
      userId: acc.userId,
      handle: normalizeInstagramHandle(acc.handle || acc.profile.username),
      username: acc.profile.username,
      avatarUrl: acc.profile.avatarUrl,
      countryCode: acc.profile.countryCode || 'BR',
      bio: acc.profile.bio || 'Cinéfilo Luminoria',
      xp: acc.profile.xp || 0,
    }));
}

export function formatNowTime(): string {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function createFriendContactFromProfile(target: {
  userId: string;
  username: string;
  handle?: string;
  avatarUrl?: string;
  countryCode?: string;
  bio?: string;
  xp?: number;
}): FriendContact {
  const cleanHandle = normalizeInstagramHandle(target.handle || target.username);
  const preset =
    target.avatarUrl ||
    STUDIO_AVATAR_PRESETS[target.username.length % STUDIO_AVATAR_PRESETS.length]?.url;
  const now = formatNowTime();
  const initialMsg: DirectChatMessage = {
    id: `m-init-${Date.now()}`,
    fromMe: false,
    text: `Solicitação de amizade aceita! Agora estamos conectados (${cleanHandle}).`,
    time: now,
    status: 'read',
  };

  return {
    id: target.userId || `usr-${Date.now()}`,
    username: target.username,
    handle: cleanHandle,
    status: 'online',
    lastSeenLabel: 'Online agora',
    isFavorite: false,
    isBlocked: false,
    unreadCount: 0,
    avatarColor: '#0EA5E9',
    avatarUrl: preset,
    activity: 'Conectado na rede Luminoria',
    bio: target.bio || 'Membro verificado Luminoria 4K',
    countryCode: target.countryCode || 'BR',
    xp: target.xp || 0,
    messages: [initialMsg],
  };
}

export function createNewFriendContact(cleanUsername: string): FriendContact {
  const cleanHandle = normalizeInstagramHandle(cleanUsername);
  return createFriendContactFromProfile({
    userId: `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    username: cleanUsername.replace(/^@/, ''),
    handle: cleanHandle,
  });
}

export function generateContextualReply(
  _friendName: string,
  userMessage: string,
  movieTitle?: string
): string {
  const lower = userMessage.toLowerCase();
  if (movieTitle) {
    return `Que massa você estar assistindo "${movieTitle}"! Já coloquei na minha lista também!`;
  }
  if (lower.includes('sala') || lower.includes('cinema') || lower.includes('assistir') || lower.includes('codigo') || lower.includes('código')) {
    return `Bora assistir juntos na Sala de Cinema! Me passa o código da sala de 6 dígitos que eu entro agora!`;
  }
  if (lower.includes('oi') || lower.includes('olá') || lower.includes('fala')) {
    return `Fala cinéfilo! Curtindo o catálogo do Luminoria em 4K hoje?`;
  }
  if (lower.includes('filme') || lower.includes('bom') || lower.includes('top')) {
    return `Muito top! Esse título tem uma fotografia absurda em HDR. Recomendo demais!`;
  }
  return `Concordo totalmente contigo! O catálogo 4K tá sensacional hoje.`;
}
