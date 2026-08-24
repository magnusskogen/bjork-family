import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app-shell";
import RoutineForm from "./routine-form";
import RoutineList, { type RoutineRow } from "./routine-list";
import { compareRoutines } from "@/lib/routines";
import {
  isWeekdayNumber,
  todayInOslo,
  WEEKDAYS_MON_FRI,
  weekdayNameOf,
} from "@/lib/week";

export const dynamic = "force-dynamic";
export const metadata = { title: "Faste avtaler – Familien Bjørk" };

export default async function FastePage() {
  const now = new Date();

  const [categories, routines] = await Promise.all([
    prisma.noticeCategory.findMany({
      select: { id: true, name: true, color: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.routine.findMany({
      select: {
        id: true,
        weekday: true,
        time: true,
        text: true,
        member: { select: { name: true } },
        category: { select: { id: true, name: true, color: true } },
      },
    }),
  ]);

  // Én bolk per ukedag, tidligste avtale først. Dager uten noe vises ikke.
  const byWeekday = WEEKDAYS_MON_FRI.map((weekday) => ({
    weekday,
    name: weekdayNameOf(weekday),
    routines: routines
      .filter((routine) => routine.weekday === weekday)
      .map(
        (routine): RoutineRow => ({
          id: routine.id,
          time: routine.time,
          who: routine.member?.name ?? null,
          text: routine.text,
          category: routine.category,
        }),
      )
      .sort(compareRoutines),
  })).filter((group) => group.routines.length > 0);

  // Står vi på en hverdag, er det som regel den dagen man tenker på.
  const weekday = todayInOslo(now).getUTCDay();
  const defaultWeekday = isWeekdayNumber(weekday) ? weekday : 1;

  return (
    <AppShell>
      <div className="pt-6">
        <h1 className="text-2xl font-semibold tracking-tight">Faste avtaler</h1>
        <p className="mt-1 text-ink-soft">
          Det som går igjen hver uke. Dukker opp på riktig dag, uke etter uke,
          til noen fjerner det.
        </p>
      </div>

      <div className="mt-6">
        <RoutineForm categories={categories} defaultWeekday={defaultWeekday} />
      </div>

      <RoutineList groups={byWeekday} />
    </AppShell>
  );
}
