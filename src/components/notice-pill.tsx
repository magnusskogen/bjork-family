export type CategoryLite = { id: string; name: string; color: string };

export default function NoticePill({
  category,
  text,
  who = null,
}: {
  category: CategoryLite;
  text: string;
  /** Hvem beskjeden gjelder. Null betyr hele familien. */
  who?: string | null;
}) {
  return (
    <span
      className="kategori inline-flex max-w-full items-baseline gap-1.5 rounded-full px-3 py-1 text-[13px] leading-snug"
      data-farge={category.color}
    >
      <span className="font-medium">{category.name}</span>
      {who ? <span className="font-medium opacity-75">{who}</span> : null}
      <span className="opacity-90">{text}</span>
    </span>
  );
}
