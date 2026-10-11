CREATE TABLE `auth_account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_owner` ON `auth_account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `provider_identity` ON `auth_account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE TABLE `cloud_operation` (
	`owner_id` text NOT NULL,
	`operation_id` text NOT NULL,
	`expected_revision` integer NOT NULL,
	`digest` text NOT NULL,
	`revision` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`owner_id`, `operation_id`)
);
--> statement-breakpoint
CREATE TABLE `cloud_profile` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`object_key` text,
	`digest` text,
	`vault_id` text,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`consent_version` integer DEFAULT 0 NOT NULL,
	`ai_consent` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cloud_quota` (
	`owner_id` text NOT NULL,
	`day` text NOT NULL,
	`kind` text NOT NULL,
	`count` integer NOT NULL,
	PRIMARY KEY(`owner_id`, `day`, `kind`)
);
--> statement-breakpoint
CREATE TABLE `coaching_job` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`context_digest` text NOT NULL,
	`revision` integer NOT NULL,
	`consent_version` integer NOT NULL,
	`status` text NOT NULL,
	`input` text NOT NULL,
	`output` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `jobs_owner` ON `coaching_job` (`owner_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `job_dedupe` ON `coaching_job` (`owner_id`,`context_digest`,`revision`,`consent_version`);--> statement-breakpoint
CREATE TABLE `auth_rate_limit` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_rate_limit_key_unique` ON `auth_rate_limit` (`key`);--> statement-breakpoint
CREATE TABLE `auth_session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_session_token_unique` ON `auth_session` (`token`);--> statement-breakpoint
CREATE INDEX `session_owner` ON `auth_session` (`user_id`);--> statement-breakpoint
CREATE TABLE `auth_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_user_email_unique` ON `auth_user` (`email`);--> statement-breakpoint
CREATE TABLE `auth_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier` ON `auth_verification` (`identifier`);