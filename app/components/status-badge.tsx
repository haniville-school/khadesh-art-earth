const COLORS: Record<string, string> = {
  paid: "var(--color-moss)",
  approved: "var(--color-moss)",
  pending: "var(--color-ochre)",
  processing: "var(--color-ochre)",
  shipped: "var(--color-plum)",
  delivered: "var(--color-moss)",
  cancelled: "#A14A3F",
  refunded: "#A14A3F",
};

export default function StatusBadge({ status }: { status: string }) {
  const color = COLORS[status] ?? "var(--color-ink-50)";
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full border"
      style={{ color, borderColor: color }}
    >
      {status}
    </span>
  );
}