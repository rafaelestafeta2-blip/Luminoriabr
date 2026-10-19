import test from 'node:test';
import assert from 'node:assert/strict';
import { isLocalCacheValid } from './tmdbLocalDb.ts';

test('isLocalCacheValid returns true for recent timestamps and false for expired', () => {
  const recent = new Date().toISOString();
  assert.equal(isLocalCacheValid(recent, 1000 * 60 * 60), true);

  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  assert.equal(isLocalCacheValid(twoDaysAgo, 24 * 60 * 60 * 1000), false);

  assert.equal(isLocalCacheValid(undefined), false);
  assert.equal(isLocalCacheValid('invalid-date'), false);
});
