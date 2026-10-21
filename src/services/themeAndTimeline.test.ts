import test from 'node:test';
import assert from 'node:assert/strict';
import { hexToRgb, getPresetById } from './themeService.ts';
import { formatTimeAgo } from './timelineService.ts';

test('hexToRgb correctly parses 6-digit and 3-digit hex colors into RGB format', () => {
  assert.equal(hexToRgb('#E91E8C'), '233, 30, 140');
  assert.equal(hexToRgb('#0EA5E9'), '14, 165, 233');
  assert.equal(hexToRgb('#FFF'), '255, 255, 255');
  assert.equal(hexToRgb('#000000'), '0, 0, 0');
});

test('getPresetById returns matching preset or lotus as default fallback', () => {
  const ocean = getPresetById('ocean');
  assert.equal(ocean.id, 'ocean');
  assert.equal(ocean.primaryHex, '#0EA5E9');

  const fallback = getPresetById('unknown' as any);
  assert.equal(fallback.id, 'lotus');
  assert.equal(fallback.primaryHex, '#E91E8C');
});

test('formatTimeAgo calculates friendly human readable dates', () => {
  const now = new Date().toISOString();
  assert.equal(formatTimeAgo(now), 'Agora mesmo');

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  assert.equal(formatTimeAgo(fiveMinAgo), 'Há 5 min');

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  assert.equal(formatTimeAgo(twoHoursAgo), 'Há 2 h');

  const yesterday = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString();
  assert.equal(formatTimeAgo(yesterday), 'Ontem');
});
