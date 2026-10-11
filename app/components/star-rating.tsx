export default function StarRating({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const filled = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span
      className={`text-[var(--color-ochre)] tracking-tight ${className}`}
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      {"★".repeat(filled)}
      <span className="text-[var(--color-line)]">{"★".repeat(5 - filled)}</span>
    </span>
  );
}