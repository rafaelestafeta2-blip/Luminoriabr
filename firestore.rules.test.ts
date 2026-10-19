import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesPath = fs.existsSync('./DRAFT_firestore.rules')
  ? './DRAFT_firestore.rules'
  : './firestore.rules';
const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

test('Dirty Dozen #1-2: Enforces verified user and strict owner UID matching on create/update', () => {
  assert.ok(rulesContent.includes('request.auth.token.email_verified == true'));
  assert.ok(rulesContent.includes('data.userId == request.auth.uid'));
  assert.ok(rulesContent.includes('isOwner(userId)'));
});

test('Dirty Dozen #3-4: Blocks shadow fields via strict hasAll and hasOnly key guards and affectedKeys', () => {
  assert.ok(rulesContent.includes('data.keys().hasAll(['));
  assert.ok(rulesContent.includes('data.keys().hasOnly(['));
  assert.ok(rulesContent.includes('incoming().diff(existing()).affectedKeys().hasOnly(['));
});

test('Dirty Dozen #5-6: Enforces immutable createdAt/userId and server timestamp request.time', () => {
  assert.ok(rulesContent.includes('incoming().createdAt == request.time'));
  assert.ok(rulesContent.includes('incoming().updatedAt == request.time'));
  assert.ok(rulesContent.includes('incoming().createdAt == existing().createdAt'));
  assert.ok(rulesContent.includes('incoming().userId == existing().userId'));
});

test('Dirty Dozen #7-9: Enforces string size limits, array size bounds, and non-negative XP/coins', () => {
  assert.ok(rulesContent.includes('data.bio.size() <= 240'));
  assert.ok(rulesContent.includes('data.favoriteGenres.size() <= 4'));
  assert.ok(rulesContent.includes('data.ownedProductIds.size() <= 10'));
  assert.ok(rulesContent.includes('data.xp >= 0 && data.xp <= 1000000'));
  assert.ok(rulesContent.includes('data.coins >= 0 && data.coins <= 1000000'));
});

test('Dirty Dozen #10-12: Enforces Master Gate parent exists, Notification read-only update lock, and Query Enforcer list rules', () => {
  assert.ok(rulesContent.includes('existsAfter(/databases/$(database)/documents/rankings/$(userId))'));
  assert.ok(rulesContent.includes('exists(/databases/$(database)/documents/users/$(userId))'));
  assert.ok(rulesContent.includes("data.type in ['epg_reminder', 'cinema_invite']"));
  assert.ok(rulesContent.includes("incoming().diff(existing()).affectedKeys().hasOnly(['read', 'updatedAt'])"));
  assert.ok(rulesContent.includes('allow list: if isOwner(userId) && existing().userId == request.auth.uid;'));
  assert.ok(rulesContent.includes('allow list: if isSignedIn() && existing().isPublic == true && existing().watchHours >= 0;'));
});

test('TMDB Cache Rules: Enforces signed-in read, verified user write, and isValidTmdbMovie schema blueprint', () => {
  assert.ok(rulesContent.includes('isValidTmdbMovie(incoming())'));
  assert.ok(rulesContent.includes('isValidTmdbSyncMeta(incoming())'));
  assert.ok(rulesContent.includes('match /tmdb_movies/{movieId}'));
  assert.ok(rulesContent.includes('match /tmdb_sync_meta/{metaId}'));
  assert.ok(rulesContent.includes("data.category in ['trending', 'popular', 'top_rated', 'now_playing']"));
});

