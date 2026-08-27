CREATE TABLE `attendance_consolidation_days` (
	`id` int AUTO_INCREMENT NOT NULL,
	`consolidation_id` int NOT NULL,
	`date` date NOT NULL,
	`clock_in` varchar(8),
	`clock_out` varchar(8),
	`is_off` boolean NOT NULL DEFAULT false,
	`title_in` varchar(100),
	`title_out` varchar(100),
	`title_punishment` text,
	`work_hour` decimal(5,2),
	`pot_jam` int,
	`pot_rp` decimal(20,2),
	CONSTRAINT `attendance_consolidation_days_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendance_consolidations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`sakit` int NOT NULL DEFAULT 0,
	`izin` int NOT NULL DEFAULT 0,
	`cuti` int NOT NULL DEFAULT 0,
	`cuti_khusus` int NOT NULL DEFAULT 0,
	`telat` int NOT NULL DEFAULT 0,
	`pot_da` int NOT NULL DEFAULT 0,
	`pot_jam` int NOT NULL DEFAULT 0,
	`pot_jam_rp` decimal(20,2) NOT NULL DEFAULT '0.00',
	`pot_day_rp` decimal(20,2) NOT NULL DEFAULT '0.00',
	`pot_da_rp` decimal(20,2) NOT NULL DEFAULT '0.00',
	`punishment_telat` int NOT NULL DEFAULT 0,
	`punishment_form` int NOT NULL DEFAULT 0,
	`punishment_alpha` int NOT NULL DEFAULT 0,
	`punishment_no_finger` int NOT NULL DEFAULT 0,
	`punishment_form_late` int NOT NULL DEFAULT 0,
	`punishment_late_attendance` int NOT NULL DEFAULT 0,
	`punishment_alpha_rp` decimal(20,2) NOT NULL DEFAULT '0.00',
	`punishment_no_finger_rp` decimal(20,2) NOT NULL DEFAULT '0.00',
	`punishment_form_late_rp` decimal(20,2) NOT NULL DEFAULT '0.00',
	`punishment_late_attendance_rp` decimal(20,2) NOT NULL DEFAULT '0.00',
	`punishment_rp` decimal(20,2) NOT NULL DEFAULT '0.00',
	`total_potongan` decimal(20,2) NOT NULL DEFAULT '0.00',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendance_consolidations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deductions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`month` int NOT NULL,
	`year` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`amount` decimal(20,2) NOT NULL DEFAULT '0.00',
	`description` text,
	`created_by` int,
	`updated_by` int,
	`deleted_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `deductions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_attendance_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attendance_id` int NOT NULL,
	`permission_type_id` int,
	`clock` varchar(8) NOT NULL,
	`description` text,
	`dokumen` varchar(255),
	`location` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_attendance_details_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_attendances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`shift_in` varchar(8),
	`shift_out` varchar(8),
	`date` date NOT NULL,
	`is_off` int NOT NULL DEFAULT 0,
	`is_lock` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `employee_attendances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insentives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`month` int NOT NULL,
	`year` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`amount` decimal(20,2) NOT NULL DEFAULT '0.00',
	`description` text,
	`created_by` int,
	`updated_by` int,
	`deleted_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `insentives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `employees` ADD `basic_salary` decimal(20,0);--> statement-breakpoint
ALTER TABLE `employees` ADD `allowance` decimal(20,0);--> statement-breakpoint
ALTER TABLE `attendance_consolidation_days` ADD CONSTRAINT `attendance_consolidation_days_consolidation_id_attendance_consolidations_id_fk` FOREIGN KEY (`consolidation_id`) REFERENCES `attendance_consolidations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_consolidations` ADD CONSTRAINT `attendance_consolidations_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deductions` ADD CONSTRAINT `deductions_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deductions` ADD CONSTRAINT `deductions_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deductions` ADD CONSTRAINT `deductions_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deductions` ADD CONSTRAINT `deductions_deleted_by_users_id_fk` FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_attendance_details` ADD CONSTRAINT `employee_attendance_details_attendance_id_employee_attendances_id_fk` FOREIGN KEY (`attendance_id`) REFERENCES `employee_attendances`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_attendance_details` ADD CONSTRAINT `employee_attendance_details_permission_type_id_permissions_type_id_fk` FOREIGN KEY (`permission_type_id`) REFERENCES `permissions_type`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_attendances` ADD CONSTRAINT `employee_attendances_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `insentives` ADD CONSTRAINT `insentives_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `insentives` ADD CONSTRAINT `insentives_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `insentives` ADD CONSTRAINT `insentives_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `insentives` ADD CONSTRAINT `insentives_deleted_by_users_id_fk` FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `attendance_consolidation_days_consolidation_idx` ON `attendance_consolidation_days` (`consolidation_id`);--> statement-breakpoint
CREATE INDEX `attendance_consolidations_employee_idx` ON `attendance_consolidations` (`employee_id`);--> statement-breakpoint
CREATE INDEX `attendance_consolidations_period_idx` ON `attendance_consolidations` (`year`,`month`);--> statement-breakpoint
CREATE INDEX `deductions_employee_idx` ON `deductions` (`employee_id`);--> statement-breakpoint
CREATE INDEX `deductions_period_idx` ON `deductions` (`year`,`month`);--> statement-breakpoint
CREATE INDEX `employee_attendance_details_attendance_idx` ON `employee_attendance_details` (`attendance_id`);--> statement-breakpoint
CREATE INDEX `employee_attendances_employee_idx` ON `employee_attendances` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_attendances_date_idx` ON `employee_attendances` (`date`);--> statement-breakpoint
CREATE INDEX `insentives_employee_idx` ON `insentives` (`employee_id`);--> statement-breakpoint
CREATE INDEX `insentives_period_idx` ON `insentives` (`year`,`month`);