import { SOURCE_LABELS, type SourceKey } from "@/lib/format";

const STYLES: Record<SourceKey, string> = {
  SKOLE: "bg-skole-soft text-skole",
  UNGDOMSSKOLE: "bg-ungdomsskole-soft text-ungdomsskole",
  BARNEHAGE: "bg-barnehage-soft text-barnehage",
};

export default function NoticePill({
  source,
  text,
}: {
  source: SourceKey;
  text: string;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-baseline gap-1.5 rounded-full px-3 py-1 text-[13px] leading-snug ${STYLES[source]}`}
    >
      <span className="font-medium">{SOURCE_LABELS[source]}</span>
      <span className="opacity-90">{text}</span>
    </span>
  );
}
