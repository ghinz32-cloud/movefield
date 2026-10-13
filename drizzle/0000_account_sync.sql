CREATE TABLE `daily_ai_feedback` (
	`owner_id` text NOT NULL,
	`request_id` text NOT NULL,
	`workout_id` text NOT NULL,
	`digest` text NOT NULL,
	`metrics_json` text NOT NULL,
	`completed_at` text NOT NULL,
	`status` text NOT NULL,
	`feedback` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`lease_token` text,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` integer DEFAULT 0 NOT NULL,
	`error_code` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`owner_id`, `request_id`),
	CONSTRAINT "daily_feedback_status" CHECK("daily_ai_feedback"."status" IN ('pending', 'processing', 'complete', 'failed')),
	CONSTRAINT "daily_feedback_attempts" CHECK("daily_ai_feedback"."attempts" BETWEEN 0 AND 3),
	CONSTRAINT "daily_feedback_saved_text" CHECK(("daily_ai_feedback"."status" = 'complete' AND "daily_ai_feedback"."feedback" IS NOT NULL) OR ("daily_ai_feedback"."status" != 'complete' AND "daily_ai_feedback"."feedback" IS NULL))
);
--> statement-breakpoint
CREATE INDEX `daily_feedback_owner_created` ON `daily_ai_feedback` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `sync_accounts` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "sync_accounts_revision" CHECK("sync_accounts"."revision" >= 0)
);
--> statement-breakpoint
CREATE TABLE `sync_receipts` (
	`owner_id` text NOT NULL,
	`mutation_id` text NOT NULL,
	`digest` text NOT NULL,
	`revision` integer NOT NULL,
	`applied` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`owner_id`, `mutation_id`),
	CONSTRAINT "sync_receipts_revision" CHECK("sync_receipts"."revision" > 0),
	CONSTRAINT "sync_receipts_applied" CHECK("sync_receipts"."applied" IN (0, 1))
);
--> statement-breakpoint
CREATE TABLE `sync_records` (
	`owner_id` text NOT NULL,
	`record_id` text NOT NULL,
	`revision` integer NOT NULL,
	`ciphertext` text,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`owner_id`, `record_id`),
	CONSTRAINT "sync_records_revision" CHECK("sync_records"."revision" > 0)
);
--> statement-breakpoint
CREATE INDEX `sync_records_owner_revision` ON `sync_records` (`owner_id`,`revision`,`record_id`);