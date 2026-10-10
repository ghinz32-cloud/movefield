// Durable account sync metadata contains opaque authenticated envelopes only.
// Adapters commit this state in the same transaction as their local ciphertext.
export const SYNC_RECORD_MAX_CHARS = 1_000_000;
export const SYNC_MUTATION_MAX_CHARS = 1_100_000;
export const SYNC_QUEUE_MAX = 256;
export const SYNC_ENQUEUE_MAX_RECORDS = 5001;
export const SYNC_ENQUEUE_MAX_CHARS = 64_000_000;
export const SYNC_OUTBOX_MAX_CHARS = 64_000_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACCOUNT = /^[a-zA-Z0-9_-]{1,128}$/;
const RECORD = /^[a-zA-Z0-9:_-]{1,128}$/;
const reasons = ['network', 'timeout', 'auth', 'conflict', 'rejected'] as const;
export type SyncFailureReason = typeof reasons[number];
export type SyncRecord = {id: string; ciphertext: string | null};
export type SyncEnqueue = {accountId: string; mutationId: string; records: SyncRecord[]; now: number};
export type SyncRequest = {mutationId: string; baseRevision: number; records: SyncRecord[]};
export type SyncClaim = SyncRequest & {accountId: string; leaseId: string};
type Pending = {
  mutationId: string; records: SyncRecord[]; baseRevision: number | null;
  createdAt: number; attempts: number; nextAttemptAt: number;
  leaseId: string | null; leaseUntil: number; blocked: SyncFailureReason | null;
};
type AccountQueue = {revision: number; pending: Pending[]};
export type SyncOutboxState = {version: 1; accounts: Record<string, AccountQueue>};
export type SyncClaimInput = {accountId: string; leaseId: string; now: number; leaseMs?: number};
export type SyncAckInput = {accountId: string; leaseId: string; mutationId: string; baseRevision: number; revision: number};
export type SyncFailInput = {accountId: string; leaseId: string; mutationId: string; now: number; reason: SyncFailureReason};
export class SyncOutboxError extends Error {
  constructor(public code: 'unknown-format' | 'capacity' | 'conflict', message: string) {super(message); this.name = 'SyncOutboxError';}
}
const bad = () => new SyncOutboxError('unknown-format', 'Saved sync metadata has an unexpected format. Your local records were preserved.');
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const exact = (value: Record<string, unknown>, fields: string[]) => Object.keys(value).sort().join(',') === fields.sort().join(',');
function account(id: string) {if (typeof id !== 'string' || !ACCOUNT.test(id) || id === 'prototype' || Object.prototype.hasOwnProperty.call(Object.prototype, id)) throw bad();}
function uuid(id: string) {if (typeof id !== 'string' || !UUID.test(id)) throw bad();}
function time(value: number) {if (!integer(value)) throw bad();}

// Reject arbitrary plaintext, passwords and keys even if a caller mislabels them
// "ciphertext". Opening/authenticating a transfer remains the vault's job.
export function isSyncCiphertext(raw: string): boolean {
  if (typeof raw !== 'string' || !raw.length || raw.length > SYNC_RECORD_MAX_CHARS) return false;
  try {
    const value: unknown = JSON.parse(raw);
    if (!object(value)) return false;
    const hex = (v: unknown, size: number) => typeof v === 'string' && v.length === size * 2 && /^[0-9a-f]+$/.test(v);
    const b64 = (v: unknown) => typeof v === 'string' && v.length >= 24 && v.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(v);
    const kdf = value.kdf;
    return exact(value, ['format', 'version', 'kdf', 'cipher', 'nonce', 'data'])
      && value.format === 'movefield-sync' && value.version === 1
      && object(kdf) && exact(kdf, ['name', 'm', 't', 'p', 'salt']) && kdf.name === 'argon2id' && kdf.m === 19456 && kdf.t === 2 && kdf.p === 1 && hex(kdf.salt, 16)
      && value.cipher === 'aes-256-gcm' && hex(value.nonce, 12) && b64(value.data);
  } catch {return false;}
}

