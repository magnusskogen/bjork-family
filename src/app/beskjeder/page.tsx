import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app-shell";
import NoticeForm from "./notice-form";
import NoticeList, { type NoticeRow } from "./notice-list";
import {
  defaultWeekStart,
  editableRange,
  formatLongDate,
  isEditable,
  todayInOslo,
  toYmd,
} from "@/lib/week";

export const dynamic = "force-dynamic";
export const metadata = { title: "Beskjeder – Familien Bjørk" };

export default async function BeskjederPage() {
  const now = new Date();
  const today = todayInOslo(now);
  const { start, end } = editableRange(now);

  const [categories, notices, waiting] = await Promise.all([
    prisma.noticeCategory.findMany({
      select: { id: true, name: true, color: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.notice.findMany({
      select: {
        id: true,
        date: true,
        text: true,
        category: { select: { id: true, name: true, color: true } },
        member: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
    prisma.pendingNotice.count({ where: { status: "FORESLATT" } }),
  ]);

  const toRow = (notice: (typeof notices)[number]): NoticeRow => ({
    id: notice.id,
    dateLabel: formatLongDate(notice.date),
    category: notice.category,
    text: notice.text,
    who: notice.member?.name ?? null,
    by: notice.createdBy.name,
    canDelete: isEditable(notice.date, now),
  });

  const upcoming = notices
    .filter((notice) => notice.date.getTime() >= today.getTime())
    .map(toRow);

  const past = notices
    .filter((notice) => notice.date.getTime() < today.getTime())
    .reverse()
    .map(toRow);

  // Skjemaet tilbyr bare datoer som faktisk kan lagres. Serveren sjekker uansett.
  // I helga foreslår vi mandag i uka som kommer — samme skille som forsiden
  // bruker, og beskjeder vises uansett bare på mandag–fredag.
  const weekday = today.getUTCDay();
  const inWeekend = weekday === 6 || weekday === 0;
  const defaultDate = toYmd(inWeekend ? defaultWeekStart(now) : today);

  return (
    <AppShell>
      <div className="pt-6">
        <h1 className="text-2xl font-semibold tracking-tight">Beskjeder</h1>
        <p className="mt-1 text-ink-soft">
          Dukker opp på riktig dag i uka. Mangler du en kategori, lager du den i
          skjemaet under.
        </p>
      </div>

      <Link
        href="/lekseplan"
        className="mt-6 flex items-center gap-3 rounded-3xl bg-card p-5 transition active:scale-[0.99]"
      >
        <span aria-hidden="true" className="text-2xl">
          📄
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">Last opp lekseplan</span>
          <span className="block text-[15px] text-ink-soft">
            {waiting > 0
              ? `${waiting} ${waiting === 1 ? "lekse venter" : "lekser venter"} på gjennomgang`
              : "Leser leksene ut av planen automatisk"}
          </span>
        </span>
        <span aria-hidden="true" className="text-xl text-ink-faint">
          ›
        </span>
      </Link>

      <div className="mt-6">
        <NoticeForm
          categories={categories}
          minDate={toYmd(start)}
          maxDate={toYmd(end)}
          defaultDate={defaultDate}
        />
      </div>

      <NoticeList upcoming={upcoming} past={past} />
    </AppShell>
  );
}
