-- CreateTable
CREATE TABLE `User` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `displayName` VARCHAR(191) NULL,
  `timezone` VARCHAR(191) NOT NULL DEFAULT 'America/New_York',
  `themePreference` ENUM('light', 'dark', 'system') NOT NULL DEFAULT 'system',
  `avatarOriginalFilename` VARCHAR(191) NULL,
  `avatarStoredFilename` VARCHAR(191) NULL,
  `avatarRelativePath` VARCHAR(191) NULL,
  `avatarMimeType` VARCHAR(191) NULL,
  `avatarExtension` VARCHAR(191) NULL,
  `avatarByteSize` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `User_email_key`(`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyEntry` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `entryDate` DATE NOT NULL,
  `status` ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
  `moodValue` VARCHAR(191) NULL,
  `moodEmoji` VARCHAR(191) NULL,
  `moodLabel` VARCHAR(191) NULL,
  `gratitude1` VARCHAR(191) NULL,
  `gratitude2` VARCHAR(191) NULL,
  `gratitude3` VARCHAR(191) NULL,
  `todayGreat` VARCHAR(191) NULL,
  `affirmation` VARCHAR(191) NULL,
  `dailyCapture` LONGTEXT NULL,
  `eveningGood1` VARCHAR(191) NULL,
  `eveningGood2` VARCHAR(191) NULL,
  `eveningGood3` VARCHAR(191) NULL,
  `improveTomorrow` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `DailyEntry_userId_entryDate_key`(`userId`, `entryDate`),
  INDEX `DailyEntry_userId_entryDate_idx`(`userId`, `entryDate`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RelaxItem` (
  `id` VARCHAR(191) NOT NULL,
  `dailyEntryId` VARCHAR(191) NOT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `text` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `RelaxItem_dailyEntryId_sortOrder_idx`(`dailyEntryId`, `sortOrder`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tag` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `color` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `Tag_userId_slug_key`(`userId`, `slug`),
  INDEX `Tag_userId_slug_idx`(`userId`, `slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyEntryTag` (
  `dailyEntryId` VARCHAR(191) NOT NULL,
  `tagId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `DailyEntryTag_tagId_idx`(`tagId`),
  PRIMARY KEY (`dailyEntryId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ImageAttachment` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `dailyEntryId` VARCHAR(191) NOT NULL,
  `originalFilename` VARCHAR(191) NOT NULL,
  `storedFilename` VARCHAR(191) NOT NULL,
  `relativePath` VARCHAR(191) NOT NULL,
  `mimeType` VARCHAR(191) NOT NULL,
  `extension` VARCHAR(191) NOT NULL,
  `byteSize` INTEGER NOT NULL,
  `width` INTEGER NULL,
  `height` INTEGER NULL,
  `caption` VARCHAR(191) NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ImageAttachment_dailyEntryId_sortOrder_idx`(`dailyEntryId`, `sortOrder`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WeeklyReflection` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `isoYear` INTEGER NOT NULL,
  `isoWeek` INTEGER NOT NULL,
  `overallMoodValue` VARCHAR(191) NULL,
  `overallMoodEmoji` VARCHAR(191) NULL,
  `overallMoodLabel` VARCHAR(191) NULL,
  `energySummary` LONGTEXT NULL,
  `wins` LONGTEXT NULL,
  `hardMoments` LONGTEXT NULL,
  `feltOff` LONGTEXT NULL,
  `nextWeekIntention` LONGTEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `WeeklyReflection_userId_isoYear_isoWeek_key`(`userId`, `isoYear`, `isoWeek`),
  INDEX `WeeklyReflection_userId_isoYear_isoWeek_idx`(`userId`, `isoYear`, `isoWeek`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WeeklyLifeAreaRating` (
  `id` VARCHAR(191) NOT NULL,
  `weeklyReflectionId` VARCHAR(191) NOT NULL,
  `areaKey` VARCHAR(191) NOT NULL,
  `rating` INTEGER NOT NULL,
  `note` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `WeeklyLifeAreaRating_weeklyReflectionId_areaKey_key`(`weeklyReflectionId`, `areaKey`),
  INDEX `WeeklyLifeAreaRating_weeklyReflectionId_idx`(`weeklyReflectionId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DailyEntry`
  ADD CONSTRAINT `DailyEntry_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RelaxItem`
  ADD CONSTRAINT `RelaxItem_dailyEntryId_fkey`
  FOREIGN KEY (`dailyEntryId`) REFERENCES `DailyEntry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tag`
  ADD CONSTRAINT `Tag_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyEntryTag`
  ADD CONSTRAINT `DailyEntryTag_dailyEntryId_fkey`
  FOREIGN KEY (`dailyEntryId`) REFERENCES `DailyEntry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyEntryTag`
  ADD CONSTRAINT `DailyEntryTag_tagId_fkey`
  FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ImageAttachment`
  ADD CONSTRAINT `ImageAttachment_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ImageAttachment`
  ADD CONSTRAINT `ImageAttachment_dailyEntryId_fkey`
  FOREIGN KEY (`dailyEntryId`) REFERENCES `DailyEntry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WeeklyReflection`
  ADD CONSTRAINT `WeeklyReflection_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WeeklyLifeAreaRating`
  ADD CONSTRAINT `WeeklyLifeAreaRating_weeklyReflectionId_fkey`
  FOREIGN KEY (`weeklyReflectionId`) REFERENCES `WeeklyReflection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
