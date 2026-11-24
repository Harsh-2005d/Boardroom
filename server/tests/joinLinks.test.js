import test from 'node:test';
import assert from 'node:assert/strict';
import { createJoinToken, hashJoinToken, validJoinMode } from '../lib/joinLinks.js';

test('join links accept only the two configured access modes', () => {
  assert.equal(validJoinMode('anyone'), true);
  assert.equal(validJoinMode('approval'), true);
  assert.equal(validJoinMode('owner'), false);
});

test('join tokens are random, shareable values stored as one-way hashes', () => {
  const first = createJoinToken();
  const second = createJoinToken();
  assert.notEqual(first, second);
  assert.match(first, /^[A-Za-z0-9_-]{40,}$/);
  assert.notEqual(hashJoinToken(first), first);
  assert.equal(hashJoinToken(first), hashJoinToken(first));
});
