CREATE TABLE `workout_ai_coaching` (
	`owner_id` text NOT NULL,
	`request_id` text NOT NULL,
	`workout_id` text NOT NULL,
	`policy` text NOT NULL,
	`context_digest` text NOT NULL,
	`context_json` text,
	`reply_json` text,
	`provider_model` text NOT NULL,
	`provider_digest` text NOT NULL,
	`status` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`lease_token` text,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` integer DEFAULT 0 NOT NULL,
	`error_code` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`owner_id`, `request_id`),
	CONSTRAINT "coaching_status" CHECK("workout_ai_coaching"."status" IN ('pending', 'processing', 'complete', 'failed', 'cancelled')),
	CONSTRAINT "coaching_attempts" CHECK("workout_ai_coaching"."attempts" BETWEEN 0 AND 3),
	CONSTRAINT "coaching_saved_reply" CHECK(("workout_ai_coaching"."status" = 'complete' AND "workout_ai_coaching"."reply_json" IS NOT NULL) OR ("workout_ai_coaching"."status" != 'complete' AND "workout_ai_coaching"."reply_json" IS NULL)),
	CONSTRAINT "coaching_context_lifetime" CHECK(("workout_ai_coaching"."status" IN ('pending', 'processing') AND "workout_ai_coaching"."context_json" IS NOT NULL) OR ("workout_ai_coaching"."status" IN ('complete', 'failed', 'cancelled') AND "workout_ai_coaching"."context_json" IS NULL))
);
--> statement-breakpoint
CREATE INDEX `coaching_owner_created` ON `workout_ai_coaching` (`owner_id`,`created_at`);