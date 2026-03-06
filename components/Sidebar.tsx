"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: "📊" },
  { label: "Events", href: "/dashboard/events", icon: "📅" },
  { label: "Users", href: "/dashboard/users", icon: "👥" },
  { label: "Templates", href: "/dashboard/templates", icon: "✉️" },
  { label: "Settings", href: "/dashboard/settings", icon: "⚙️" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <nav
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[260px] bg-card border-r border-border py-4 transition-transform duration-200 ease-in-out",
          "lg:static lg:translate-x-0 lg:w-[220px] lg:shrink-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-4 pb-6 border-b border-border mb-2 flex items-center justify-between">
          <Link href="/dashboard" className="text-foreground font-bold text-lg" onClick={onClose}>
            OpenClaw CRM
          </Link>
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground text-xl p-1"
            onClick={onClose}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 py-3 px-4 mx-2 my-1 rounded-md text-sm transition-all",
              isActive(item.href)
                ? "text-foreground bg-primary/20 font-semibold"
                : "text-muted-foreground font-normal hover:text-foreground hover:bg-secondary"
            )}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
