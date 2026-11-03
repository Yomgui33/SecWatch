"use client";

export function SectionHeader({
  title,
  count,
  icon,
  collapsed,
  onToggleCollapse,
  onMarkAllRead,
}: {
  title: string;
  count: number;
  icon: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onMarkAllRead: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <button
        onClick={onToggleCollapse}
        className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <span
          className={`text-[10px] text-text-muted transition-transform ${
            collapsed ? "" : "rotate-90"
          }`}
        >
          ▶
        </span>
        <span className="text-base">{icon}</span>
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">
          {title}
        </h3>
      </button>
      <span className="px-2 py-0.5 text-[11px] rounded-full bg-surface-alt text-text-muted font-medium">
        {count}
      </span>
      <button
        onClick={onMarkAllRead}
        className="ml-auto pill !py-1 !px-3 !text-[11px]"
      >
        Tout marquer lu
      </button>
    </div>
  );
}

export function MarkReadButton({ read, onToggle }: { read: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="mt-1 text-xs text-text-muted hover:text-accent transition-colors cursor-pointer"
    >
      {read ? "Marquer non lu" : "Marquer lu"}
    </button>
  );
}
