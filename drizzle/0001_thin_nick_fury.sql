CREATE TABLE `buyerRequirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buyerName` varchar(160) NOT NULL,
	`buyerType` varchar(80) NOT NULL,
	`crop` varchar(64) NOT NULL,
	`quantityKg` int NOT NULL,
	`quality` varchar(80) NOT NULL,
	`location` varchar(255) NOT NULL,
	`requiredDate` varchar(32) NOT NULL,
	`maxPricePerKg` int NOT NULL,
	`status` enum('open','matched','ordered','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buyerRequirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `logisticsRoutes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`routeName` varchar(160) NOT NULL,
	`pickupPoints` text NOT NULL,
	`deliveryLocation` varchar(255) NOT NULL,
	`distanceKm` int NOT NULL,
	`etaMinutes` int NOT NULL,
	`vehicleCapacityKg` int NOT NULL,
	`consolidationCount` int NOT NULL DEFAULT 1,
	`status` enum('planned','picking_up','in_transit','delivered') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `logisticsRoutes_id` PRIMARY KEY(`id`),
	CONSTRAINT `logisticsRoutes_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `marketplaceOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`requirementId` int,
	`buyerName` varchar(160) NOT NULL,
	`quantityKg` int NOT NULL,
	`pricePerKg` int NOT NULL,
	`totalAmount` int NOT NULL,
	`status` enum('confirmed','pickup_planned','in_transit','delivered') NOT NULL DEFAULT 'confirmed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplaceOrders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `produceListings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmerMobile` varchar(10) NOT NULL,
	`sellerName` varchar(160) NOT NULL,
	`crop` varchar(64) NOT NULL,
	`quantityKg` int NOT NULL,
	`availableKg` int NOT NULL,
	`quality` varchar(80) NOT NULL,
	`location` varchar(255) NOT NULL,
	`harvestDate` varchar(32) NOT NULL,
	`pricePerKg` int NOT NULL,
	`status` enum('available','reserved','sold') NOT NULL DEFAULT 'available',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `produceListings_id` PRIMARY KEY(`id`)
);
