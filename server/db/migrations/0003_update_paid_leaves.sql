ALTER TABLE `employee_paid_leaves` MODIFY COLUMN `valid_from` date NOT NULL;--> statement-breakpoint
ALTER TABLE `employee_paid_leaves` MODIFY COLUMN `valid_to` date NOT NULL;--> statement-breakpoint
ALTER TABLE `employee_paid_leaves` DROP COLUMN `person_responsible`;--> statement-breakpoint
ALTER TABLE `employee_paid_leaves` ADD COLUMN `person_responsible_id` int;--> statement-breakpoint
ALTER TABLE `employee_paid_leaves` ADD CONSTRAINT `employee_paid_leaves_person_responsible_id_employees_id_fk` FOREIGN KEY (`person_responsible_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;