function records(raw: unknown, maximum = 25, maximumChars = SYNC_MUTATION_MAX_CHARS - 256): SyncRecord[] {
  if (!Array.isArray(raw) || !raw.length || raw.length > maximum) throw bad();
  const ids = new Set<string>();
  const detached = raw.map((value: unknown) => {
    if (!object(value) || !exact(value, ['id', 'ciphertext']) || typeof value.id !== 'string' || !RECORD.test(value.id) || ids.has(value.id)
      || value.ciphertext !== null && (typeof value.ciphertext !== 'string' || !isSyncCiphertext(value.ciphertext))) throw bad();
    ids.add(value.id);
    return {id: value.id, ciphertext: value.ciphertext as string | null};
  });
  if (JSON.stringify(detached).length > maximumChars) throw new SyncOutboxError('capacity', 'This encrypted sync snapshot is too large. Local records were preserved.');
  return detached;
}
export function validateSyncEnqueue(input: SyncEnqueue): SyncEnqueue {
  if (!object(input) || !exact(input, ['accountId', 'mutationId', 'records', 'now'])) throw bad();
  account(input.accountId); uuid(input.mutationId); time(input.now);
  return {...input, records: records(input.records, SYNC_ENQUEUE_MAX_RECORDS, SYNC_ENQUEUE_MAX_CHARS)};
}
export function emptySyncOutbox(): SyncOutboxState {return {version: 1, accounts: {}};}
export function validateSyncOutbox(raw: unknown): SyncOutboxState {
  if (raw === undefined) return emptySyncOutbox();
  if (!object(raw) || !exact(raw, ['version', 'accounts']) || raw.version !== 1 || !object(raw.accounts) || Object.keys(raw.accounts).length > 8) throw bad();
  const accounts: Record<string, AccountQueue> = {};
  for (const [id, value] of Object.entries(raw.accounts)) {
    account(id);
    if (!object(value) || !exact(value, ['revision', 'pending']) || !integer(value.revision) || !Array.isArray(value.pending) || value.pending.length > SYNC_QUEUE_MAX) throw bad();
    const ids = new Set<string>();
    const pending: Pending[] = value.pending.map((row: unknown, index: number) => {
      if (!object(row) || !exact(row, ['mutationId', 'records', 'baseRevision', 'createdAt', 'attempts', 'nextAttemptAt', 'leaseId', 'leaseUntil', 'blocked'])
        || typeof row.mutationId !== 'string' || !UUID.test(row.mutationId) || ids.has(row.mutationId)
        || row.baseRevision !== null && (!integer(row.baseRevision) || index !== 0)
        || !integer(row.createdAt) || !integer(row.attempts) || !integer(row.nextAttemptAt) || !integer(row.leaseUntil)
        || row.leaseId !== null && (typeof row.leaseId !== 'string' || !UUID.test(row.leaseId))
        || row.blocked !== null && !reasons.includes(row.blocked as SyncFailureReason)
        || row.baseRevision === null && (row.attempts !== 0 || row.leaseId !== null || row.leaseUntil !== 0 || row.blocked !== null)
        || row.leaseId === null && row.leaseUntil !== 0) throw bad();
      ids.add(row.mutationId);
      return {...row, records: records(row.records)} as Pending;
    });
    accounts[id] = {revision: value.revision, pending};
  }
  const state: SyncOutboxState = {version: 1, accounts};
  if (JSON.stringify(state).length > SYNC_OUTBOX_MAX_CHARS) throw new SyncOutboxError('capacity', 'The saved sync queue is too large. Local records were preserved.');
  return state;
}
export function enqueueSync(current: SyncOutboxState, raw: SyncEnqueue): SyncOutboxState {
  const state = validateSyncOutbox(current), input = validateSyncEnqueue(raw);
  if (!state.accounts[input.accountId] && Object.keys(state.accounts).length >= 8) throw new SyncOutboxError('capacity', 'Too many saved sync accounts. Disconnect an unused account before enrolling another.');
  const queue = state.accounts[input.accountId] ??= {revision: 0, pending: []};
  const batches: SyncRecord[][] = [];
  let batch: SyncRecord[] = [], size = 2;
  for (const value of input.records.filter(value => value.id !== 'state-head')) {
    const chars = JSON.stringify(value).length + (batch.length ? 1 : 0);
    if (batch.length && (batch.length === 25 || size + chars > SYNC_MUTATION_MAX_CHARS - 256)) {batches.push(batch); batch = []; size = 2;}
    batch.push(value); size += JSON.stringify(value).length + (batch.length > 1 ? 1 : 0);
  }
  if (batch.length) batches.push(batch);
  const head = input.records.find(value => value.id === 'state-head');
  if (head) batches.push([head]);
  const seed = Number.parseInt(input.mutationId.slice(-8), 16);
  for (const [index, values] of batches.entries()) {
    const mutationId = input.mutationId.slice(0, -8) + ((seed ^ index) >>> 0).toString(16).padStart(8, '0');
    if (queue.pending.some(value => value.mutationId === mutationId)) throw new SyncOutboxError('conflict', 'A sync identifier was reused. Local records were preserved.');
    const next: Pending = {mutationId, records: values, baseRevision: null, createdAt: input.now, attempts: 0, nextAttemptAt: input.now, leaseId: null, leaseUntil: 0, blocked: null};
    const tail = queue.pending.at(-1);
    // Only never-dispatched records can be superseded. Keep head publication
    // separate and after all changed entities, including across offline edits.
    let merged: SyncRecord[] | null = null;
    if (tail?.baseRevision === null && (tail.records.every(value => value.id !== 'state-head') && values.every(value => value.id !== 'state-head')
      || tail.records.length === 1 && tail.records[0].id === 'state-head' && values.length === 1 && values[0].id === 'state-head')) {
      const combined = new Map(tail.records.map(value => [value.id, value]));
      values.forEach(value => combined.set(value.id, value));
      if (combined.size <= 25 && JSON.stringify([...combined.values()]).length <= SYNC_MUTATION_MAX_CHARS - 256) merged = [...combined.values()];
    }
    if (merged) queue.pending[queue.pending.length - 1] = {...next, records: merged};
    else {
      if (queue.pending.length >= SYNC_QUEUE_MAX) throw new SyncOutboxError('capacity', 'The saved sync queue is full. Local records were preserved. Reconnect before saving another synced change.');
      queue.pending.push(next);
    }
  }
  return validateSyncOutbox(state);
}
export function invalidateSyncPending(current: SyncOutboxState, accountId?: string): SyncOutboxState {
  const state = validateSyncOutbox(current);
  if (accountId !== undefined) account(accountId);
  for (const [id, value] of Object.entries(state.accounts)) if (accountId === undefined || id === accountId) value.pending = [];
  return state;
}
export function claimSync(current: SyncOutboxState, input: SyncClaimInput): {state: SyncOutboxState; claim: SyncClaim | null} {
  account(input.accountId); uuid(input.leaseId); time(input.now);
  const leaseMs = input.leaseMs ?? 60_000;
  if (!integer(leaseMs) || leaseMs < 1000 || leaseMs > 300_000 || !integer(input.now + leaseMs)) throw bad();
  const state = validateSyncOutbox(current), queue = state.accounts[input.accountId], head = queue?.pending[0];
  if (!head || head.blocked || head.nextAttemptAt > input.now || head.leaseId && head.leaseUntil > input.now) return {state, claim: null};
  head.baseRevision ??= queue.revision;
  if (head.baseRevision !== queue.revision || !integer(head.attempts + 1)) throw bad();
  head.attempts++; head.leaseId = input.leaseId; head.leaseUntil = input.now + leaseMs;
  return {state, claim: {accountId: input.accountId, leaseId: input.leaseId, mutationId: head.mutationId, baseRevision: head.baseRevision, records: records(head.records)}};
}
export function acknowledgeSync(current: SyncOutboxState, input: SyncAckInput): {state: SyncOutboxState; accepted: boolean} {
  account(input.accountId); uuid(input.leaseId); uuid(input.mutationId);
  if (!integer(input.baseRevision) || !integer(input.revision) || input.revision !== input.baseRevision + 1) throw bad();
  const state = validateSyncOutbox(current), queue = state.accounts[input.accountId], head = queue?.pending[0];
  if (!head || head.mutationId !== input.mutationId || head.leaseId !== input.leaseId || head.baseRevision !== input.baseRevision || queue.revision !== input.baseRevision) return {state, accepted: false};
  queue.revision = input.revision; queue.pending.shift();
  return {state, accepted: true};
}
export function failSync(current: SyncOutboxState, input: SyncFailInput): SyncOutboxState {
  account(input.accountId); uuid(input.leaseId); uuid(input.mutationId); time(input.now);
  if (!reasons.includes(input.reason)) throw bad();
  const state = validateSyncOutbox(current), head = state.accounts[input.accountId]?.pending[0];
  if (!head || head.mutationId !== input.mutationId || head.leaseId !== input.leaseId) return state;
  head.leaseId = null; head.leaseUntil = 0;
  head.blocked = ['auth', 'conflict', 'rejected'].includes(input.reason) ? input.reason : null;
  const delay = Math.min(300_000, 1000 * 2 ** Math.min(9, Math.max(0, head.attempts - 1)));
  if (!integer(input.now + delay)) throw bad();
  head.nextAttemptAt = input.now + delay;
  return state;
}
export function setSyncRevision(current: SyncOutboxState, input: {accountId: string; revision: number; expectedRevision: number}): SyncOutboxState {
  account(input.accountId);
  if (!integer(input.revision) || !integer(input.expectedRevision)) throw bad();
  const state = validateSyncOutbox(current), queue = state.accounts[input.accountId] ?? {revision: 0, pending: []};
  if (queue.revision !== input.expectedRevision || input.revision < queue.revision || queue.pending[0]?.baseRevision !== undefined && queue.pending[0].baseRevision !== null) throw new SyncOutboxError('conflict', 'Saved sync changed while remote records were loading. Nothing was replaced.');
  if (!state.accounts[input.accountId] && Object.keys(state.accounts).length >= 8) throw bad();
  queue.revision = input.revision; state.accounts[input.accountId] = queue;
  return state;
}
export function resumeSyncAuth(current: SyncOutboxState, accountId: string): SyncOutboxState {
  account(accountId); const state = validateSyncOutbox(current), head = state.accounts[accountId]?.pending[0];
  if (head?.blocked === 'auth') {head.blocked = null; head.nextAttemptAt = 0;}
  return state;
}
export type SyncOutboxAdapter = {
  claimSync(input: SyncClaimInput): Promise<SyncClaim | null>;
  acknowledgeSync(input: SyncAckInput): Promise<boolean>;
  failSync(input: SyncFailInput): Promise<unknown>;
};
export class SyncTransportError extends Error {
  constructor(public reason: SyncFailureReason) {super('Account sync could not complete. Your local records were preserved.'); this.name = 'SyncTransportError';}
}
export type SyncFlushResult = {sent: number; state: 'idle' | 'synced' | 'retry' | 'auth' | 'conflict' | 'rejected' | 'cancelled'};
export function createSyncOutboxRunner(deps: {
  store: SyncOutboxAdapter;
  send: (request: SyncRequest, signal: AbortSignal, accountId: string) => Promise<{mutationId: string; revision: number; replayed: boolean}>;
  uuid: () => string;
  now?: () => number;
  timeoutMs?: number;
  isAccountActive: (accountId: string) => boolean;
}) {
  const now = deps.now ?? Date.now, timeoutMs = deps.timeoutMs ?? 20_000;
  if (!integer(timeoutMs) || timeoutMs < 10 || timeoutMs > 60_000) throw bad();
  let running: Promise<SyncFlushResult> | null = null, activeAccount: string | null = null;
  let active: AbortController | null = null;
  async function run(accountId: string): Promise<SyncFlushResult> {
    account(accountId); let sent = 0;
    for (let index = 0; index < 25; index++) {
      if (!deps.isAccountActive(accountId)) return {sent, state: 'cancelled'};
      const claim = await deps.store.claimSync({accountId, leaseId: deps.uuid(), now: now(), leaseMs: Math.max(1000, timeoutMs + 10_000)});
      if (!claim) return {sent, state: sent ? 'synced' : 'idle'};
      const controller = new AbortController(); active = controller;
      let timedOut = false, timer: ReturnType<typeof setTimeout> | undefined;
      try {
        if (!deps.isAccountActive(accountId)) {controller.abort(); throw new SyncTransportError('auth');}
        const request: SyncRequest = {mutationId: claim.mutationId, baseRevision: claim.baseRevision, records: claim.records};
        const response = await Promise.race([
          deps.send(request, controller.signal, accountId),
          new Promise<never>((_, reject) => {timer = setTimeout(() => {timedOut = true; controller.abort(); reject(new SyncTransportError('timeout'));}, timeoutMs);}),
          new Promise<never>((_, reject) => {controller.signal.addEventListener('abort', () => reject(new SyncTransportError(timedOut ? 'timeout' : 'network')), {once: true});}),
        ]);
        if (response.mutationId !== claim.mutationId || response.revision !== claim.baseRevision + 1 || typeof response.replayed !== 'boolean') throw new SyncTransportError('rejected');
        if (!deps.isAccountActive(accountId) || controller.signal.aborted) throw new SyncTransportError('auth');
        if (!await deps.store.acknowledgeSync({...claim, revision: response.revision})) return {sent, state: 'idle'};
        sent++;
      } catch (error) {
        const reason = timedOut ? 'timeout' : error instanceof SyncTransportError ? error.reason : 'network';
        await deps.store.failSync({accountId, leaseId: claim.leaseId, mutationId: claim.mutationId, now: now(), reason});
        return {sent, state: !deps.isAccountActive(accountId) || controller.signal.aborted && !timedOut ? 'cancelled' : reason === 'network' || reason === 'timeout' ? 'retry' : reason};
      } finally {if (timer !== undefined) clearTimeout(timer); if (active === controller) active = null;}
    }
    return {sent, state: 'synced'};
  }
  return {
    flush(accountId: string): Promise<SyncFlushResult> {
      if (running) return activeAccount === accountId ? running : running.then(() => this.flush(accountId));
      activeAccount = accountId;
      running = run(accountId).finally(() => {running = null; activeAccount = null;});
      return running;
    },
    cancel() {active?.abort();},
  };
}
