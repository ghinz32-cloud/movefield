import {cloudAccount, cloudRequest, CloudError} from './cloud-client';
import type {CloudKey} from './cloud-envelope';
import {createSyncOutboxRunner, SyncTransportError, type SyncOutboxAdapter, type SyncOutboxState, type SyncEnqueue} from './sync-outbox';
import type {State} from './training';

export type CloudSyncStore = SyncOutboxAdapter & {
  syncSnapshot(): Promise<SyncOutboxState>;
  setSyncRevision(input: {accountId: string; revision: number; expectedRevision: number}): Promise<unknown>;
  reconcileSync(input: {accountId: string; revision: number; expected: SyncOutboxState}): Promise<void>;
  resumeSyncAuth(accountId: string): Promise<unknown>;
  clearSync(accountId?: string): Promise<unknown>;
};
type Session = {accountId: string; key: CloudKey; digests: Map<string, string>; generation: number};
type Candidate = {accountId: string; key: CloudKey; revision: number; remote: State | null; digests: Map<string, string>};
export function createBrowserCloudSync(store: () => CloudSyncStore) {
  let session: Session | null = null, generation = 0, message = 'Account sync is off.', busy = false;
  let candidate: Candidate | null = null, controller: AbortController | null = null;
  const listeners = new Set<() => void>(); let snapshot = {active: false, busy, message};
  const notify = () => { snapshot = {active: !!session, busy, message}; listeners.forEach(fn => fn()); };
  const runner = createSyncOutboxRunner({
    store: {claimSync: input => store().claimSync(input), acknowledgeSync: input => store().acknowledgeSync(input), failSync: input => store().failSync(input)},
    uuid: () => crypto.randomUUID(), isAccountActive: id => session?.accountId === id,
    send: async (request, signal, accountId) => {
      const account = await cloudAccount(signal); if (account.userId !== accountId) throw new SyncTransportError('auth');
      try { return await cloudRequest('/api/sync', request, signal, accountId); }
      catch (error) { throw new SyncTransportError(error instanceof CloudError && error.status === 409 ? 'conflict' : error instanceof CloudError && [401, 403].includes(error.status) ? 'auth' : error instanceof CloudError && [400, 413, 415, 507].includes(error.status) ? 'rejected' : 'network'); }
    },
  });
  async function flush() {
    if (!session) return; const current = session; busy = true; notify();
    try {
      const result = await runner.flush(current.accountId); if (session !== current) return;
      const queue = await store().syncSnapshot(); if (session !== current) return;
      const pending = queue.accounts[current.accountId]?.pending.length ?? 0;
      message = result.state === 'conflict' ? 'The account changed on another device. Lock sync and review both copies before reconnecting.'
        : result.state === 'auth' ? 'Sign in again before syncing. Your local queue is retained.'
        : result.state === 'rejected' ? 'The account cannot accept this snapshot. Your local records and queue are retained; export a transfer file.'
        : pending ? 'Changes are saved locally and queued. They will retry when this account is connected.' : 'Account snapshot is synced.';
    } catch (error) { if (session === current) message = error instanceof Error ? error.message : 'Sync paused. Your local records are retained.'; }
    finally { if (session === current) { busy = false; notify(); } }
  }
  return {
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }, getSnapshot: () => snapshot,
    async unlock(password: string): Promise<State | null> {
      if (busy) throw new Error('Wait for the current account request.');
      const token = ++generation, abort = new AbortController(); controller = abort; session = null; runner.cancel(); candidate = null;
      busy = true; message = 'Opening the encrypted account snapshot…'; notify();
      try {
        const account = await cloudAccount(abort.signal); if (!account.syncAvailable) throw new Error('Account sync is unavailable on this host. Local saving still works.');
        const {cloudKey, cloudSalt, assembleCloudState} = await import('./cloud-envelope');
        const records = new Map<string, string>(); let cursor = '0', pages = 0, revision = account.revision;
        do {
          const page = await cloudRequest<{revision: number; records: {id: string; ciphertext: string | null; revision: number}[]; nextCursor: string; hasMore: boolean}>('/api/sync?cursor=' + encodeURIComponent(cursor), undefined, abort.signal, account.userId);
          if (!Array.isArray(page.records) || typeof page.nextCursor !== 'string' || typeof page.hasMore !== 'boolean' || !Number.isSafeInteger(page.revision) || page.revision < 0 || page.records.length > 25 || (pages && page.revision !== revision)) throw new Error('The account download was incomplete. Nothing was replaced.');
          revision = page.revision;
          for (const row of page.records) {
            if (!row || typeof row.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(row.id) || !Number.isSafeInteger(row.revision) || row.revision < 1 || row.revision > revision || records.has(row.id)) throw new Error('Invalid encrypted account response.');
            if (row.ciphertext !== null) { if (typeof row.ciphertext !== 'string' || row.ciphertext.length > 1_000_000) throw new Error('Invalid encrypted account response.'); records.set(row.id, row.ciphertext); }
          }
          if (!page.hasMore) break; if (page.nextCursor === cursor || ++pages > 250) throw new Error('The account download could not complete safely.'); cursor = page.nextCursor;
        } while (true);
        const outbox = await store().syncSnapshot(), queued = outbox.accounts[account.userId]?.pending.flatMap(row => row.records).find(row => row.ciphertext !== null)?.ciphertext;
        const head = records.get('state-head'), salt = head ? cloudSalt(head) : queued ? cloudSalt(queued) : undefined;
        const key = await cloudKey(password, salt), opened = head ? await assembleCloudState(records, key, account.userId) : null;
        const latest = await cloudAccount(abort.signal);
        if (latest.userId !== account.userId || latest.revision !== revision) throw new Error('The account changed while its snapshot was opening. Nothing was replaced. Unlock again.');
        if (token !== generation || abort.signal.aborted) throw new Error('Account opening cancelled.');
        candidate = {accountId: account.userId, key, revision, remote: opened?.state ?? null, digests: opened?.digests ?? new Map()};
        message = head ? 'Review the account copy before choosing which training to keep.' : 'No account snapshot exists yet. Choose this device’s training to begin sync.'; notify(); return candidate.remote;
      } catch (error) { if (token === generation) message = error instanceof Error ? error.message : 'Account opening failed. Local records are retained.'; throw error; }
      finally { if (token === generation) { busy = false; controller = null; notify(); } }
    },
    async activate(state: State) {
      if (busy) throw new Error('Wait for the current account request.'); if (!candidate) throw new Error('Unlock your account first.');
      const selected = candidate, token = generation, abort = new AbortController(); controller = abort; busy = true; notify();
      const current = () => candidate === selected && token === generation && !abort.signal.aborted;
      try {
        const account = await cloudAccount(abort.signal);
        if (account.userId !== selected.accountId || account.revision !== selected.revision) throw new Error('The account changed after review. Unlock it again before choosing a copy.');
        if (!current()) throw new Error('Account activation cancelled.');
        // Verify the chosen state before discarding a retained queue. The chosen
        // copy is already durable locally when the UI reaches this operation.
        const {cloudRecords} = await import('./cloud-envelope');
        await cloudRecords(state, selected.key, selected.accountId, selected.digests);
        const expected = await store().syncSnapshot(); if (!current()) throw new Error('Account activation cancelled.');
        await store().reconcileSync({accountId: selected.accountId, revision: selected.revision, expected});
        if (!current()) throw new Error('Account activation cancelled.');
        session = {accountId: selected.accountId, key: selected.key, digests: selected.digests, generation: ++generation}; candidate = null;
        message = 'Encrypted account sync is unlocked for this session.';
      } catch (error) { if (current()) message = error instanceof Error ? error.message : 'Sync could not be enabled. Local records are retained.'; throw error; }
      finally { if (controller === abort) { controller = null; busy = false; notify(); } }
    },
    async prepare(state: State): Promise<{sync: SyncEnqueue; committed: () => void} | undefined> {
      const current = session; if (!current) return;
      const {cloudRecords} = await import('./cloud-envelope');
      const encoded = await cloudRecords(state, current.key, current.accountId, current.digests);
      if (session !== current || !encoded.records.length) return;
      return {sync: {accountId: current.accountId, mutationId: crypto.randomUUID(), records: encoded.records, now: Date.now()}, committed: () => { if (session === current) { current.digests = encoded.digests; void flush(); } }};
    },
    flush,
    disconnect() { generation++; controller?.abort(); controller = null; runner.cancel(); session = null; candidate = null; busy = false; message = 'Account sync is off. Queued encrypted changes stay on this device until you review and unlock the same account.'; notify(); },
  };
}
export type BrowserCloudSync = ReturnType<typeof createBrowserCloudSync>;
