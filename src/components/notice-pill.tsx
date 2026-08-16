export type CategoryLite = { id: string; name: string; color: string };

export default function NoticePill({
  category,
  text,
}: {
  category: CategoryLite;
  text: string;
}) {
  return (
    <span
      className="kategori inline-flex max-w-full items-baseline gap-1.5 rounded-full px-3 py-1 text-[13px] leading-snug"
      data-farge={category.color}
    >
      <span className="font-medium">{category.name}</span>
      <span className="opacity-90">{text}</span>
    </span>
  );
}
