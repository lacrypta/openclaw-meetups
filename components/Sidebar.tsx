"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: "📊" },
  { label: "Events", href: "/dashboard/events", icon: "📅" },
  { label: "Attendees", href: "/dashboard/attendees", icon: "👥" },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <nav className="w-[220px] min-h-screen bg-card border-r border-border py-4 shrink-0">
      <div className="px-4 pb-6 border-b border-border mb-2">
        <Link href="/dashboard" className="text-foreground font-bold text-lg">
          OpenClaw CRM
        </Link>
      </div>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
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
  );
}
