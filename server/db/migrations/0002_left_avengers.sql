CREATE TABLE `employee_paid_leaves` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`paid_leave_type` enum('cuti tahunan','cuti khusus') NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`valid_from` datetime NOT NULL,
	`valid_to` datetime NOT NULL,
	`paid_leave_count` int NOT NULL,
	`day_off_count` int NOT NULL,
	`description` text NOT NULL,
	`person_responsible` varchar(255),
	`task` text,
	`address` text,
	`created_by` int,
	`updated_by` int,
	`deleted_by` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `employee_paid_leaves_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `employee_paid_leaves` ADD CONSTRAINT `employee_paid_leaves_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_paid_leaves` ADD CONSTRAINT `employee_paid_leaves_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_paid_leaves` ADD CONSTRAINT `employee_paid_leaves_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_paid_leaves` ADD CONSTRAINT `employee_paid_leaves_deleted_by_users_id_fk` FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `employee_paid_leaves_employee_idx` ON `employee_paid_leaves` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_paid_leaves_status_idx` ON `employee_paid_leaves` (`status`);