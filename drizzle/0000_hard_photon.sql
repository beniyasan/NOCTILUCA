CREATE TABLE IF NOT EXISTS `app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `checkpoints` (
	`player_id` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`state_json` text NOT NULL,
	`saved_at` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "checkpoint_json" CHECK(json_valid("checkpoints"."state_json"))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `journeys` (
	`player_id` text PRIMARY KEY NOT NULL,
	`schema_version` integer NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`state_json` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "journey_schema" CHECK("journeys"."schema_version"=1),
	CONSTRAINT "journey_revision" CHECK("journeys"."revision">=0),
	CONSTRAINT "journey_json" CHECK(json_valid("journeys"."state_json"))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `players` (
	`id` text PRIMARY KEY NOT NULL,
	`identity_key` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `players_identity_key_unique` ON `players` (`identity_key`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `command_receipts` (
	`player_id` text NOT NULL,
	`request_id` text NOT NULL,
	`request_hash` text NOT NULL,
	`expected_revision` integer NOT NULL,
	`outcome_json` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`player_id`, `request_id`),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "receipt_json" CHECK(json_valid("command_receipts"."outcome_json"))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `receipts_by_time` ON `command_receipts` (`player_id`,`created_at`);
--> statement-breakpoint
INSERT OR IGNORE INTO app_meta(key,value) VALUES('schema_version','1');
