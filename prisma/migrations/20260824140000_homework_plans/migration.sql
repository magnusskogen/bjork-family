-- Lekseplaner som lastes opp og leses av automatisk.
--
-- Beskjeder får en person (to skolebarn gjør «gjør ferdig arket» tvetydig), og
-- PendingNotice tas endelig i bruk som mellomsteg mellom uttrekk og kalender.

-- Notice: hvem beskjeden gjelder. Null = hele familien, som for faste avtaler.
ALTER TABLE "Notice" ADD COLUMN "memberId" TEXT;

-- Blir personen borte, står beskjeden igjen uten navn framfor å forsvinne.
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- PendingNotice: datoen er ikke lenger påkrevd. En lekseplan sier sjelden
-- hvilken dag leksa hører til, og da må et menneske velge.
ALTER TABLE "PendingNotice" ALTER COLUMN "date" DROP NOT NULL;

ALTER TABLE "PendingNotice" ADD COLUMN "subject" TEXT;
ALTER TABLE "PendingNotice" ADD COLUMN "memberId" TEXT;

-- Sletter man en person, er forslagene om vedkommende uinteressante.
ALTER TABLE "PendingNotice" ADD CONSTRAINT "PendingNotice_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
