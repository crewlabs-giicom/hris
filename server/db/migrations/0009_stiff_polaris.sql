CREATE TABLE `asset_depreciation_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`period_date` date NOT NULL,
	`total_assets` int NOT NULL,
	`total_amount` decimal(15,2) NOT NULL,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `asset_depreciation_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_depreciation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`run_id` int NOT NULL,
	`asset_id` int NOT NULL,
	`period_date` date NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`remaining_age` int NOT NULL,
	`remaining_value` decimal(15,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `asset_depreciation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assets` ADD `category` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `asset_depreciation_runs` ADD CONSTRAINT `asset_depreciation_runs_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_depreciation_logs` ADD CONSTRAINT `asset_depreciation_logs_run_id_asset_depreciation_runs_id_fk` FOREIGN KEY (`run_id`) REFERENCES `asset_depreciation_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_depreciation_logs` ADD CONSTRAINT `asset_depreciation_logs_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE no action ON UPDATE no action;