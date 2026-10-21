import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, signInWithGooglePopup, signOutFirebaseUser } from './firebaseClient';
import { UserProfileState } from '../types/luminoria';
import { INITIAL_USER_PROFILE } from '../data/seedData';

const ACCOUNTS_STORAGE_KEY = 'luminoria_accounts_vault_v1';
const ACTIVE_SESSION_KEY = 'luminoria_active_session_v1';
const PROFILE_META_PREFIX = 'luminoria_profile_meta_v2_';

export interface StoredAccountRecord {
  userId: string;
  handle: string;
  email: string;
  passwordHash: string;
  profile: UserProfileState;
  createdAtIso: string;
}

export function normalizeInstagramHandle(raw: string): string {
  const stripped = (raw || '')
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9._]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 24);
  return stripped ? `@${stripped}` : '';
}

function simpleHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `h_${(h >>> 0).toString(16)}`;
}

export function loadStoredAccounts(): StoredAccountRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((acc: any) => {
      const handle =
        normalizeInstagramHandle(acc.handle || acc.profile?.handle || acc.profile?.username || acc.email?.split('@')[0] || 'cinefilo');
      return {
        ...acc,
        handle,
        profile: {
          ...acc.profile,
          handle,
        },
      };
    });
  } catch {
    return [];
  }
}

function saveStoredAccounts(accounts: StoredAccountRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {}
}

export function isHandleAvailable(rawHandle: string, excludeUserId?: string): boolean {
  const normalized = normalizeInstagramHandle(rawHandle);
  if (!normalized || normalized.length < 4) return false;
  const accounts = loadStoredAccounts();
  return !accounts.some(
    (a) => a.handle.toLowerCase() === normalized.toLowerCase() && a.userId !== excludeUserId
  );
}

export function saveProfileMetaBackup(profile: UserProfileState): void {
  if (typeof window === 'undefined' || !profile) return;
  try {
    const payload = JSON.stringify(profile);
    if (profile.userId) {
      localStorage.setItem(`${PROFILE_META_PREFIX}${profile.userId}`, payload);
    }
    if (profile.email) {
      localStorage.setItem(`${PROFILE_META_PREFIX}${profile.email.toLowerCase()}`, payload);
    }
  } catch {}
}

export function loadProfileMetaBackup(userId?: string, email?: string): Partial<UserProfileState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const byId = userId ? localStorage.getItem(`${PROFILE_META_PREFIX}${userId}`) : null;
    if (byId) return JSON.parse(byId);
    const byEmail = email ? localStorage.getItem(`${PROFILE_META_PREFIX}${email.toLowerCase()}`) : null;
    if (byEmail) return JSON.parse(byEmail);
    return null;
  } catch {
    return null;
  }
}

export function loadActiveLocalSession(): UserProfileState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfileState;
    if (!parsed || (!parsed.userId && !parsed.email)) return null;

    // Purge legacy fake mock accounts so app doesn't auto-open with fake user/rank
    if (
      parsed.userId === 'u-me' ||
      parsed.username === 'Novo Usuário' ||
      parsed.username === 'RAFAEL (ADM)' ||
      !parsed.email
    ) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      return null;
    }

    const backup = loadProfileMetaBackup(parsed.userId, parsed.email);
    const merged: UserProfileState = {
      ...parsed,
      ...backup,
      avatarUrl: parsed.avatarUrl || backup?.avatarUrl || '',
      coverUrl: parsed.coverUrl || backup?.coverUrl || '',
      handle: normalizeInstagramHandle(parsed.handle || backup?.handle || parsed.username),
    };
    return merged;
  } catch {
    return null;
  }
}

export function saveActiveLocalSession(profile: UserProfileState | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!profile) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      return;
    }
    const cleanHandle = normalizeInstagramHandle(profile.handle || profile.username || 'cinefilo');
    const enriched: UserProfileState = {
      ...profile,
      handle: cleanHandle,
    };
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(enriched));
    saveProfileMetaBackup(enriched);

    const accounts = loadStoredAccounts();
    const idx = accounts.findIndex(
      (a) =>
        (enriched.userId && a.userId === enriched.userId) ||
        (enriched.email && a.email.toLowerCase() === enriched.email.toLowerCase())
    );
    if (idx !== -1) {
      accounts[idx] = {
        ...accounts[idx],
        handle: cleanHandle,
        profile: {
          ...accounts[idx].profile,
          ...enriched,
          avatarUrl: enriched.avatarUrl || accounts[idx].profile.avatarUrl || '',
        },
      };
      saveStoredAccounts(accounts);
    }
  } catch {}
}

