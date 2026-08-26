CREATE TABLE `farmerProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mobile` varchar(10) NOT NULL,
	`fullName` varchar(120) NOT NULL,
	`location` varchar(255) NOT NULL,
	`language` varchar(32) NOT NULL DEFAULT 'English',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `farmerProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `farmerProfiles_mobile_unique` UNIQUE(`mobile`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
