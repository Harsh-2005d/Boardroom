import { createHash, randomBytes } from 'node:crypto';

export function createJoinToken() {
  return randomBytes(32).toString('base64url');
}
export function hashJoinToken(token) {
  return createHash('sha256').update(token).digest('hex');
}
export function validJoinMode(mode) {
  return mode === 'anyone' || mode === 'approval';
}
