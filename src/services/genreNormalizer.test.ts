import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractMediaReleaseYear,
  normalizeGenreAndMetadata,
  normalizeSeriesGenre,
  sortVodChronologically,
} from './genreNormalizer.ts';
import type { VodItem } from '../types/luminoria.ts';

test('extractMediaReleaseYear extracts explicit years and falls back across 2018-2025 deterministically', () => {
  assert.equal(extractMediaReleaseYear('Duna: Parte Dois (2024)', 'FILMES | AÇÃO'), 2024);
  assert.equal(extractMediaReleaseYear('Avatar 2026 4K', 'LANÇAMENTOS 2026'), 2026);
  assert.equal(extractMediaReleaseYear('Oppenheimer [2023]', 'DRAMA'), 2023);
  const fallbackYear = extractMediaReleaseYear('Filme Sem Ano Explicito', 'FILMES | COMÉDIA');
  assert.ok(fallbackYear >= 2018 && fallbackYear <= 2025);
});

test('normalizeSeriesGenre classifies series into rich streaming genres instead of generic TMDB', () => {
  const dorama = normalizeSeriesGenre('SERIES | DORAMAS', 'Round 6 (2025)');
  assert.equal(dorama, 'DORAMAS');

  const hbo = normalizeSeriesGenre('SERIES | HBO MAX', 'The Last of Us (2025)');
  assert.equal(hbo, 'MAX / HBO');

  const crime = normalizeSeriesGenre('SERIES | CRIME POLICIAL', 'Reacher (2024)');
  assert.equal(crime, 'SUSPENSE & CRIME');
});

test('sortVodChronologically orders movies from 2026 -> 2025 -> 2024 -> 2023 descending', () => {
  const sample: VodItem[] = [
    {
      id: 'm-2023',
      title: 'Missão 2023',
      category: 'AÇÃO',
      rating: 8.1,
      year: 2023,
      duration: '2h',
      synopsis: '',
      director: '',
      cast: [],
      streamUrl: 'http://test/1.mp4',
      artworkKey: 'dune_2',
      mediaType: 'movie',
    },
    {
      id: 'm-2026',
      title: 'Estreia 2026',
      category: 'AÇÃO',
      rating: 8.8,
      year: 2026,
      duration: '2h',
      synopsis: '',
      director: '',
      cast: [],
      streamUrl: 'http://test/2.mp4',
      artworkKey: 'dune_2',
      mediaType: 'movie',
    },
    {
      id: 'm-2025',
      title: 'Sucesso 2025',
      category: 'AÇÃO',
      rating: 8.5,
      year: 2025,
      duration: '2h',
      synopsis: '',
      director: '',
      cast: [],
      streamUrl: 'http://test/3.mp4',
      artworkKey: 'dune_2',
      mediaType: 'movie',
    },
    {
      id: 'm-2024',
      title: 'Destaque 2024',
      category: 'AÇÃO',
      rating: 8.4,
      year: 2024,
      duration: '2h',
      synopsis: '',
      director: '',
      cast: [],
      streamUrl: 'http://test/4.mp4',
      artworkKey: 'dune_2',
      mediaType: 'movie',
    },
  ];

  const sorted = sortVodChronologically(sample);
  assert.deepEqual(
    sorted.map((m) => m.year),
    [2026, 2025, 2024, 2023]
  );
});

test('normalizeGenreAndMetadata classifies movies into proper genres', () => {
  const horror = normalizeGenreAndMetadata('FILMES | TERROR', 'Sorria 2 (2024)');
  assert.equal(horror.category, 'TERROR');
  assert.equal(horror.year, 2024);
  assert.equal(horror.cleanTitle, 'Sorria 2');
});
