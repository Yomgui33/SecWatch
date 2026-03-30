"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  href: string;
  children: React.ReactNode;
}

export default function NavLink({ href, children }: Props) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`relative px-3 py-1.5 text-sm rounded-md transition-colors ${
        isActive
          ? "text-accent font-medium bg-accent-light"
          : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
      }`}
    >
      {children}
    </Link>
  );
}
