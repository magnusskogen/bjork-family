import MealField from "./meal-field";
import NoticePill from "./notice-pill";
import { formatDayMonth, toYmd, weekdayName } from "@/lib/week";
import type { SourceKey } from "@/lib/format";

export type DayMeal = {
  childId: string;
  childName: string;
  text: string;
  meta: string | null;
};

export type DayNotice = {
  id: string;
  source: SourceKey;
  text: string;
};

export default function DayCard({
  date,
  meals,
  notices,
  editable,
  isToday,
}: {
  date: Date;
  meals: DayMeal[];
  notices: DayNotice[];
  editable: boolean;
  isToday: boolean;
}) {
  const ymd = toYmd(date);

  return (
    <article
      id={isToday ? "i-dag" : undefined}
      aria-labelledby={`dag-${ymd}`}
      className={`scroll-mt-24 rounded-3xl border p-5 transition ${
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

      {notices.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {notices.map((notice) => (
            <li key={notice.id} className="max-w-full">
              <NoticePill source={notice.source} text={notice.text} />
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 space-y-4">
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
            <div key={meal.childId}>
              <p className="text-[15px] font-medium text-ink-soft">
                {meal.childName}
              </p>
              <p className="mt-1 leading-relaxed whitespace-pre-wrap">
                {meal.text || <span className="text-ink-faint">Ikke fylt ut</span>}
              </p>
            </div>
          ),
        )}
      </div>
    </article>
  );
}
