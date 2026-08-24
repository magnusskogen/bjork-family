-- Faste avtaler som går igjen hver uke. Rene regler: ukedag + valgfritt
-- klokkeslett, ingen datoer. Forekomstene regnes ut når uka vises.

-- CreateTable
CREATE TABLE "Routine" (
    "id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "time" TEXT,
    "text" TEXT NOT NULL,
    "memberId" TEXT,
    "categoryId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Routine_weekday_idx" ON "Routine"("weekday");

-- CreateIndex
CREATE INDEX "Routine_categoryId_idx" ON "Routine"("categoryId");

-- AddForeignKey
-- Blir personen borte, forsvinner de faste avtalene deres med.
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "NoticeCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
