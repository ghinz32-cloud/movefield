export const AI_OUTSTANDING_CAPACITY_SQL = `((SELECT COUNT(*) FROM daily_ai_feedback WHERE owner_id = ? AND status IN ('pending', 'processing'))
  + (SELECT COUNT(*) FROM workout_ai_coaching WHERE owner_id = ? AND status IN ('pending', 'processing'))) < 4`;
export const AI_CAPACITY_SQL = `
  ((SELECT COUNT(*) FROM daily_ai_feedback WHERE owner_id = ? AND created_at >= ?)
    + (SELECT COUNT(*) FROM workout_ai_coaching WHERE owner_id = ? AND created_at >= ?)) < 12
  AND ${AI_OUTSTANDING_CAPACITY_SQL}`;

export function aiCapacityBindings(owner: string, now: number): [string, number, string, number, string, string] {
  return [owner, now - 86_400_000, owner, now - 86_400_000, owner, owner];
}

export async function expireAbandonedAiJobs(db: D1DatabaseSession, owner: string, now: number): Promise<void> {
  await db.batch([
    db.prepare(`UPDATE daily_ai_feedback SET status = 'failed', metrics_json = '[]', error_code = 'feedback_request_expired',
      lease_token = NULL, lease_until = 0, updated_at = ? WHERE owner_id = ? AND status IN ('pending', 'processing')
      AND created_at < ? AND lease_until <= ?`).bind(now, owner, now - 86_400_000, now),
    db.prepare(`UPDATE workout_ai_coaching SET status = 'failed', context_json = NULL, error_code = 'coaching_request_expired',
      lease_token = NULL, lease_until = 0, updated_at = ? WHERE owner_id = ? AND status IN ('pending', 'processing')
      AND created_at < ? AND lease_until <= ?`).bind(now, owner, now - 86_400_000, now),
  ]);
}
