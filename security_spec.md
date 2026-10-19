# Security Specification (`security_spec.md`) — Luminoria Pro Firestore

## 1. Data Invariants

1. **Default-Deny Catch-All**: All paths not explicitly matched (`/databases/{database}/documents/{document=**}`) deny all `read` and `write` operations.
2. **Verified Identity**: All writes (`create`, `update`, `delete`) require an authenticated user (`request.auth != null`) with a verified email (`request.auth.token.email_verified == true`) and valid path IDs (`isValidId(userId)` where `userId == request.auth.uid`).
3. **PII Isolation & Split Collection Strategy**:
   - `/users/{userId}` stores the private user profile state (`UserProfile`) and is strictly readable (`get`) and writable (`create`, `update`) ONLY by its owner (`request.auth.uid == userId`). `list` and `delete` are forbidden on `/users/{userId}`.
   - `/rankings/{userId}` stores public non-PII leaderboard entries (`GlobalRankEntry`). `list` queries MUST filter by `resource.data.isPublic == true` and `resource.data.watchHours >= 0`.
   - `/users/{userId}/notifications/{notificationId}` stores private real-time EPG & Cinema Room notifications (`UserNotification`). Access is strictly restricted to `isOwner(userId)`.
4. **Master Gate & Relational Sync Invariant**:
   - A `/rankings/{userId}` document cannot be created or updated unless the corresponding `/users/{userId}` document exists (`exists(...) || existsAfter(...)`).
   - A `/users/{userId}/notifications/{notificationId}` document cannot be accessed (`get`, `create`, `update`, `delete`) unless the parent `/users/{userId}` document exists (`exists(/databases/$(database)/documents/users/$(userId))`).
   - `list` on `/users/{userId}/notifications/{notificationId}` enforces `isOwner(userId) && existing().userId == request.auth.uid` without `get()`/`exists()` inside `allow list` to prevent O(n) read cost explosions.
5. **Strict Schema, Volumetric & Temporal Integrity**:
   - Every string field enforces exact `.size()` bounds and regex patterns matching `firebase-blueprint.json`.
   - Notification updates (`update`) are strictly locked to marking `read` status via `incoming().diff(existing()).affectedKeys().hasOnly(['read', 'updatedAt'])`.
   - `createdAt` must equal `request.time` on `create` and is immutable on `update`.
   - `updatedAt` must equal `request.time` on both `create` and `update`.

---

## 2. The "Dirty Dozen" Payloads (Designed to Break Identity, Integrity, and State)

1. **Payload 1 (Identity Spoofing on Create)**: Authenticated user `uid_attacker` creates `/users/uid_victim` with `userId: "uid_victim"`. -> `PERMISSION_DENIED`
2. **Payload 2 (Unverified Email Spoof)**: Authenticated user with `email_verified: false` attempts to create `/users/uid_unverified`. -> `PERMISSION_DENIED`
3. **Payload 3 (Shadow Field Injection on Create)**: User creates `/users/uid_1` with all required fields plus ghost field `"isAdmin": true`. -> `PERMISSION_DENIED`
4. **Payload 4 (Shadow Field Injection on Update)**: User updates `/users/uid_1` with `"role": "superadmin"`. -> `PERMISSION_DENIED`
5. **Payload 5 (Immortal Field Mutation)**: User updates `/users/uid_1` modifying `createdAt` or `userId`. -> `PERMISSION_DENIED`
6. **Payload 6 (Client Timestamp Forgery)**: User creates `/users/uid_1` with a past/future timestamp instead of `request.time`. -> `PERMISSION_DENIED`
7. **Payload 7 (Denial-of-Wallet String Overflow)**: User updates `bio` on `/users/uid_1` with a 5,000-character string (`> 240`). -> `PERMISSION_DENIED`
8. **Payload 8 (Array Overflow Attack)**: User updates `favoriteGenres` with 8 elements (`> 4`). -> `PERMISSION_DENIED`
9. **Payload 9 (Negative Coin / XP Poisoning)**: User updates `coins` to `-500` or `xp` to a string `"9999"`. -> `PERMISSION_DENIED`
10. **Payload 10 (Orphaned Subcollection / Ranking Write)**: User creates `/users/uid_no_profile/notifications/notif_1` without an existing parent `/users/uid_no_profile` document. -> `PERMISSION_DENIED`
11. **Payload 11 (Cross-User Notification / Profile Read)**: Authenticated user `uid_attacker` attempts `get` or `list` on `/users/uid_victim/notifications/notif_1`. -> `PERMISSION_DENIED`
12. **Payload 12 (Notification Payload Mutation Bypass)**: User attempts to update `title` or `type` on an existing notification instead of only `['read', 'updatedAt']`. -> `PERMISSION_DENIED`

---

## 3. Security Rules Test Suite Reference (`firestore.rules.test.ts`)

See `/firestore.rules.test.ts` for the automated verification assertions covering all 12 Dirty Dozen payloads.
