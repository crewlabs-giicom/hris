CREATE TABLE `team_has_users` (
	`team_id` int NOT NULL,
	`user_id` int NOT NULL,
	CONSTRAINT `team_has_users_team_id_user_id_pk` PRIMARY KEY(`team_id`,`user_id`)
);--> statement-breakpoint
ALTER TABLE `team_has_users` ADD CONSTRAINT `team_has_users_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_has_users` ADD CONSTRAINT `team_has_users_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Copy existing team relation data from employees to team_has_users
INSERT INTO `team_has_users` (`team_id`, `user_id`)
SELECT `team_id`, `user_id` FROM `employees`
WHERE `team_id` IS NOT NULL AND `user_id` IS NOT NULL;--> statement-breakpoint

-- Drop the team_id column and foreign key from employees
ALTER TABLE `employees` DROP FOREIGN KEY `employees_team_id_teams_id_fk`;--> statement-breakpoint
ALTER TABLE `employees` DROP COLUMN `team_id`;
