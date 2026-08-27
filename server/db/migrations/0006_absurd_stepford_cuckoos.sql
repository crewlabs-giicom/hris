CREATE TABLE `rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`ruko` varchar(255) NOT NULL,
	`floor` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `room_reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`employee_id` int NOT NULL,
	`room_id` int NOT NULL,
	`type` boolean NOT NULL,
	`date` date NOT NULL,
	`clock_start` varchar(8) NOT NULL,
	`clock_end` varchar(8) NOT NULL,
	`description` varchar(255),
	`created_by` int NOT NULL,
	`updated_by` int,
	`deleted_by` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `room_reservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `room_reservations` ADD CONSTRAINT `room_reservations_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `room_reservations` ADD CONSTRAINT `room_reservations_room_id_rooms_id_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `room_reservations` ADD CONSTRAINT `room_reservations_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `room_reservations` ADD CONSTRAINT `room_reservations_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `room_reservations` ADD CONSTRAINT `room_reservations_deleted_by_employees_id_fk` FOREIGN KEY (`deleted_by`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;