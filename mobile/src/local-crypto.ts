import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { bytesToHex, bytesToUtf8, hexToBytes, utf8ToBytes } from '@noble/ciphers/utils.js';

// Pure helpers with no native imports, so the same code runs in the Node engine checks
// and in the app. Key storage and the secure random source live in storage.ts.

export const LOCAL_CIPHER = 'xchacha20poly1305' as const;
export const LOCAL_ENVELOPE_VERSION = 1 as const;
const KEY_BYTES = 32;
const NONCE_BYTES = 24;
const TAG_BYTES = 16;

export type LocalDataErrorCode = 'key-missing' | 'key-unavailable' | 'decrypt-failed' | 'unknown-format';

export class LocalDataError extends Error {
  readonly code: LocalDataErrorCode;
  constructor(code: LocalDataErrorCode, message: string) {
    super(message);
    this.name = 'LocalDataError';
    this.code = code;
  }
}

export type SealedRecord = { v: typeof LOCAL_ENVELOPE_VERSION; alg: typeof LOCAL_CIPHER; nonce: string; data: string };
export type RandomBytes = (byteCount: number) => Uint8Array;

const HEX_KEY = /^[0-9a-f]{64}$/;

export function newKeyHex(random: RandomBytes): string {
  const bytes = random(KEY_BYTES);
  if (bytes.length !== KEY_BYTES) throw new LocalDataError('key-unavailable', 'Secure random bytes were unavailable.');
  return bytesToHex(bytes);
}

export function keyFromHex(hex: string): Uint8Array {
  if (!HEX_KEY.test(hex)) throw new LocalDataError('key-unavailable', 'The saved data key on this device is damaged.');
  return hexToBytes(hex);
}

// Envelope fields are a fixed shape. Anything carrying these markers is treated as sealed,
// so a damaged envelope fails loudly instead of being read as legacy plain data.
export function isSealed(raw: string): boolean {
  const value = parseLoose(raw);
  return !!value && (value.alg !== undefined || value.nonce !== undefined || value.data !== undefined || value.v !== undefined);
}

function parseLoose(raw: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function parseSealed(raw: string): SealedRecord {
  const value = parseLoose(raw);
  if (!value || value.v !== LOCAL_ENVELOPE_VERSION || value.alg !== LOCAL_CIPHER || typeof value.nonce !== 'string' || typeof value.data !== 'string') {
    throw new LocalDataError('unknown-format', 'Saved data is in a format this app version cannot open.');
  }
  if (!/^[0-9a-f]{48}$/.test(value.nonce) || !/^[0-9a-f]+$/.test(value.data) || value.data.length < TAG_BYTES * 2 || value.data.length % 2 !== 0) {
    throw new LocalDataError('decrypt-failed', 'Saved data is damaged and could not be decrypted on this device.');
  }
  return { v: LOCAL_ENVELOPE_VERSION, alg: LOCAL_CIPHER, nonce: value.nonce, data: value.data };
}

// `slot` is the storage key the record is written under. Binding it as associated data stops a
// training record from being swapped into the setup slot (or any other slot) and still decrypting.
export function sealText(text: string, key: Uint8Array, slot: string, random: RandomBytes): string {
  if (key.length !== KEY_BYTES) throw new LocalDataError('key-unavailable', 'The saved data key on this device is damaged.');
  const nonce = random(NONCE_BYTES);
  if (nonce.length !== NONCE_BYTES) throw new LocalDataError('key-unavailable', 'Secure random bytes were unavailable.');
  const cipher = xchacha20poly1305(key, nonce, utf8ToBytes(slot));
  const record: SealedRecord = {
    v: LOCAL_ENVELOPE_VERSION,
    alg: LOCAL_CIPHER,
    nonce: bytesToHex(nonce),
    data: bytesToHex(cipher.encrypt(utf8ToBytes(text))),
  };
  return JSON.stringify(record);
}

export function openText(raw: string, key: Uint8Array, slot: string): string {
  const record = parseSealed(raw);
  try {
    const plain = xchacha20poly1305(key, hexToBytes(record.nonce), utf8ToBytes(slot)).decrypt(hexToBytes(record.data));
    return bytesToUtf8(plain);
  } catch {
    throw new LocalDataError('decrypt-failed', 'Saved data could not be decrypted on this device. It has not been changed.');
  }
}
