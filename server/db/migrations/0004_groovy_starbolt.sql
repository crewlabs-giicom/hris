CREATE TABLE `manual_attendance_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`manual_attendance_id` int NOT NULL,
	`attachment` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manual_attendance_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `manual_attendances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`manual_attendance_type` varchar(100) NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`clock_in` varchar(10),
	`clock_out` varchar(10),
	`is_late` int NOT NULL DEFAULT 0,
	`free_attendances` varchar(10) NOT NULL DEFAULT 'No',
	`description` text,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`created_by` int,
	`updated_by` int,
	`deleted_by` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `manual_attendances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedule_adjustment` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`shift_id` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`is_off` int NOT NULL DEFAULT 0,
	`adjustment_date` date NOT NULL,
	`created_by` int,
	`updated_by` int,
	`deleted_by` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `schedule_adjustment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`shift_id` int NOT NULL,
	`is_fix` int NOT NULL DEFAULT 0,
	`is_off` int NOT NULL DEFAULT 0,
	`valid_from` date NOT NULL,
	`valid_to` date NOT NULL,
	`created_by` int,
	`updated_by` int,
	`deleted_by` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `schedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `manual_attendance_attachments` ADD CONSTRAINT `manual_attendance_attachments_manual_attendance_id_manual_attendances_id_fk` FOREIGN KEY (`manual_attendance_id`) REFERENCES `manual_attendances`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `manual_attendances` ADD CONSTRAINT `manual_attendances_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `manual_attendances` ADD CONSTRAINT `manual_attendances_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `manual_attendances` ADD CONSTRAINT `manual_attendances_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `manual_attendances` ADD CONSTRAINT `manual_attendances_deleted_by_users_id_fk` FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedule_adjustment` ADD CONSTRAINT `schedule_adjustment_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedule_adjustment` ADD CONSTRAINT `schedule_adjustment_shift_id_shift_id_fk` FOREIGN KEY (`shift_id`) REFERENCES `shift`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedule_adjustment` ADD CONSTRAINT `schedule_adjustment_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedule_adjustment` ADD CONSTRAINT `schedule_adjustment_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedule_adjustment` ADD CONSTRAINT `schedule_adjustment_deleted_by_users_id_fk` FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedule` ADD CONSTRAINT `schedule_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedule` ADD CONSTRAINT `schedule_shift_id_shift_id_fk` FOREIGN KEY (`shift_id`) REFERENCES `shift`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedule` ADD CONSTRAINT `schedule_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedule` ADD CONSTRAINT `schedule_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedule` ADD CONSTRAINT `schedule_deleted_by_users_id_fk` FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `manual_attendance_attachments_attendance_idx` ON `manual_attendance_attachments` (`manual_attendance_id`);--> statement-breakpoint
CREATE INDEX `manual_attendances_employee_idx` ON `manual_attendances` (`employee_id`);--> statement-breakpoint
CREATE INDEX `schedule_adjustment_employee_idx` ON `schedule_adjustment` (`employee_id`);--> statement-breakpoint
CREATE INDEX `schedule_adjustment_shift_idx` ON `schedule_adjustment` (`shift_id`);--> statement-breakpoint
CREATE INDEX `schedule_employee_idx` ON `schedule` (`employee_id`);--> statement-breakpoint
CREATE INDEX `schedule_shift_idx` ON `schedule` (`shift_id`);