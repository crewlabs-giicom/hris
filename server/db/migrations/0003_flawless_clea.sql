CREATE TABLE `team_has_users` (
	`team_id` int NOT NULL,
	`user_id` int NOT NULL,
	CONSTRAINT `team_has_users_team_id_user_id_pk` PRIMARY KEY(`team_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `resignation_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resignation_id` int NOT NULL,
	`asset_id` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resignation_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resignation_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resignation_id` int NOT NULL,
	`task` text NOT NULL,
	`type` enum('soft copy','hard copy') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resignation_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resignations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`resignation_date` date NOT NULL,
	`resignation_type` varchar(100) NOT NULL,
	`resignation_reason` text NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`created_by` int,
	`updated_by` int,
	`deleted_by` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `resignations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `employees` DROP FOREIGN KEY `employees_team_id_teams_id_fk`;
--> statement-breakpoint
ALTER TABLE `employee_paid_leaves` MODIFY COLUMN `valid_from` date NOT NULL;--> statement-breakpoint
ALTER TABLE `employee_paid_leaves` MODIFY COLUMN `valid_to` date NOT NULL;--> statement-breakpoint
ALTER TABLE `employee_paid_leaves` ADD `person_responsible_id` int;--> statement-breakpoint
ALTER TABLE `team_has_users` ADD CONSTRAINT `team_has_users_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_has_users` ADD CONSTRAINT `team_has_users_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resignation_assets` ADD CONSTRAINT `resignation_assets_resignation_id_resignations_id_fk` FOREIGN KEY (`resignation_id`) REFERENCES `resignations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resignation_tasks` ADD CONSTRAINT `resignation_tasks_resignation_id_resignations_id_fk` FOREIGN KEY (`resignation_id`) REFERENCES `resignations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resignations` ADD CONSTRAINT `resignations_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resignations` ADD CONSTRAINT `resignations_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resignations` ADD CONSTRAINT `resignations_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resignations` ADD CONSTRAINT `resignations_deleted_by_users_id_fk` FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `resignation_assets_resignation_idx` ON `resignation_assets` (`resignation_id`);--> statement-breakpoint
CREATE INDEX `resignation_tasks_resignation_idx` ON `resignation_tasks` (`resignation_id`);--> statement-breakpoint
CREATE INDEX `resignations_employee_idx` ON `resignations` (`employee_id`);--> statement-breakpoint
CREATE INDEX `resignations_status_idx` ON `resignations` (`status`);--> statement-breakpoint
ALTER TABLE `employee_paid_leaves` ADD CONSTRAINT `employee_paid_leaves_person_responsible_id_employees_id_fk` FOREIGN KEY (`person_responsible_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` DROP COLUMN `team_id`;--> statement-breakpoint
ALTER TABLE `employee_paid_leaves` DROP COLUMN `person_responsible`;