export async function registerAccount(params: {
  username: string;
  handle?: string;
  email: string;
  password: string;
  countryCode: string;
  city: string;
  bio?: string;
  avatarUrl?: string;
  favoriteGenres?: string[];
}): Promise<{ ok: boolean; profile?: UserProfileState; message: string }> {
  const cleanName = params.username.trim();
  const cleanHandle = normalizeInstagramHandle(params.handle || params.username);
  const cleanEmail = params.email.trim().toLowerCase();
  const pass = params.password;

  if (cleanName.length < 2) {
    return { ok: false, message: 'O nome de exibição deve ter pelo menos 2 caracteres.' };
  }
  if (!cleanHandle || cleanHandle.length < 4) {
    return { ok: false, message: 'O @username único deve ter pelo menos 3 letras ou números.' };
  }
  if (!isHandleAvailable(cleanHandle)) {
    return { ok: false, message: `O identificador ${cleanHandle} já está em uso. Escolha outro @username!` };
  }
  if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
    return { ok: false, message: 'Digite um endereço de e-mail válido.' };
  }
  if (pass.length < 6) {
    return { ok: false, message: 'A senha deve conter no mínimo 6 caracteres.' };
  }

  const existing = loadStoredAccounts().find((a) => a.email.toLowerCase() === cleanEmail);
  if (existing) {
    return { ok: false, message: 'Este e-mail já está cadastrado. Faça login na sua conta!' };
  }

  let uid = `u_${Date.now().toString(36)}`;
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    uid = cred.user.uid;
    await updateProfile(cred.user, {
      displayName: cleanName,
    });
  } catch {}

  const newProfile: UserProfileState = {
    ...INITIAL_USER_PROFILE,
    userId: uid,
    username: cleanName,
    handle: cleanHandle,
    email: cleanEmail,
    bio: params.bio?.trim() || 'Membro oficial da rede Luminoria 4K',
    countryCode: params.countryCode || 'BR',
    city: params.city?.trim() || 'São Paulo',
    maritalStatus: 'Solteiro(a)',
    favoriteGenres:
      params.favoriteGenres && params.favoriteGenres.length > 0
        ? params.favoriteGenres.slice(0, 4)
        : ['AÇÃO', 'AVENTURA', 'FICÇÃO'],
    avatarUrl: params.avatarUrl || '',
    onlineStatus: 'online',
    xp: 0,
    coins: 0,
    watchHours: 0.0,
    watchedCount: 0,
    favoritesCount: 0,
  };

  const accounts = loadStoredAccounts();
  accounts.push({
    userId: uid,
    handle: cleanHandle,
    email: cleanEmail,
    passwordHash: simpleHash(pass),
    profile: newProfile,
    createdAtIso: new Date().toISOString(),
  });
  saveStoredAccounts(accounts);
  saveActiveLocalSession(newProfile);

  return {
    ok: true,
    profile: newProfile,
    message: `Bem-vindo(a), ${cleanName} (${cleanHandle})! Sua conta foi criada com sucesso.`,
  };
}

export async function loginWithEmailPass(
  emailOrHandle: string,
  password: string
): Promise<{ ok: boolean; profile?: UserProfileState; message: string }> {
  const rawInput = emailOrHandle.trim().toLowerCase();
  if (!rawInput || !password) {
    return { ok: false, message: 'Informe seu e-mail (ou @username) e senha para entrar.' };
  }

  const accounts = loadStoredAccounts();
  const normalizedHandle = normalizeInstagramHandle(rawInput);
  const found = accounts.find(
    (a) =>
      a.email.toLowerCase() === rawInput ||
      a.handle.toLowerCase() === normalizedHandle.toLowerCase()
  );

  if (found) {
    if (found.passwordHash !== simpleHash(password)) {
      return { ok: false, message: 'Senha incorreta. Tente novamente.' };
    }
    const backup = loadProfileMetaBackup(found.userId, found.email);
    const activeProfile: UserProfileState = {
      ...found.profile,
      ...backup,
      avatarUrl: backup?.avatarUrl || found.profile.avatarUrl || '',
      handle: normalizeInstagramHandle(found.handle || found.profile.handle || found.profile.username),
      onlineStatus: 'online',
    };
    saveActiveLocalSession(activeProfile);
    try {
      await signInWithEmailAndPassword(auth, found.email, password);
    } catch {}
    return {
      ok: true,
      profile: activeProfile,
      message: `Login realizado! Bem-vindo de volta, ${activeProfile.username} (${activeProfile.handle}).`,
    };
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, rawInput, password);
    const backup = loadProfileMetaBackup(cred.user.uid, rawInput);
    const fallbackName = backup?.username || cred.user.displayName || rawInput.split('@')[0];
    const fbProfile: UserProfileState = {
      ...INITIAL_USER_PROFILE,
      ...backup,
      userId: cred.user.uid,
      username: fallbackName,
      handle: normalizeInstagramHandle(backup?.handle || fallbackName),
      email: rawInput,
      avatarUrl: backup?.avatarUrl || cred.user.photoURL || '',
      onlineStatus: 'online',
    };
    saveActiveLocalSession(fbProfile);
    return { ok: true, profile: fbProfile, message: 'Autenticado com sucesso!' };
  } catch {
    return {
      ok: false,
      message: 'Conta não encontrada. Clique na aba "Cadastrar" para criar seu @username único!',
    };
  }
}

export { signInWithGooglePopup, signOutFirebaseUser };
