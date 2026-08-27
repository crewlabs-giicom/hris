CREATE TABLE `activation_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`used_at` timestamp,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `activation_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `api_clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`api_key_hash` varchar(255) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `api_clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`actor_user_id` int,
	`action` varchar(100) NOT NULL,
	`target_type` varchar(100),
	`target_id` varchar(36),
	`metadata` varchar(2000),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`revoked_at` timestamp,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`username` varchar(50),
	`password_hash` varchar(255),
	`role` enum('employee','approver','hr_admin','super_admin') NOT NULL DEFAULT 'employee',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(32) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `departments_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`code` varchar(32) NOT NULL,
	`department_id` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `positions_id` PRIMARY KEY(`id`),
	CONSTRAINT `positions_code_unique` UNIQUE(`code`),
	CONSTRAINT `positions_title_department_idx` UNIQUE(`title`,`department_id`)
);
--> statement-breakpoint
CREATE TABLE `divisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(32) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `divisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `divisions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `levels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`name` varchar(50) NOT NULL,
	`base_salary` decimal(20,0) NOT NULL DEFAULT '0',
	`meal_allowance` decimal(20,0) NOT NULL DEFAULT '0',
	`other_allowance` decimal(20,0) NOT NULL DEFAULT '0',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `levels_id` PRIMARY KEY(`id`),
	CONSTRAINT `levels_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `companies_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `banks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `banks_id` PRIMARY KEY(`id`),
	CONSTRAINT `banks_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`leader_id` int,
	`pic_id` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shift` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`shift_in` time NOT NULL,
	`shift_out` time NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `shift_id` PRIMARY KEY(`id`),
	CONSTRAINT `shift_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `permissions_type` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `permissions_type_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_type_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `holidays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`date` date NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `holidays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`user_id` int,
	`employee_code` varchar(32) NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(32),
	`nik` varchar(25),
	`department_id` int,
	`position_id` int,
	`division_id` int,
	`team_id` int,
	`company_id` int,
	`bank_id` int,
	`account_number` varchar(50),
	`birth_date` date,
	`religion` varchar(50),
	`blood_type` varchar(3),
	`gender` enum('male','female'),
	`marital_status` varchar(30),
	`ktp_address` text,
	`npwp` varchar(30),
	`domicile_address` text,
	`domicile_ownership` varchar(30),
	`instagram` varchar(100),
	`tiktok` varchar(100),
	`contract_end_date` date,
	`dominance` varchar(10),
	`bpjs_type` varchar(30),
	`tax_status` varchar(10),
	`photo_path` varchar(255),
	`status` int NOT NULL DEFAULT 1,
	`gaji_pokok_emp` decimal(20,0),
	`employment_status` enum('pending_activation','active','resigned','terminated') NOT NULL DEFAULT 'pending_activation',
	`join_date` date,
	`resign_date` date,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_employee_code_unique` UNIQUE(`employee_code`),
	CONSTRAINT `employees_email_unique` UNIQUE(`email`),
	CONSTRAINT `employees_nik_unique` UNIQUE(`nik`)
);
--> statement-breakpoint
CREATE TABLE `employee_level_histories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`employee_id` int NOT NULL,
	`level_id` int NOT NULL,
	`effective_date` date NOT NULL,
	`note` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `employee_level_histories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_education` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`employee_id` int NOT NULL,
	`degree` varchar(255),
	`school_name` varchar(255),
	`school_year` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_education_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_emergency_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`employee_id` int NOT NULL,
	`name` varchar(255),
	`relation` varchar(255),
	`phone` varchar(255),
	`address` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_emergency_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_family` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`employee_id` int NOT NULL,
	`name` varchar(255),
	`birth_date` date,
	`family_relation` varchar(25),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_family_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_family_tree` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`employee_id` int NOT NULL,
	`name` varchar(50),
	`relation` varchar(50),
	`gender` char(1),
	`birth_date` date,
	`last_education` varchar(50),
	`last_work` varchar(50),
	`last_institute` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_family_tree_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_organization` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`employee_id` int NOT NULL,
	`name` varchar(50),
	`position` varchar(50),
	`organization_length` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_organization_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_work_experiences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`employee_id` int NOT NULL,
	`company_name` varchar(255),
	`work_position` varchar(255),
	`work_length` varchar(255),
	`salary_per_month` varchar(100),
	`reason_for_leaving` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_work_experiences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_hobbies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`employee_id` int NOT NULL,
	`hobby` varchar(100) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `employee_hobbies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_languages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`employee_id` int NOT NULL,
	`language` varchar(50) NOT NULL,
	`proficiency` varchar(20) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `employee_languages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`employee_id` int NOT NULL,
	`document_type` enum('ktp','bpjs','npwp','bank_account') NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_path` varchar(255) NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`file_size` int NOT NULL,
	`uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `employee_documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `employee_documents_employee_type_unique` UNIQUE(`employee_id`,`document_type`)
);
--> statement-breakpoint
CREATE TABLE `model_has_permissions` (
	`permission_id` int NOT NULL,
	`model_id` int NOT NULL,
	`model_type` varchar(100) NOT NULL DEFAULT 'user',
	CONSTRAINT `model_has_permissions_permission_id_model_id_model_type_pk` PRIMARY KEY(`permission_id`,`model_id`,`model_type`)
);
--> statement-breakpoint
CREATE TABLE `model_has_roles` (
	`role_id` int NOT NULL,
	`model_id` int NOT NULL,
	`model_type` varchar(100) NOT NULL DEFAULT 'user',
	CONSTRAINT `model_has_roles_role_id_model_id_model_type_pk` PRIMARY KEY(`role_id`,`model_id`,`model_type`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`name` varchar(150) NOT NULL,
	`guard_name` varchar(50) NOT NULL DEFAULT 'web',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `role_has_permissions` (
	`role_id` int NOT NULL,
	`permission_id` int NOT NULL,
	CONSTRAINT `role_has_permissions_role_id_permission_id_pk` PRIMARY KEY(`role_id`,`permission_id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`guard_name` varchar(50) NOT NULL DEFAULT 'web',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `activation_tokens` ADD CONSTRAINT `activation_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_user_id_users_id_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `positions` ADD CONSTRAINT `positions_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_position_id_positions_id_fk` FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_division_id_divisions_id_fk` FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_bank_id_banks_id_fk` FOREIGN KEY (`bank_id`) REFERENCES `banks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_level_histories` ADD CONSTRAINT `employee_level_histories_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_level_histories` ADD CONSTRAINT `employee_level_histories_level_id_levels_id_fk` FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_education` ADD CONSTRAINT `employee_education_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_emergency_contacts` ADD CONSTRAINT `employee_emergency_contacts_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_family` ADD CONSTRAINT `employee_family_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_family_tree` ADD CONSTRAINT `employee_family_tree_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_organization` ADD CONSTRAINT `employee_organization_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_work_experiences` ADD CONSTRAINT `employee_work_experiences_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_hobbies` ADD CONSTRAINT `employee_hobbies_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_languages` ADD CONSTRAINT `employee_languages_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_documents` ADD CONSTRAINT `employee_documents_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_has_permissions` ADD CONSTRAINT `model_has_permissions_permission_id_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_has_roles` ADD CONSTRAINT `model_has_roles_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_has_permissions` ADD CONSTRAINT `role_has_permissions_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_has_permissions` ADD CONSTRAINT `role_has_permissions_permission_id_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `audit_logs_actor_idx` ON `audit_logs` (`actor_user_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_target_idx` ON `audit_logs` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_user_idx` ON `refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `employees_department_idx` ON `employees` (`department_id`);--> statement-breakpoint
CREATE INDEX `employees_status_idx` ON `employees` (`employment_status`);--> statement-breakpoint
CREATE INDEX `employee_level_histories_employee_idx` ON `employee_level_histories` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_education_employee_idx` ON `employee_education` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_emergency_contacts_employee_idx` ON `employee_emergency_contacts` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_family_employee_idx` ON `employee_family` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_family_tree_employee_idx` ON `employee_family_tree` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_organization_employee_idx` ON `employee_organization` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_work_experiences_employee_idx` ON `employee_work_experiences` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_hobbies_employee_idx` ON `employee_hobbies` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_languages_employee_idx` ON `employee_languages` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_documents_employee_idx` ON `employee_documents` (`employee_id`);