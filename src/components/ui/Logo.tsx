"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Logo() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  if (!mounted) return <div className="w-[120px] h-[36px]" />;

  return (
    <Image
      src={dark ? "/logo_dark.png" : "/logo_light.png"}
      alt="SecWatch"
      width={120}
      height={36}
      className="h-9 w-auto"
      priority
    />
  );
}
