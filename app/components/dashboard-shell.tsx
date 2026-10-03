import Link from "next/link";
import { ReactNode } from "react";

type NavItem = { href: string; label: string };

export function DashboardShell({
  title,
  subtitle,
  nav,
  children,
}: {
  title: string;
  subtitle?: string;
  nav?: NavItem[];
  children: ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl mb-1">{title}</h1>
      {subtitle && (
        <p className="text-[var(--color-ink-60)] mb-6 text-sm">{subtitle}</p>
      )}

      {nav && nav.length > 0 && (
        <div className="flex gap-5 mb-8 pb-3 border-b border-[var(--color-line)] text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[var(--color-ink-70)] hover:text-[var(--color-ink)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}