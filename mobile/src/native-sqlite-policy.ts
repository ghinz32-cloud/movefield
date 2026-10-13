// Expo's exclusive transaction opens a fresh native connection, then BEGIN,
// before invoking the callback. The native build must supply synchronous=EXTRA
// as the connection default. Never attempt to change it inside a transaction.
type PolicySql = {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
};

export async function assertNativeSqliteModes(db: PolicySql, failure: () => Error): Promise<void> {
  try {
    const journal = await db.getFirstAsync<{journal_mode: unknown}>('PRAGMA journal_mode');
    const synchronous = await db.getFirstAsync<{synchronous: unknown}>('PRAGMA synchronous');
    if (journal?.journal_mode !== 'delete' || synchronous?.synchronous !== 3) throw failure();
  } catch { throw failure(); }
}

export async function prepareNativeSqlite(db: PolicySql, failure: () => Error): Promise<void> {
  try {
    // SQLite returns the effective mode, including the old mode if conversion
    // is refused. Existing WAL content is checkpointed by SQLite itself; never
    // remove journal files or rewrite encrypted records to perform migration.
    const journal = await db.getFirstAsync<{journal_mode: unknown}>('PRAGMA journal_mode = DELETE');
    if (journal?.journal_mode !== 'delete') throw failure();
    await db.execAsync('PRAGMA synchronous = EXTRA');
    await assertNativeSqliteModes(db, failure);
  } catch { throw failure(); }
}
