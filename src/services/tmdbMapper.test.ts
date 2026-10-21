import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapTmdbGenresToExistingCategory,
  convertTmdbToVodItem,
  mergeTmdbIntoVodCatalog,
} from './tmdbMapper.ts';
import type { TmdbMovieItem } from '../types/tmdb.ts';
import type { VodItem } from '../types/luminoria.ts';

test('mapTmdbGenresToExistingCategory maps genres to app core categories', () => {
  assert.equal(mapTmdbGenresToExistingCategory(['Ação', 'Aventura']), 'AÇÃO');
  assert.equal(mapTmdbGenresToExistingCategory(['Crime', 'Guerra']), 'AÇÃO');
  assert.equal(mapTmdbGenresToExistingCategory(['Aventura', 'Ficção Científica']), 'AVENTURA');
  assert.equal(mapTmdbGenresToExistingCategory(['Animação', 'Comédia']), 'AVENTURA');
  assert.equal(mapTmdbGenresToExistingCategory(['Suspense', 'Mistério']), 'SUSPENSE');
  assert.equal(mapTmdbGenresToExistingCategory(['Terror', 'Drama']), 'SUSPENSE');
});

test('convertTmdbToVodItem creates a valid VodItem with real poster URL and existing category', () => {
  const item: TmdbMovieItem = {
    id: 'tmdb-533535',
    tmdbId: 533535,
    title: 'Deadpool & Wolverine',
    originalTitle: 'Deadpool & Wolverine',
    overview: 'Sinopse oficial',
    posterPath: 'https://image.tmdb.org/t/p/w500/poster.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/w1280/backdrop.jpg',
    releaseDate: '2024-07-24',
    voteAverage: 7.7,
    voteCount: 4000,
    genres: ['Ação', 'Comédia'],
    category: 'popular',
    mediaType: 'movie',
    durationMinutes: 128,
  };

  const vod = convertTmdbToVodItem(item, 0);
  assert.equal(vod.id, 'tmdb-533535');
  assert.equal(vod.title, 'Deadpool & Wolverine');
  assert.equal(vod.category, 'AÇÃO');
  assert.equal(vod.year, 2024);
  assert.equal(vod.duration, '2h 08m');
  assert.equal(vod.posterUrl, 'https://image.tmdb.org/t/p/w500/poster.jpg');
  assert.equal(vod.backdropUrl, 'https://image.tmdb.org/t/p/w1280/backdrop.jpg');
  assert.equal(vod.rankPosition, 1);
});

test('mergeTmdbIntoVodCatalog populates TMDB movies alongside existing catalog', () => {
  const existing: VodItem[] = [
    {
      id: 'vod-1',
      title: 'Capital Humano',
      year: 2026,
      duration: '1h 58m',
      rating: 9.4,
      category: 'SUSPENSE',
      mediaType: 'movie',
      synopsis: 'Sinopse',
      director: 'Diretor',
      cast: ['Ator'],
      streamUrl: 'https://stream.url',
      artworkKey: 'crimson_freq',
    },
    {
      id: 'series-1',
      title: 'Tulsa King',
      year: 2024,
      duration: '2 Temporadas',
      rating: 9.1,
      category: 'SÉRIES',
      mediaType: 'series',
      synopsis: 'Sinopse series',
      director: 'Taylor Sheridan',
      cast: ['Sylvester Stallone'],
      streamUrl: 'https://stream.url',
      artworkKey: 'tulsa_king',
    },
  ];

  const tmdbList: TmdbMovieItem[] = [
    {
      id: 'tmdb-693134',
      tmdbId: 693134,
      title: 'Duna: Parte Dois',
      originalTitle: 'Dune: Part Two',
      overview: 'Sinopse Duna',
      posterPath: 'https://image.tmdb.org/t/p/w500/dune.jpg',
      backdropPath: 'https://image.tmdb.org/t/p/w1280/dune_back.jpg',
      releaseDate: '2024-02-27',
      voteAverage: 8.2,
      voteCount: 5000,
      genres: ['Aventura', 'Ficção Científica'],
      category: 'popular',
      mediaType: 'movie',
      durationMinutes: 166,
    },
  ];

  const merged = mergeTmdbIntoVodCatalog(existing, tmdbList);
  assert.equal(merged.length, 3);
  const duna = merged.find((m) => m.id === 'tmdb-693134');
  assert.ok(duna);
  assert.equal(duna?.category, 'AVENTURA');
  assert.equal(duna?.posterUrl, 'https://image.tmdb.org/t/p/w500/dune.jpg');
  // Since Duna is not in the M3U list, it should be tagged as Coming Soon ("EM BREVE")
  assert.equal(duna?.isComingSoon, true);

  // Verify existing M3U item with real stream URL is NOT coming soon
  const cap = merged.find((m) => m.id === 'vod-1');
  assert.equal(cap?.isComingSoon, false);
  assert.equal(cap?.hasM3uStream, true);

  // Verify series item is retained
  const tulsa = merged.find((m) => m.id === 'series-1');
  assert.ok(tulsa);
  assert.equal(tulsa?.mediaType, 'series');
});

