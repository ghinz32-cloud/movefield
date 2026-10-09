import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const syncAccounts = sqliteTable("sync_accounts", {
  ownerId: text("owner_id").primaryKey(),
  revision: integer("revision").notNull().default(0),
}, (table) => [check("sync_accounts_revision", sql`${table.revision} >= 0`)]);
export const syncRecords = sqliteTable("sync_records", {
  ownerId: text("owner_id").notNull(), recordId: text("record_id").notNull(),
  revision: integer("revision").notNull(), ciphertext: text("ciphertext"), updatedAt: integer("updated_at").notNull(),
}, (table) => [primaryKey({ columns: [table.ownerId, table.recordId] }), index("sync_records_owner_revision").on(table.ownerId, table.revision, table.recordId), check("sync_records_revision", sql`${table.revision} > 0`)]);
export const syncReceipts = sqliteTable("sync_receipts", {
  ownerId: text("owner_id").notNull(), mutationId: text("mutation_id").notNull(), digest: text("digest").notNull(),
  revision: integer("revision").notNull(), applied: integer("applied").notNull().default(0), createdAt: integer("created_at").notNull(),
}, (table) => [primaryKey({ columns: [table.ownerId, table.mutationId] }), check("sync_receipts_revision", sql`${table.revision} > 0`), check("sync_receipts_applied", sql`${table.applied} IN (0, 1)`)]);
export const dailyAiFeedback = sqliteTable("daily_ai_feedback", {
  ownerId: text("owner_id").notNull(), requestId: text("request_id").notNull(), workoutId: text("workout_id").notNull(),
  digest: text("digest").notNull(), metricsJson: text("metrics_json").notNull(), completedAt: text("completed_at").notNull(),
  status: text("status", { enum: ["pending", "processing", "complete", "failed"] }).notNull(), feedback: text("feedback"),
  attempts: integer("attempts").notNull().default(0), leaseToken: text("lease_token"), leaseUntil: integer("lease_until").notNull().default(0),
  nextAttemptAt: integer("next_attempt_at").notNull().default(0), errorCode: text("error_code"),
  createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(),
}, (table) => [primaryKey({ columns: [table.ownerId, table.requestId] }), index("daily_feedback_owner_created").on(table.ownerId, table.createdAt),
  check("daily_feedback_status", sql`${table.status} IN ('pending', 'processing', 'complete', 'failed')`),
  check("daily_feedback_attempts", sql`${table.attempts} BETWEEN 0 AND 3`),
  check("daily_feedback_saved_text", sql`(${table.status} = 'complete' AND ${table.feedback} IS NOT NULL) OR (${table.status} != 'complete' AND ${table.feedback} IS NULL)`),
]);

export const workoutAiCoaching = sqliteTable("workout_ai_coaching", {
  ownerId: text("owner_id").notNull(), requestId: text("request_id").notNull(), workoutId: text("workout_id").notNull(),
  policy: text("policy").notNull(), contextDigest: text("context_digest").notNull(), contextJson: text("context_json"), replyJson: text("reply_json"),
  providerModel: text("provider_model").notNull(), providerDigest: text("provider_digest").notNull(),
  status: text("status", { enum: ["pending", "processing", "complete", "failed", "cancelled"] }).notNull(),
  attempts: integer("attempts").notNull().default(0), leaseToken: text("lease_token"), leaseUntil: integer("lease_until").notNull().default(0),
  nextAttemptAt: integer("next_attempt_at").notNull().default(0), errorCode: text("error_code"),
  createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(),
}, (table) => [primaryKey({ columns: [table.ownerId, table.requestId] }), index("coaching_owner_created").on(table.ownerId, table.createdAt),
  check("coaching_status", sql`${table.status} IN ('pending', 'processing', 'complete', 'failed', 'cancelled')`),
  check("coaching_attempts", sql`${table.attempts} BETWEEN 0 AND 3`),
  check("coaching_saved_reply", sql`(${table.status} = 'complete' AND ${table.replyJson} IS NOT NULL) OR (${table.status} != 'complete' AND ${table.replyJson} IS NULL)`),
  check("coaching_context_lifetime", sql`(${table.status} IN ('pending', 'processing') AND ${table.contextJson} IS NOT NULL) OR (${table.status} IN ('complete', 'failed', 'cancelled') AND ${table.contextJson} IS NULL)`),
]);
