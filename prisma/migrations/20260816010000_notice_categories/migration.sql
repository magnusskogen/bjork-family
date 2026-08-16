-- Kategorier for beskjeder går fra enum til egen tabell, så familien kan legge
-- til sine egne. Eksisterende beskjeder flyttes over før den gamle kolonnen
-- fjernes — ingen data går tapt.

-- CreateTable
CREATE TABLE "NoticeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'graa',
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoticeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NoticeCategory_name_key" ON "NoticeCategory"("name");

-- CreateIndex
CREATE INDEX "NoticeCategory_sortOrder_idx" ON "NoticeCategory"("sortOrder");

-- De faste kategoriene. Id-ene er stabile så seed-scriptet kan gjenkjenne dem.
INSERT INTO "NoticeCategory" ("id", "name", "color", "sortOrder") VALUES
    ('kat_skole',        'Skole',        'blaa',    10),
    ('kat_ungdomsskole', 'Ungdomsskole', 'lilla',   20),
    ('kat_barnehage',    'Barnehage',    'gul',     30),
    ('kat_trening',      'Trening',      'gronn',   40),
    ('kat_generelt',     'Generelt',     'graa',    50);

-- Notice: legg til kolonnen, flytt over, og først da fjern enum-kolonnen.
ALTER TABLE "Notice" ADD COLUMN "categoryId" TEXT;

UPDATE "Notice" SET "categoryId" = CASE "source"
    WHEN 'SKOLE'        THEN 'kat_skole'
    WHEN 'UNGDOMSSKOLE' THEN 'kat_ungdomsskole'
    WHEN 'BARNEHAGE'    THEN 'kat_barnehage'
END;

ALTER TABLE "Notice" ALTER COLUMN "categoryId" SET NOT NULL;
ALTER TABLE "Notice" DROP COLUMN "source";

-- CreateIndex
CREATE INDEX "Notice_categoryId_idx" ON "Notice"("categoryId");

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "NoticeCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PendingNotice: samme øvelse, men kategorien er valgfri her.
ALTER TABLE "PendingNotice" ADD COLUMN "categoryId" TEXT;

UPDATE "PendingNotice" SET "categoryId" = CASE "source"
    WHEN 'SKOLE'        THEN 'kat_skole'
    WHEN 'UNGDOMSSKOLE' THEN 'kat_ungdomsskole'
    WHEN 'BARNEHAGE'    THEN 'kat_barnehage'
END;

ALTER TABLE "PendingNotice" DROP COLUMN "source";

-- AddForeignKey
ALTER TABLE "PendingNotice" ADD CONSTRAINT "PendingNotice_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "NoticeCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropEnum
DROP TYPE "NoticeSource";
