CREATE TABLE `employee_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`permissions_type_id` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`valid_from` datetime NOT NULL,
	`valid_to` datetime NOT NULL,
	`description` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`created_by` int,
	`updated_by` int,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_by` int,
	`deleted_at` timestamp,
	CONSTRAINT `employee_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permission_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`permission_id` int NOT NULL,
	`attachment` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `permission_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `employee_permissions` ADD CONSTRAINT `employee_permissions_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_permissions` ADD CONSTRAINT `employee_permissions_permissions_type_id_permissions_type_id_fk` FOREIGN KEY (`permissions_type_id`) REFERENCES `permissions_type`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_permissions` ADD CONSTRAINT `employee_permissions_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_permissions` ADD CONSTRAINT `employee_permissions_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_permissions` ADD CONSTRAINT `employee_permissions_deleted_by_users_id_fk` FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permission_attachments` ADD CONSTRAINT `permission_attachments_permission_id_employee_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `employee_permissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `employee_permissions_employee_idx` ON `employee_permissions` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_permissions_type_idx` ON `employee_permissions` (`permissions_type_id`);--> statement-breakpoint
CREATE INDEX `employee_permissions_status_idx` ON `employee_permissions` (`status`);--> statement-breakpoint
CREATE INDEX `permission_attachments_permission_idx` ON `permission_attachments` (`permission_id`);