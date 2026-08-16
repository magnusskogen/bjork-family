import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app-shell";
import NoticeForm from "./notice-form";
import NoticeList, { type NoticeRow } from "./notice-list";
import {
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

  const [categories, notices] = await Promise.all([
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
        createdBy: { select: { name: true } },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const toRow = (notice: (typeof notices)[number]): NoticeRow => ({
    id: notice.id,
    dateLabel: formatLongDate(notice.date),
    category: notice.category,
    text: notice.text,
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
  const defaultDate = toYmd(today.getTime() >= start.getTime() ? today : start);

  return (
    <AppShell>
      <div className="pt-6">
        <h1 className="text-2xl font-semibold tracking-tight">Beskjeder</h1>
        <p className="mt-1 text-ink-soft">
          Dukker opp på riktig dag i uka. Mangler du en kategori, lager du den i
          skjemaet under.
        </p>
      </div>

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
