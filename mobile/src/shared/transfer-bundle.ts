// Password-protected transfer files. The web and the phone write and read the same format.
// A transfer file holds one plaintext backup, sealed with a key derived from a password:
//   password -> Argon2id (salt, memory, passes) -> 32-byte key -> XChaCha20-Poly1305.
// The header is bound as associated data, so changing the cost settings or the source fails to open.
// Nothing here stores the password. A forgotten password cannot be recovered.
import {argon2idAsync} from '@noble/hashes/argon2.js';
import {xchacha20poly1305} from '@noble/ciphers/chacha.js';
import {bytesToHex, bytesToUtf8, hexToBytes, utf8ToBytes} from '@noble/ciphers/utils.js';

export const TRANSFER_FORMAT = 'movefield-transfer';
export const TRANSFER_VERSION = 1;
export const TRANSFER_MIN_PASSWORD = 12;
// OWASP's Argon2id minimum: 19 MiB memory, two passes, one lane.
export const TRANSFER_KDF = {name: 'argon2id', m: 19456, t: 2, p: 1} as const;
const LIMITS = {maxFileChars: 30_000_000, maxPasswordChars: 1024};
const COMMON = ['password1234', 'passwordpassword', '123456789012', 'qwertyuiop12', 'letmeinplease', 'iloveyou1234', 'correct horse'];

export type TransferErrorCode = 'short-password' | 'long-password' | 'common-password' | 'bad-format' | 'unsupported-version' | 'wrong-password' | 'too-large';
export class TransferError extends Error {
  code: TransferErrorCode;
  constructor(code: TransferErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'TransferError';
  }
}

type Kdf = {name: 'argon2id'; m: number; t: number; p: number; salt: string};
type Header = {format: string; version: number; source: 'web' | 'phone'; createdAt: string; kdf: Kdf; cipher: 'xchacha20poly1305'; nonce: string};
type Envelope = Header & {data: string};

// Returns a plain-words problem with a password, or null when it can be used.
export function passwordProblem(password: string): TransferError | null {
  const chars = [...password.normalize('NFC')].length;
  if (chars < TRANSFER_MIN_PASSWORD) return new TransferError('short-password', `Use at least ${TRANSFER_MIN_PASSWORD} characters. A short phrase of four or five words works well.`);
  if (chars > LIMITS.maxPasswordChars) return new TransferError('long-password', 'That password is too long.');
  if (COMMON.includes(password.trim().toLowerCase())) return new TransferError('common-password', 'That password is too common. Choose a phrase only you would use.');
  return null;
}

// The header fields in a fixed order, so the same header always produces the same associated data.
function associatedData(h: Header): Uint8Array {
  return utf8ToBytes(JSON.stringify([h.format, h.version, h.source, h.createdAt, h.kdf.name, h.kdf.m, h.kdf.t, h.kdf.p, h.kdf.salt, h.cipher, h.nonce]));
}

async function deriveKey(password: string, salt: Uint8Array, kdf: {m: number; t: number; p: number}): Promise<Uint8Array> {
  return argon2idAsync(utf8ToBytes(password.normalize('NFC')), salt, {t: kdf.t, m: kdf.m, p: kdf.p, dkLen: 32});
}

// random(n) must return n cryptographically random bytes: crypto.getRandomValues on the web, expo-crypto on the phone.
export async function createTransferFile(plaintext: string, password: string, options: {source: 'web' | 'phone'; random: (n: number) => Uint8Array; now?: Date}): Promise<string> {
  const problem = passwordProblem(password);
  if (problem) throw problem;
  const salt = options.random(16);
  const nonce = options.random(24);
  const header: Header = {
    format: TRANSFER_FORMAT,
    version: TRANSFER_VERSION,
    source: options.source,
    createdAt: (options.now ?? new Date()).toISOString(),
    kdf: {...TRANSFER_KDF, salt: bytesToHex(salt)},
    cipher: 'xchacha20poly1305',
    nonce: bytesToHex(nonce),
  };
  const key = await deriveKey(password, salt, TRANSFER_KDF);
  const sealed = xchacha20poly1305(key, nonce, associatedData(header)).encrypt(utf8ToBytes(plaintext));
  const envelope: Envelope = {...header, data: bytesToHex(sealed)};
  return JSON.stringify(envelope, null, 2);
}

// Reads a transfer file's header without a password, so the app can tell a transfer file from a plain backup.
export function isTransferFile(raw: string): boolean {
  try {
    const value = JSON.parse(raw);
    return value !== null && typeof value === 'object' && value.format === TRANSFER_FORMAT;
  } catch {
    return false;
  }
}

const hexOf = (value: unknown, bytes: number) => typeof value === 'string' && value.length === bytes * 2 && /^[0-9a-f]+$/.test(value);

function parseEnvelope(raw: string): Envelope {
  if (raw.length > LIMITS.maxFileChars) throw new TransferError('too-large', 'That file is too large to open here.');
  let value: any;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new TransferError('bad-format', 'This is not a Movefield transfer file.');
  }
  if (!value || typeof value !== 'object' || value.format !== TRANSFER_FORMAT) throw new TransferError('bad-format', 'This is not a Movefield transfer file.');
  if (value.version !== TRANSFER_VERSION) throw new TransferError('unsupported-version', 'This transfer file was made by a newer version of Movefield. Update the app, then try again.');
  const kdf = value.kdf;
  // This app writes only TRANSFER_KDF. Opening anything else would let a file choose its own cost, so a stronger
  // setting needs a new format version. Version 1 files use exactly these values.
  const kdfOk = kdf && kdf.name === TRANSFER_KDF.name && kdf.m === TRANSFER_KDF.m && kdf.t === TRANSFER_KDF.t && kdf.p === TRANSFER_KDF.p && hexOf(kdf.salt, 16);
  const shapeOk = value.cipher === 'xchacha20poly1305' && hexOf(value.nonce, 24) && typeof value.data === 'string' && /^(?:[0-9a-f]{2}){17,}$/.test(value.data)
    && (value.source === 'web' || value.source === 'phone') && typeof value.createdAt === 'string';
  if (!kdfOk || !shapeOk) throw new TransferError('bad-format', 'This transfer file is damaged or incomplete.');
  return value as Envelope;
}

// Returns the plaintext backup. Wrong password and changed file give the same message, because the cipher cannot tell them apart.
export async function openTransferFile(raw: string, password: string): Promise<string> {
  const envelope = parseEnvelope(raw);
  if (!password) throw new TransferError('wrong-password', 'Enter the password for this file.');
  const header: Header = {format: envelope.format, version: envelope.version, source: envelope.source, createdAt: envelope.createdAt, kdf: envelope.kdf, cipher: envelope.cipher, nonce: envelope.nonce};
  const key = await deriveKey(password, hexToBytes(envelope.kdf.salt), envelope.kdf);
  let plain: Uint8Array;
  try {
    plain = xchacha20poly1305(key, hexToBytes(envelope.nonce), associatedData(header)).decrypt(hexToBytes(envelope.data));
  } catch {
    throw new TransferError('wrong-password', 'The password is wrong, or this file has been changed. Nothing was replaced.');
  }
  return bytesToUtf8(plain);
}

export function transferSource(raw: string): 'web' | 'phone' | null {
  try {
    const value = JSON.parse(raw);
    return value?.source === 'web' || value?.source === 'phone' ? value.source : null;
  } catch {
    return null;
  }
}
