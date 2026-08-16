-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "NoticeSource" AS ENUM ('SKOLE', 'UNGDOMSSKOLE', 'BARNEHAGE');

-- CreateEnum
CREATE TYPE "PendingNoticeStatus" AS ENUM ('FORESLATT', 'GODKJENT', 'AVVIST');

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isChild" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealEntry" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "text" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "source" "NoticeSource" NOT NULL,
    "text" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingNotice" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "source" "NoticeSource" NOT NULL,
    "text" TEXT NOT NULL,
    "rawSource" TEXT NOT NULL,
    "status" "PendingNoticeStatus" NOT NULL DEFAULT 'FORESLATT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingNotice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MealEntry_date_idx" ON "MealEntry"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MealEntry_childId_date_key" ON "MealEntry"("childId", "date");

-- CreateIndex
CREATE INDEX "Notice_date_idx" ON "Notice"("date");

-- CreateIndex
CREATE INDEX "PendingNotice_status_idx" ON "PendingNotice"("status");

-- AddForeignKey
ALTER TABLE "MealEntry" ADD CONSTRAINT "MealEntry_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealEntry" ADD CONSTRAINT "MealEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

