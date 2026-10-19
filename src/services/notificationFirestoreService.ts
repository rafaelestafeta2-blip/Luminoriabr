import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebaseClient';
import { AppNotification } from '../types/luminoria';
import { sanitizeNotificationForBlueprint } from '../utils/notificationLogic';

/**
 * Persists a new EPG reminder or Cinema Room friend alert in
 * /users/{userId}/notifications/{notificationId}
 */
export async function createFirestoreNotification(
  userId: string,
  notification: AppNotification
): Promise<void> {
  const clean = sanitizeNotificationForBlueprint({
    ...notification,
    userId,
  });
  const path = `users/${userId}/notifications/${clean.notificationId}`;
  const notifRef = doc(db, 'users', userId, 'notifications', clean.notificationId);

  try {
    await setDoc(notifRef, {
      notificationId: clean.notificationId,
      userId: clean.userId,
      type: clean.type,
      title: clean.title,
      message: clean.message,
      targetId: clean.targetId,
      read: clean.read,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Marks a single notification as read in /users/{userId}/notifications/{notificationId}
 * adhering strictly to the Action-Based Update rule (affectedKeys: ['read', 'updatedAt']).
 */
export async function markFirestoreNotificationRead(
  userId: string,
  notificationId: string,
  read: boolean = true
): Promise<void> {
  const safeNotifId = notificationId.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 128);
  const path = `users/${userId}/notifications/${safeNotifId}`;
  const notifRef = doc(db, 'users', userId, 'notifications', safeNotifId);

  try {
    await updateDoc(notifRef, {
      read,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Deletes a notification from /users/{userId}/notifications/{notificationId}
 */
export async function deleteFirestoreNotification(
  userId: string,
  notificationId: string
): Promise<void> {
  const safeNotifId = notificationId.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 128);
  const path = `users/${userId}/notifications/${safeNotifId}`;
  const notifRef = doc(db, 'users', userId, 'notifications', safeNotifId);

  try {
    await deleteDoc(notifRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Real-time listener for user's notifications in /users/{userId}/notifications
 * Enforces Pillar 8 Query Enforcer: where('userId', '==', userId)
 */
export function subscribeToUserNotifications(
  userId: string,
  onNotifications: (items: AppNotification[]) => void
): Unsubscribe {
  const path = `users/${userId}/notifications`;
  const q = query(
    collection(db, 'users', userId, 'notifications'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: { item: AppNotification; tsMs: number }[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        const tsMs =
          d.createdAt && typeof d.createdAt.toMillis === 'function'
            ? d.createdAt.toMillis()
            : Date.now();
        const timeStr = new Date(tsMs).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });

        list.push({
          tsMs,
          item: {
            notificationId: d.notificationId || docSnap.id,
            userId: d.userId || userId,
            type: d.type === 'cinema_invite' ? 'cinema_invite' : 'epg_reminder',
            title: d.title || 'Alerta Luminoria',
            message: d.message || '',
            targetId: d.targetId || 'ch-1',
            read: Boolean(d.read),
            createdAtLabel: timeStr,
          },
        });
      });

      const sorted = list.sort((a, b) => b.tsMs - a.tsMs).map((entry) => entry.item);
      onNotifications(sorted);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
