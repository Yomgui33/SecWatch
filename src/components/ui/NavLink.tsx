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
      className={`text-sm transition-colors ${
        isActive
          ? "text-text-primary font-medium"
          : "text-text-muted hover:text-text-secondary"
      }`}
    >
      {children}
    </Link>
  );
}
