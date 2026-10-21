import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWeeklyTop10List,
  computeWeeklyMomentumScore,
  getCurrentIsoWeekInfo,
  hydrateTop10WithM3uStreams,
} from './weeklyTop10Service';
import type { VodItem } from '../types/luminoria';

test('getCurrentIsoWeekInfo returns deterministic ISO week key and countdown days', () => {
  const wednesday = new Date('2026-10-21T12:00:00Z');
  const info = getCurrentIsoWeekInfo(wednesday);
  assert.match(info.weekKey, /^2026-W\d{2}$/);
  assert.ok(info.weekNumber >= 1 && info.weekNumber <= 53);
  assert.ok(info.daysUntilRefresh >= 1 && info.daysUntilRefresh <= 7);
});

test('computeWeeklyMomentumScore prioritizes 2026/2025 releases and playable M3U streams', () => {
  const newRelease2026: VodItem = {
    id: 'm-1',
    title: 'Homem-Aranha: Um Novo Dia',
    year: 2026,
    duration: '2h 10m',
    rating: 9.2,
    category: 'AÇÃO',
    synopsis: 'Teste',
    director: 'Diretor',
    cast: [],
    streamUrl: 'https://elitedns.xyz/movie/1.mp4',
    artworkKey: 'cyber_odyssey',
    posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
    isComingSoon: false,
  };

  const olderCatalog2019: VodItem = {
    ...newRelease2026,
    id: 'm-2',
    year: 2019,
    rating: 8.5,
    isComingSoon: true,
  };

  assert.ok(
    computeWeeklyMomentumScore(newRelease2026) >
      computeWeeklyMomentumScore(olderCatalog2019)
  );
});

test('hydrateTop10WithM3uStreams links TMDB Top 10 items to matching M3U streams and ranks 1..10', () => {
  const tmdbTop: VodItem[] = [
    {
      id: 'tmdb-999',
      title: 'Duna: Parte Dois',
      year: 2025,
      duration: '2h 46m',
      rating: 8.9,
      category: 'FICÇÃO CIENTÍFICA',
      synopsis: 'Arrakis',
      director: 'Denis Villeneuve',
      cast: [],
      streamUrl: '',
      artworkKey: 'solaris_titan',
      isComingSoon: true,
    },
  ];

  const m3uPool: VodItem[] = [
    {
      id: 'xt-movie-777',
      title: 'Duna Parte Dois [4K] (2025)',
      year: 2025,
      duration: '2h 46m',
      rating: 8.9,
      category: 'FICÇÃO CIENTÍFICA',
      synopsis: 'Arrakis',
      director: 'Denis Villeneuve',
      cast: [],
      streamUrl: 'https://elitedns.xyz/movie/Rafalaila/1662167/777.mp4',
      artworkKey: 'solaris_titan',
      isComingSoon: false,
    },
  ];

  const hydrated = hydrateTop10WithM3uStreams(tmdbTop, m3uPool);
  assert.equal(hydrated[0].isComingSoon, false);
  assert.equal(hydrated[0].streamUrl, 'https://elitedns.xyz/movie/Rafalaila/1662167/777.mp4');
  assert.equal(hydrated[0].rankPosition, 1);

  const fullList = buildWeeklyTop10List([], [], m3uPool);
  assert.equal(fullList.length, 1);
  assert.equal(fullList[0].rankPosition, 1);
});
