import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex, utf8ToBytes} from '@noble/hashes/utils.js';
import {serializeWorkoutCoaching, type WorkoutCoachingContext} from './workout-coaching';

export function workoutCoachingDigest(context: WorkoutCoachingContext): string {
  return bytesToHex(sha256(utf8ToBytes(serializeWorkoutCoaching(context))));
}

export function workoutCoachingRequestId(accountId: string, contextDigest: string): string {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(accountId) || !/^[0-9a-f]{64}$/.test(contextDigest)) throw new Error('Invalid coaching identity.');
  const bytes = sha256(utf8ToBytes(JSON.stringify(['movefield-workout-coaching-v1', accountId, contextDigest]))).slice(0, 16);
  bytes[6] = (bytes[6] & 15) | 128;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytesToHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
