import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app-shell";
import PlanUpload from "./plan-upload";
import ProposalList, { type Proposal } from "./proposal-list";
import { MEAL_CHILD_NAMES } from "@/lib/family";
import { editableWeekdays, toYmd } from "@/lib/week";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lekseplan – Familien Bjørk" };

export default async function LekseplanPage() {
  const now = new Date();

  const [categories, pupils, proposals] = await Promise.all([
    prisma.noticeCategory.findMany({
      select: { id: true, name: true, color: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.member.findMany({
      where: { name: { in: [...MEAL_CHILD_NAMES] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.pendingNotice.findMany({
      where: { status: "FORESLATT" },
      select: {
        id: true,
        date: true,
        subject: true,
        text: true,
        member: { select: { name: true } },
        category: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const days = editableWeekdays(now);
  const allowed = new Set(days.map((day) => day.ymd));

  const rows: Proposal[] = proposals.map((proposal) => {
    // Dagen modellen fant gjelder bare hvis den faktisk kan skrives til nå.
    // Ellers står valget åpent, som for alle radene uten dag i planen.
    const suggested = proposal.date ? toYmd(proposal.date) : null;
    return {
      id: proposal.id,
      subject: proposal.subject,
      text: proposal.text,
      who: proposal.member?.name ?? null,
      category: proposal.category ?? { id: "", name: "Beskjed", color: "graa" },
      day: suggested && allowed.has(suggested) ? suggested : null,
    };
  });

  return (
    <AppShell>
      <div className="pt-6">
        <Link href="/beskjeder" className="text-[15px] text-ink-soft">
          ‹ Beskjeder
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Lekseplan</h1>
        <p className="mt-1 text-ink-soft">
          Last opp planen, så leses leksene ut av den. Du ser over og velger dag
          før noe legges inn — planene sier sjelden hvilken dag som gjelder.
        </p>
      </div>

      {pupils.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-card p-5 text-ink-soft">
          Fant ingen skolebarn i databasen. Kjør <code>npm run db:seed</code> først.
        </p>
      ) : (
        <div className="mt-6">
          <PlanUpload categories={categories} pupils={pupils} />
        </div>
      )}

      <ProposalList proposals={rows} days={days} />
    </AppShell>
  );
}
