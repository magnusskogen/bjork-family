import MealField from "./meal-field";
import NoticePill, { type CategoryLite } from "./notice-pill";
import RoutinePill, { type RoutineLite } from "./routine-pill";
import { formatDayMonth, toYmd, weekdayName } from "@/lib/week";

export type DayMeal = {
  childId: string;
  childName: string;
  text: string;
  meta: string | null;
};

export type DayNotice = {
  id: string;
  category: CategoryLite;
  text: string;
};

export default function DayCard({
  date,
  meals,
  routines,
  notices,
  editable,
  isToday,
}: {
  date: Date;
  meals: DayMeal[];
  routines: RoutineLite[];
  notices: DayNotice[];
  editable: boolean;
  isToday: boolean;
}) {
  const ymd = toYmd(date);

  return (
    <article
      aria-labelledby={`dag-${ymd}`}
      className={`rounded-3xl border p-4 transition ${
        isToday
          ? "border-accent/40 bg-card shadow-sm ring-1 ring-accent/15"
          : editable
            ? "border-line bg-card"
            : "border-line/60 bg-transparent opacity-60"
      }`}
    >
      <h3 id={`dag-${ymd}`} className="flex items-baseline gap-2">
        <span className="text-lg font-semibold capitalize">
          {weekdayName(date)}
        </span>
        <span className="text-[15px] text-ink-faint">{formatDayMonth(date)}</span>
        {isToday ? (
          <span className="ml-auto rounded-full bg-accent px-3 py-0.5 text-[13px] font-medium text-white">
            I dag
          </span>
        ) : !editable ? (
          <span className="ml-auto text-[13px] text-ink-faint">Låst</span>
        ) : null}
      </h3>

      {routines.length > 0 || notices.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {routines.map((routine) => (
            <li key={routine.id} className="max-w-full">
              <RoutinePill routine={routine} />
            </li>
          ))}
          {notices.map((notice) => (
            <li key={notice.id} className="max-w-full">
              <NoticePill category={notice.category} text={notice.text} />
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 space-y-3">
        {meals.map((meal) =>
          editable ? (
            <MealField
              key={meal.childId}
              childId={meal.childId}
              childName={meal.childName}
              date={ymd}
              initialText={meal.text}
              initialMeta={meal.meta}
            />
          ) : (
            <div key={meal.childId} className="flex gap-3">
              <p className="w-14 shrink-0 text-sm font-medium text-ink-soft">
                {meal.childName}
              </p>
              <p className="min-w-0 flex-1 text-[15px] leading-snug whitespace-pre-wrap">
                {meal.text || <span className="text-ink-faint">Ikke fylt ut</span>}
              </p>
            </div>
          ),
        )}
      </div>
    </article>
  );
}
