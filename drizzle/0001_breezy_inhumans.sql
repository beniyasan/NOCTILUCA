CREATE TABLE `transaction_guards` (
	`player_id` text PRIMARY KEY NOT NULL,
	`valid` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "guard_valid" CHECK("transaction_guards"."valid"=1)
);
