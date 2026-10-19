import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRankForXp,
  levelFromXp,
  getNextRankProgress,
  coinsForRank,
  parseM3U,
  generateM3U,
  validateCinemaCode,
  processShopPurchase,
  sanitizeProfileForBlueprint,
} from './luminoriaLogic.ts';
import {
  sanitizeNotificationForBlueprint,
  buildEpgReminderNotification,
  buildCinemaFriendJoinNotification,
} from './notificationLogic.ts';

test('getRankForXp and levelFromXp resolve all 10 Luminoria Pro patentes accurately', () => {
  assert.equal(getRankForXp(0).name, 'INICIANTE');
  assert.equal(levelFromXp(0), 1);

  assert.equal(getRankForXp(500).name, 'FÃ');
  assert.equal(levelFromXp(500), 3);

  assert.equal(getRankForXp(4200).name, 'CINÉFILO');
  assert.equal(levelFromXp(4200), 6);

  assert.equal(getRankForXp(15000).name, 'LUMINÁRIA');
  assert.equal(levelFromXp(19500), 10);
});

test('getNextRankProgress calculates remaining XP and percentage within tier', () => {
  const prog = getNextRankProgress(250);
  assert.equal(prog.currentRank.name, 'EXPLORADOR');
  assert.equal(prog.nextRank?.name, 'FÃ');
  assert.equal(prog.xpRemaining, 250);
  assert.equal(prog.progressPercent, 38);

  const maxProg = getNextRankProgress(16000);
  assert.equal(maxProg.currentRank.name, 'LUMINÁRIA');
  assert.equal(maxProg.nextRank, null);
  assert.equal(maxProg.progressPercent, 100);
});

test('coinsForRank matches monthly ranking payout rules', () => {
  assert.equal(coinsForRank(1), 500);
  assert.equal(coinsForRank(2), 300);
  assert.equal(coinsForRank(3), 150);
  assert.equal(coinsForRank(10), 25);
  assert.equal(coinsForRank(42), 15);
  assert.equal(coinsForRank(1001), 0);
});

test('parseM3U extracts EPG URL, attributes, and merges multi-source channels', () => {
  const sampleM3U = `#EXTM3U x-tvg-url="https://epg.luminoria.pro/guide.xml"
#EXTINF:-1 tvg-id="lumi.sports1" tvg-logo="https://cdn.luminoria.pro/s1.png" group-title="Esportes",Luminoria Sports 1 HD
https://stream1.luminoria.pro/live/sports1.m3u8
#EXTINF:-1 tvg-id="lumi.sports1" group-title="Esportes",Luminoria Sports 1 HD
https://backup.luminoria.pro/live/sports1.m3u8
#EXTINF:-1 tvg-id="lumi.cinema" group-title="Cinema",Luminoria Premiere 4K
https://stream1.luminoria.pro/live/cinema.m3u8`;

  const parsed = parseM3U(sampleM3U);
  assert.equal(parsed.epgUrl, 'https://epg.luminoria.pro/guide.xml');
  assert.equal(parsed.channels.length, 2);
  assert.equal(parsed.channels[0].name, 'Luminoria Sports 1 HD');
  assert.equal(parsed.channels[0].groupName, 'Esportes');
  assert.equal(parsed.channels[0].sources.length, 2);

  const regenerated = generateM3U(parsed.channels, 'Luminoria Principal');
  assert.ok(regenerated.includes('#PLAYLIST:Luminoria Principal'));
  assert.ok(regenerated.includes('https://backup.luminoria.pro/live/sports1.m3u8'));
});

test('validateCinemaCode normalizes and checks 6-character code', () => {
  const valid = validateCinemaCode('lumi-92');
  assert.equal(valid.valid, true);
  assert.equal(valid.normalized, 'LUMI92');

  const invalid = validateCinemaCode('abc');
  assert.equal(invalid.valid, false);
  assert.ok(invalid.error);
});

test('processShopPurchase deducts Luminarias or rejects insufficient balance', () => {
  const success = processShopPurchase(450, 120, 2);
  assert.equal(success.ok, true);
  assert.equal(success.remainingCoins, 210);
  assert.equal(success.totalCost, 240);

  const fail = processShopPurchase(100, 180, 1);
  assert.equal(fail.ok, false);
  assert.equal(fail.remainingCoins, 100);
});

test('sanitizeProfileForBlueprint enforces firebase-blueprint.json bounds and regexes', () => {
  const sanitized = sanitizeProfileForBlueprint({
    userId: 'user_123!@#',
    username: 'A',
    bio: 'x'.repeat(300),
    countryCode: 'brasil',
    maritalStatus: 'Solteiro(a)',
    favoriteGenres: ['G1', 'G2', 'G3', 'G4', 'G5'],
    xp: -50,
    coins: 2000000,
    watchHours: -10,
    equippedBorderId: 'prod-border-gold',
    equippedThemeId: 'invalid-theme',
    ownedProductIds: [],
  });

  assert.equal(sanitized.userId, 'user_123');
  assert.equal(sanitized.username, 'Utilizador');
  assert.equal(sanitized.bio.length, 240);
  assert.equal(sanitized.countryCode, 'BR');
  assert.equal(sanitized.favoriteGenres.length, 4);
  assert.equal(sanitized.xp, 0);
  assert.equal(sanitized.coins, 1000000);
  assert.equal(sanitized.watchHours, 0);
  assert.equal(sanitized.equippedThemeId, 'lotus');
});

test('sanitizeNotificationForBlueprint and builders enforce UserNotification schema bounds', () => {
  const epgAlert = buildEpgReminderNotification({
    userId: 'user_99',
    channelId: 'ch-1',
    channelName: 'Luminoria Sports 1 4K',
    programTitle: 'Pós-Jogo: Mesa Tática Europeia',
    startTime: '22:00',
    notificationId: 'notif-epg-1',
  });
  assert.equal(epgAlert.type, 'epg_reminder');
  assert.equal(epgAlert.targetId, 'ch-1');
  assert.equal(epgAlert.read, false);
  assert.ok(epgAlert.message.includes('22:00'));

  const cinemaAlert = buildCinemaFriendJoinNotification({
    userId: 'user_99',
    friendName: 'BeatrizCine',
    roomCode: 'lumi-92',
    movieTitle: 'Horizonte de Eventos: Protocolo Lótus',
    notificationId: 'notif-cinema-1',
  });
  assert.equal(cinemaAlert.type, 'cinema_invite');
  assert.equal(cinemaAlert.targetId, 'LUMI92');
  assert.ok(cinemaAlert.message.includes('BeatrizCine'));

  const sanitized = sanitizeNotificationForBlueprint({
    notificationId: 'bad!@#id',
    userId: 'u!@#1',
    type: 'unknown_type',
    title: 'A',
    message: 'x'.repeat(300),
    targetId: 'ch!@#2',
    read: true,
  });
  assert.equal(sanitized.notificationId, 'badid');
  assert.equal(sanitized.userId, 'u1');
  assert.equal(sanitized.type, 'epg_reminder');
  assert.equal(sanitized.title, 'Alerta Luminoria');
  assert.equal(sanitized.message.length, 220);
  assert.equal(sanitized.targetId, 'ch2');
  assert.equal(sanitized.read, true);
});
