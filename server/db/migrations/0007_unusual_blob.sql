CREATE TABLE `manufacturers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manufacturers_id` PRIMARY KEY(`id`),
	CONSTRAINT `manufacturers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`code` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`purchase_from_date` date NOT NULL,
	`purchase_to_date` date NOT NULL,
	`manufacture_id` int NOT NULL,
	`economic_age` int NOT NULL,
	`condition` varchar(50) NOT NULL,
	`price` decimal(15,2) NOT NULL,
	`description` text,
	`status` varchar(50) NOT NULL,
	`pt_id` int NOT NULL,
	`location` varchar(255) NOT NULL,
	`room_id` int NOT NULL,
	`divisi` int NOT NULL,
	`created_by` int NOT NULL,
	`updated_by` int,
	`deleted_by` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `assets_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `asset_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asset_id` int NOT NULL,
	`attachment` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `asset_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_has_employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asset_id` int NOT NULL,
	`employee_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `asset_has_employees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_manufacture_id_manufacturers_id_fk` FOREIGN KEY (`manufacture_id`) REFERENCES `manufacturers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_pt_id_companies_id_fk` FOREIGN KEY (`pt_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_room_id_rooms_id_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_divisi_divisions_id_fk` FOREIGN KEY (`divisi`) REFERENCES `divisions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_deleted_by_users_id_fk` FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_images` ADD CONSTRAINT `asset_images_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_employees` ADD CONSTRAINT `asset_has_employees_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_has_employees` ADD CONSTRAINT `asset_has_employees_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;