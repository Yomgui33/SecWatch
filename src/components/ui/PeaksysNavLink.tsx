"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NavLink from "@/components/ui/NavLink";
import { refreshPeaksysUnread, usePeaksysUnread } from "@/components/peaksys/unreadStore";

const POLL_INTERVAL_MS = 5 * 60_000;

export default function PeaksysNavLink() {
  const unread = usePeaksysUnread();
  const pathname = usePathname();

  // Rafraîchir à chaque navigation (les éléments ont pu être lus depuis le Brief)
  useEffect(() => {
    refreshPeaksysUnread();
  }, [pathname]);

  useEffect(() => {
    const id = setInterval(() => refreshPeaksysUnread(), POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshPeaksysUnread();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const hasAlert = unread !== null && unread > 0;

  return (
    <NavLink href="/peaksys">
      <span className="inline-flex items-center gap-1.5">
        Peaksys
        {hasAlert && (
          <span
            className="relative inline-flex"
            title={`${unread} élément${unread > 1 ? "s" : ""} non lu${unread > 1 ? "s" : ""} sur les dernières 24 h`}
          >
            <span className="absolute inset-0 rounded-full bg-red-600 opacity-60 animate-ping" />
            <span className="relative inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-none">
              {unread > 99 ? "99+" : unread}
            </span>
          </span>
        )}
      </span>
    </NavLink>
  );
}
