import { ApiError, digestJson, jsonResponse, MAX_REQUEST_BYTES, readJson, syncMutationSchema } from "./contracts";

type Receipt = { digest: string; revision: number; applied: number };
type RecordRow = { record_id: string; revision: number; ciphertext: string | null };
const MAX_ACCOUNT_BYTES = 100_000_000;

export async function accountRevision(db: D1DatabaseSession, owner: string): Promise<number> {
  return (await db.prepare("SELECT revision FROM sync_accounts WHERE owner_id = ?").bind(owner).first<{ revision: number }>())?.revision ?? 0;
}

export async function pushSync(request: Request, db: D1DatabaseSession, owner: string): Promise<Response> {
  const parsed = syncMutationSchema.safeParse(await readJson(request, MAX_REQUEST_BYTES));
  if (!parsed.success) throw new ApiError(400, "invalid_payload");
  const mutation = parsed.data;
  const digest = await digestJson(mutation);
  const prior = await db.prepare("SELECT digest, revision, applied FROM sync_receipts WHERE owner_id = ? AND mutation_id = ?").bind(owner, mutation.mutationId).first<Receipt>();
  if (prior) return receiptResponse(prior, mutation.mutationId, digest, true);
  const now = Date.now();
  const receivedBytes = mutation.records.reduce((sum, record) => sum + (record.ciphertext?.length ?? 0), 0);
  const receipt = `EXISTS (SELECT 1 FROM sync_receipts WHERE owner_id = ? AND mutation_id = ? AND digest = ? AND applied = 0)`;
  const statements: D1PreparedStatement[] = [
    db.prepare("INSERT INTO sync_accounts(owner_id, revision) VALUES (?, 0) ON CONFLICT(owner_id) DO NOTHING").bind(owner),
    db.prepare(`INSERT INTO sync_receipts(owner_id, mutation_id, digest, revision, applied, created_at)
      SELECT ?, ?, ?, ?, 0, ? FROM sync_accounts WHERE owner_id = ? AND revision = ?
      AND (SELECT COUNT(*) FROM sync_receipts WHERE owner_id = ?) < 100000
      AND (SELECT COUNT(*) FROM sync_records WHERE owner_id = ?) + ? <= 10000
      AND COALESCE((SELECT SUM(LENGTH(ciphertext)) FROM sync_records WHERE owner_id = ?), 0) + ? <= ?
      ON CONFLICT(owner_id, mutation_id) DO NOTHING`).bind(owner, mutation.mutationId, digest, mutation.baseRevision + 1, now, owner, mutation.baseRevision, owner, owner, mutation.records.length, owner, receivedBytes, MAX_ACCOUNT_BYTES),
  ];
  for (const record of mutation.records) {
    statements.push(db.prepare(`INSERT INTO sync_records(owner_id, record_id, revision, ciphertext, updated_at)
      SELECT ?, ?, ?, ?, ? WHERE ${receipt}
      ON CONFLICT(owner_id, record_id) DO UPDATE SET revision = excluded.revision, ciphertext = excluded.ciphertext, updated_at = excluded.updated_at`)
      .bind(owner, record.id, mutation.baseRevision + 1, record.ciphertext, now, owner, mutation.mutationId, digest));
  }
  statements.push(
    db.prepare(`UPDATE sync_accounts SET revision = revision + 1 WHERE owner_id = ? AND revision = ? AND ${receipt}`).bind(owner, mutation.baseRevision, owner, mutation.mutationId, digest),
    db.prepare(`UPDATE sync_receipts SET applied = 1 WHERE owner_id = ? AND mutation_id = ? AND digest = ? AND applied = 0
      AND revision = (SELECT revision FROM sync_accounts WHERE owner_id = ?)`).bind(owner, mutation.mutationId, digest, owner),
  );
  const result = await db.batch(statements);
  const committed = await db.prepare("SELECT digest, revision, applied FROM sync_receipts WHERE owner_id = ? AND mutation_id = ?").bind(owner, mutation.mutationId).first<Receipt>();
  if (committed) return receiptResponse(committed, mutation.mutationId, digest, result[1].meta.changes === 0);
  const revision = await accountRevision(db, owner);
  if (revision !== mutation.baseRevision) return jsonResponse({ error: "revision_conflict", revision }, 409);
  throw new ApiError(507, "account_capacity_reached");
}

function receiptResponse(receipt: Receipt, mutationId: string, digest: string, replayed: boolean): Response {
  if (receipt.digest !== digest) throw new ApiError(409, "idempotency_conflict");
  if (receipt.applied !== 1) throw new ApiError(503, "commit_not_confirmed");
  return jsonResponse({ mutationId, revision: receipt.revision, replayed });
}

type Cursor = { revision: number; id: string; through: number };
function parseCursor(value: string, latest: number): Cursor {
  if (value === "0") return { revision: 0, id: "", through: latest };
  if (value.length > 700) throw new ApiError(400, "invalid_cursor");
  let cursor: unknown;
  try { cursor = JSON.parse(atob(value)); } catch { throw new ApiError(400, "invalid_cursor"); }
  if (!cursor || typeof cursor !== "object" || Array.isArray(cursor)) throw new ApiError(400, "invalid_cursor");
  const row = cursor as Record<string, unknown>;
  if (Object.keys(row).sort().join() !== "id,revision,through" || !Number.isSafeInteger(row.revision) || !Number.isSafeInteger(row.through)
    || (row.revision as number) < 0 || (row.through as number) < (row.revision as number) || (row.through as number) > latest
    || typeof row.id !== "string" || row.id.length > 128 || (row.id !== "" && !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(row.id))) throw new ApiError(400, "invalid_cursor");
  return row as Cursor;
}

export async function pullSync(request: Request, db: D1DatabaseSession, owner: string): Promise<Response> {
  const latest = await accountRevision(db, owner);
  const cursor = parseCursor(new URL(request.url).searchParams.get("cursor") ?? "0", latest);
  const query = await db.prepare(`SELECT record_id, revision, ciphertext FROM sync_records WHERE owner_id = ? AND revision <= ?
    AND (revision > ? OR (revision = ? AND record_id > ?)) ORDER BY revision, record_id LIMIT 26`)
    .bind(owner, cursor.through, cursor.revision, cursor.revision, cursor.id).all<RecordRow>();
  const records: { id: string; revision: number; ciphertext: string | null }[] = [];
  let bytes = 0;
  for (const row of query.results) {
    const size = (row.ciphertext?.length ?? 0) + 1_000;
    if (records.length === 25 || bytes + size > MAX_REQUEST_BYTES) break;
    records.push({ id: row.record_id, revision: row.revision, ciphertext: row.ciphertext }); bytes += size;
  }
  const last = records.at(-1);
  const nextCursor = btoa(JSON.stringify(last ? { revision: last.revision, id: last.id, through: cursor.through } : cursor));
  return jsonResponse({ revision: cursor.through, records, nextCursor, hasMore: query.results.length > records.length });
}
