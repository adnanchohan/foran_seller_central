CREATE TABLE `application_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`application_id` text NOT NULL,
	`status` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`actor_id` text NOT NULL,
	`version` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `store_applications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_application_history_app` ON `application_history` (`application_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `document_uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`document_type` text NOT NULL,
	`original_name` text NOT NULL,
	`stored_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`storage_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `document_uploads_stored_name_unique` ON `document_uploads` (`stored_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `document_uploads_storage_key_unique` ON `document_uploads` (`storage_key`);--> statement-breakpoint
CREATE INDEX `idx_document_uploads_owner` ON `document_uploads` (`owner_id`,`document_type`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'PKR' NOT NULL,
	`status` text DEFAULT 'DEMO_COMPLETED' NOT NULL,
	`provider` text DEFAULT 'NOT_INTEGRATED' NOT NULL,
	`notice` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_user_id_unique` ON `payments` (`user_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`csrf_token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `idx_sessions_token` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `store_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`seller_type` text DEFAULT 'individual' NOT NULL,
	`store_name` text DEFAULT '' NOT NULL,
	`store_slug` text DEFAULT '' NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`warehouse_address` text DEFAULT '' NOT NULL,
	`pickup_city` text DEFAULT '' NOT NULL,
	`pickup_area` text DEFAULT '' NOT NULL,
	`pickup_contact_person` text DEFAULT '' NOT NULL,
	`pickup_contact_mobile` text DEFAULT '' NOT NULL,
	`cnic_number` text DEFAULT '' NOT NULL,
	`banner_upload_id` text,
	`logo_upload_id` text,
	`cnic_front_upload_id` text,
	`cnic_back_upload_id` text,
	`company_document_upload_id` text,
	`submitted_at` integer,
	`reviewed_at` integer,
	`reviewed_by` text,
	`review_note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`banner_upload_id`) REFERENCES `document_uploads`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`logo_upload_id`) REFERENCES `document_uploads`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`cnic_front_upload_id`) REFERENCES `document_uploads`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`cnic_back_upload_id`) REFERENCES `document_uploads`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`company_document_upload_id`) REFERENCES `document_uploads`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `store_applications_user_id_unique` ON `store_applications` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_store_applications_status` ON `store_applications` (`status`,`submitted_at`);--> statement-breakpoint
CREATE INDEX `idx_store_applications_slug` ON `store_applications` (`store_slug`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`google_sub` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text DEFAULT '' NOT NULL,
	`photo_url` text DEFAULT '' NOT NULL,
	`auth_provider` text NOT NULL,
	`role` text DEFAULT 'seller' NOT NULL,
	`plan` text,
	`dashboard_enabled` integer DEFAULT false NOT NULL,
	`last_signed_in_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_sub_unique` ON `users` (`google_sub`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_role` ON `users` (`role`);