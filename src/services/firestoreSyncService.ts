import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebaseClient';
import { RankEntry, UserProfileState } from '../types/luminoria';
import { sanitizeProfileForBlueprint } from '../utils/luminoriaLogic';

/**
 * Ensures the authenticated user's profile (/users/{userId}) and public ranking
 * entry (/rankings/{userId}) exist in Firestore, creating both atomically via writeBatch
 * if not yet initialized.
 */
export async function ensureUserAndRankingInFirestore(
  userId: string,
  seedProfile: UserProfileState
): Promise<void> {
  const userPath = `users/${userId}`;
  const rankPath = `rankings/${userId}`;
  const userRef = doc(db, 'users', userId);
  const rankRef = doc(db, 'rankings', userId);

  try {
    const existingSnap = await getDoc(userRef);
    if (existingSnap.exists()) {
      return;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  const clean = sanitizeProfileForBlueprint({ ...seedProfile, userId });
  const batch = writeBatch(db);

  batch.set(userRef, {
    userId: clean.userId,
    username: clean.username,
    bio: clean.bio,
    countryCode: clean.countryCode,
    maritalStatus: clean.maritalStatus,
    favoriteGenres: clean.favoriteGenres,
    xp: clean.xp,
    coins: clean.coins,
    watchHours: clean.watchHours,
    equippedBorderId: clean.equippedBorderId,
    equippedThemeId: clean.equippedThemeId,
    ownedProductIds: clean.ownedProductIds,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(rankRef, {
    userId: clean.userId,
    username: clean.username,
    countryCode: clean.countryCode,
    watchHours: clean.watchHours,
    xp: clean.xp,
    equippedBorderId: clean.equippedBorderId,
    isPublic: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${userPath} & ${rankPath}`);
  }
}

/**
 * Atomically updates either profile details (Action 1) or progression stats (Action 2)
 * in /users/{userId} alongside the corresponding public leaderboard fields in /rankings/{userId}.
 */
export async function syncProfileAndRankingToFirestore(
  userId: string,
  nextProfile: UserProfileState,
  actionType: 'details' | 'progression'
): Promise<void> {
  const userPath = `users/${userId}`;
  const rankPath = `rankings/${userId}`;
  const userRef = doc(db, 'users', userId);
  const rankRef = doc(db, 'rankings', userId);

  const clean = sanitizeProfileForBlueprint({ ...nextProfile, userId });
  const batch = writeBatch(db);

  if (actionType === 'details') {
    batch.update(userRef, {
      username: clean.username,
      bio: clean.bio,
      countryCode: clean.countryCode,
      maritalStatus: clean.maritalStatus,
      favoriteGenres: clean.favoriteGenres,
      equippedBorderId: clean.equippedBorderId,
      equippedThemeId: clean.equippedThemeId,
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.update(userRef, {
      xp: clean.xp,
      coins: clean.coins,
      watchHours: clean.watchHours,
      ownedProductIds: clean.ownedProductIds,
      equippedBorderId: clean.equippedBorderId,
      equippedThemeId: clean.equippedThemeId,
      updatedAt: serverTimestamp(),
    });
  }

  batch.update(rankRef, {
    username: clean.username,
    countryCode: clean.countryCode,
    watchHours: clean.watchHours,
    xp: clean.xp,
    equippedBorderId: clean.equippedBorderId,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${userPath} & ${rankPath}`);
  }
}

export function subscribeToUserProfile(
  userId: string,
  onProfile: (data: Partial<UserProfileState>) => void
): Unsubscribe {
  const path = `users/${userId}`;
  return onSnapshot(
    doc(db, 'users', userId),
    (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      onProfile({
        userId: d.userId,
        username: d.username,
        bio: d.bio,
        countryCode: d.countryCode,
        maritalStatus: d.maritalStatus,
        favoriteGenres: Array.isArray(d.favoriteGenres) ? d.favoriteGenres : [],
        xp: typeof d.xp === 'number' ? d.xp : 0,
        coins: typeof d.coins === 'number' ? d.coins : 0,
        watchHours: typeof d.watchHours === 'number' ? d.watchHours : 0,
        equippedBorderId: d.equippedBorderId || 'prod-border-lotus',
        equippedThemeId: d.equippedThemeId || 'lotus',
        ownedProductIds: Array.isArray(d.ownedProductIds) ? d.ownedProductIds : ['prod-border-lotus'],
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToGlobalRankings(
  onRankings: (entries: RankEntry[]) => void
): Unsubscribe {
  const path = 'rankings';
  const q = query(
    collection(db, 'rankings'),
    where('isPublic', '==', true),
    where('watchHours', '>=', 0)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: Omit<RankEntry, 'rank'>[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          userId: d.userId,
          username: d.username,
          countryCode: d.countryCode || 'BR',
          watchHours: typeof d.watchHours === 'number' ? d.watchHours : 0,
          xp: typeof d.xp === 'number' ? d.xp : 0,
          equippedBorderId: d.equippedBorderId || 'prod-border-lotus',
        });
      });

      const sorted: RankEntry[] = list
        .sort((a, b) => b.watchHours - a.watchHours || b.xp - a.xp)
        .map((item, idx) => ({ ...item, rank: idx + 1 }));

      onRankings(sorted);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
