ALTER TABLE `User`
    ADD COLUMN `locationLabel` VARCHAR(191) NULL,
    ADD COLUMN `locationCity` VARCHAR(191) NULL,
    ADD COLUMN `locationRegion` VARCHAR(191) NULL,
    ADD COLUMN `locationCountry` VARCHAR(191) NULL,
    ADD COLUMN `locationLatitude` DOUBLE NULL,
    ADD COLUMN `locationLongitude` DOUBLE NULL;
