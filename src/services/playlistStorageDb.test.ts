import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadPersistedPlaylists,
  OFFICIAL_ELITEDNS_M3U_URL,
  OFFICIAL_ELITEDNS_PLAYLIST,
} from './playlistStorageDb.ts';
import { getFallbackYoutubeTrailerId } from './tmdbEnrichClient.ts';

test('OFFICIAL_ELITEDNS_PLAYLIST contains the user official Rafalaila M3U_PLUS link and 302k item stats', () => {
  const list = loadPersistedPlaylists();
  assert.equal(list.length, 1);
  assert.equal(list[0].id, OFFICIAL_ELITEDNS_PLAYLIST.id);
  assert.equal(list[0].m3uUrl, OFFICIAL_ELITEDNS_M3U_URL);
  assert.equal(list[0].username, 'Rafalaila');
  assert.equal(list[0].totalServerItems, 302408);
  assert.equal(list[0].moviesCount, 28100);
  assert.equal(list[0].seriesCount, 9513);
  assert.equal(list[0].liveCount, 3584);
});

test('getFallbackYoutubeTrailerId returns valid 11-char YouTube trailer IDs', () => {
  const id1 = getFallbackYoutubeTrailerId('Capital Humano');
  assert.equal(id1, 'PJn01e2Qs00');
  const id2 = getFallbackYoutubeTrailerId('Tulsa King');
  assert.equal(id2, 'aaQSScwZPbA');
  const id3 = getFallbackYoutubeTrailerId('Filme Inédito 2026');
  assert.equal(id3.length, 11);
});
