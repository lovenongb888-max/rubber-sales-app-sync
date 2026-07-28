CREATE TABLE `salesRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`time` varchar(5) NOT NULL,
	`pricePerKg` decimal(10,2) NOT NULL,
	`quantity` int NOT NULL,
	`totalWeight` decimal(10,2) NOT NULL,
	`totalAmount` decimal(12,2) NOT NULL,
	`notes` text,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `salesRecords_id` PRIMARY KEY(`id`)
);
