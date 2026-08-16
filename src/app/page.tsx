import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app-shell";
import DayCard, { type DayMeal, type DayNotice } from "@/components/day-card";
import ScrollToToday from "@/components/scroll-to-today";
import { MEAL_CHILD_NAMES } from "@/lib/family";
import { relativeNorwegian, type SourceKey } from "@/lib/format";
import {
  addDays,
  dateOnly,
  isEditable,
  isoWeekNumber,
  startOfWeekOslo,
  todayInOslo,
  toYmd,
  weekLabel,
  weekdaysOf,
} from "@/lib/week";

export const dynamic = "force-dynamic";

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const MAX_WEEKS_AWAY = 26;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ uke?: string }>;
}) {
  const now = new Date();
  const today = todayInOslo(now);
  const thisWeek = startOfWeekOslo(today);

  const { uke } = await searchParams;
  const weekStart = resolveWeek(uke, thisWeek);

  const days = weekdaysOf(weekStart);
  const from = days[0];
  const to = days[4];

  const [children, meals, notices] = await Promise.all([
    prisma.member.findMany({
      where: { name: { in: [...MEAL_CHILD_NAMES] } },
      select: { id: true, name: true },
    }),
    prisma.mealEntry.findMany({
      where: { date: { gte: from, lte: to } },
      select: {
        childId: true,
        date: true,
        text: true,
        updatedAt: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.notice.findMany({
      where: { date: { gte: from, lte: to } },
      select: { id: true, date: true, source: true, text: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Behold rekkefølgen fra family.ts, ikke den databasen tilfeldigvis gir.
  const mealChildren = MEAL_CHILD_NAMES.map((name) =>
    children.find((child) => child.name === name),
  ).filter((child) => child !== undefined);

  const mealsByDay = new Map<string, Map<string, (typeof meals)[number]>>();
  for (const meal of meals) {
    const key = toYmd(meal.date);
    if (!mealsByDay.has(key)) mealsByDay.set(key, new Map());
    mealsByDay.get(key)!.set(meal.childId, meal);
  }

  const noticesByDay = new Map<string, DayNotice[]>();
  for (const notice of notices) {
    const key = toYmd(notice.date);
    const list = noticesByDay.get(key) ?? [];
    list.push({
      id: notice.id,
      source: notice.source as SourceKey,
      text: notice.text,
    });
    noticesByDay.set(key, list);
  }

  const showToday = days.some((day) => day.getTime() === today.getTime());

  return (
    <AppShell>
      <WeekNav weekStart={weekStart} now={now} />

      <div className="mt-5 space-y-3">
        {days.map((day) => {
          const key = toYmd(day);
          const dayMeals = mealsByDay.get(key);

          const entries: DayMeal[] = mealChildren.map((child) => {
            const meal = dayMeals?.get(child.id);
            return {
              childId: child.id,
              childName: child.name,
              text: meal?.text ?? "",
              meta: meal
                ? `${meal.createdBy.name}, ${relativeNorwegian(meal.updatedAt, now)}`
                : null,
            };
          });

          return (
            <DayCard
              key={key}
              date={day}
              meals={entries}
              notices={noticesByDay.get(key) ?? []}
              editable={isEditable(day, now)}
              isToday={day.getTime() === today.getTime()}
            />
          );
        })}
      </div>

      {mealChildren.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-card p-5 text-ink-soft">
          Fant ingen barn i databasen. Kjør <code>npm run db:seed</code> først.
        </p>
      ) : null}

      {showToday ? <ScrollToToday /> : null}
    </AppShell>
  );
}

function resolveWeek(uke: string | undefined, fallback: Date): Date {
  if (!uke || !YMD.test(uke)) return fallback;
  const parsed = dateOnly(uke);
  if (Number.isNaN(parsed.getTime())) return fallback;

  const weekStart = startOfWeekOslo(parsed);
  const weeksAway = Math.round(
    (weekStart.getTime() - fallback.getTime()) / (7 * 86400000),
  );
  if (Math.abs(weeksAway) > MAX_WEEKS_AWAY) return fallback;
  return weekStart;
}

function WeekNav({ weekStart, now }: { weekStart: Date; now: Date }) {
  const previous = toYmd(addDays(weekStart, -7));
  const next = toYmd(addDays(weekStart, 7));

  return (
    <nav
      aria-label="Ukevelger"
      className="flex items-center justify-between gap-3 pt-6"
    >
      <ArrowLink href={`/?uke=${previous}`} label="Forrige uke" direction="left" />

      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {weekLabel(weekStart, now)}
        </h1>
        <p className="text-[15px] text-ink-faint">
          Uke {isoWeekNumber(weekStart)}
        </p>
      </div>

      <ArrowLink href={`/?uke=${next}`} label="Neste uke" direction="right" />
    </nav>
  );
}

function ArrowLink({
  href,
  label,
  direction,
}: {
  href: string;
  label: string;
  direction: "left" | "right";
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-card text-xl text-ink-soft transition active:scale-95"
    >
      <span aria-hidden="true">{direction === "left" ? "‹" : "›"}</span>
    </Link>
  );
}
