CREATE TABLE `asset_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`code` varchar(100) NOT NULL,
	`employee_id` int NOT NULL,
	`category` varchar(50) NOT NULL,
	`pt_id` int NOT NULL,
	`marketplace` varchar(100) NOT NULL,
	`bank` varchar(50) NOT NULL,
	`rekening` varchar(100) NOT NULL,
	`payment_to` varchar(255) NOT NULL,
	`finance_id` int NOT NULL,
	`request_date` date NOT NULL,
	`payment_date` date,
	`price` decimal(15,2) NOT NULL DEFAULT '0.00',
	`description` text,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`created_by` int NOT NULL,
	`updated_by` int,
	`deleted_by` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `asset_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_requests_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `asset_request_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asset_request_id` int NOT NULL,
	`arf_number` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`price` decimal(15,2) NOT NULL DEFAULT '0.00',
	`quantity` int NOT NULL DEFAULT 1,
	`total_price` decimal(15,2) NOT NULL DEFAULT '0.00',
	`economic_age` int NOT NULL DEFAULT 1,
	`condition` varchar(50) NOT NULL DEFAULT 'new',
	`manufacturer_id` int NOT NULL,
	`room_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `asset_request_details_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_request_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asset_request_id` int NOT NULL,
	`attachment` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `asset_request_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_request_detail_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asset_request_detail_id` int NOT NULL,
	`attachment` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `asset_request_detail_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `asset_requests` ADD CONSTRAINT `asset_requests_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_requests` ADD CONSTRAINT `asset_requests_pt_id_companies_id_fk` FOREIGN KEY (`pt_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_requests` ADD CONSTRAINT `asset_requests_finance_id_employees_id_fk` FOREIGN KEY (`finance_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_requests` ADD CONSTRAINT `asset_requests_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_requests` ADD CONSTRAINT `asset_requests_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_requests` ADD CONSTRAINT `asset_requests_deleted_by_users_id_fk` FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_request_details` ADD CONSTRAINT `asset_request_details_asset_request_id_asset_requests_id_fk` FOREIGN KEY (`asset_request_id`) REFERENCES `asset_requests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_request_details` ADD CONSTRAINT `asset_request_details_manufacturer_id_manufacturers_id_fk` FOREIGN KEY (`manufacturer_id`) REFERENCES `manufacturers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_request_details` ADD CONSTRAINT `asset_request_details_room_id_rooms_id_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_request_images` ADD CONSTRAINT `asset_request_images_asset_request_id_asset_requests_id_fk` FOREIGN KEY (`asset_request_id`) REFERENCES `asset_requests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_request_detail_images` ADD CONSTRAINT `asset_req_det_img_det_id_fk` FOREIGN KEY (`asset_request_detail_id`) REFERENCES `asset_request_details`(`id`) ON DELETE cascade ON UPDATE no action;