import Link from "next/link";

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center pt-6 mt-6 border-t border-[var(--color-line)] text-sm">
      {currentPage > 1 ? (
        <Link href={buildHref(currentPage - 1)} className="text-[var(--color-plum)] underline underline-offset-4">
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-[var(--color-ink-50)]">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link href={buildHref(currentPage + 1)} className="text-[var(--color-plum)] underline underline-offset-4">
          Next
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}