"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getRoleFromToken, getUserFromToken, type UserRole } from "@/lib/auth";

const navItems: { label: string; href: string; icon: string; minRole: UserRole; speakerOnly?: boolean }[] = [
  { label: "Overview", href: "/dashboard", icon: "📊", minRole: "manager" },
  { label: "Events", href: "/dashboard/events", icon: "📅", minRole: "manager" },
  { label: "Users", href: "/dashboard/users", icon: "👥", minRole: "admin" },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: "📨", minRole: "manager" },
  { label: "Talks", href: "/dashboard/talks", icon: "🎤", minRole: "guest", speakerOnly: true },
  { label: "WhatsApp", href: "/dashboard/whatsapp", icon: "💬", minRole: "manager" },
  { label: "Model Tester", href: "/dashboard/model-tester", icon: "🧪", minRole: "manager" },
  { label: "Templates", href: "/dashboard/templates", icon: "✉️", minRole: "manager" },
  { label: "Logs", href: "/dashboard/logs", icon: "📋", minRole: "admin" },
  { label: "Settings", href: "/dashboard/settings", icon: "⚙️", minRole: "admin" },
];

const roleHierarchy: Record<UserRole, number> = { guest: 0, manager: 1, admin: 2 };

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const userRole = getRoleFromToken() || 'guest';
  // speakerOnly items are visible to managers/admins OR any logged-in user (speaker status checked client-side)
  // We show Talks to anyone logged in (guest+) and also to managers/admins always

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const isManagerOrAdmin = roleHierarchy[userRole] >= roleHierarchy['manager'];

  const visibleItems = navItems.filter((item) => {
    if (roleHierarchy[userRole] < roleHierarchy[item.minRole]) return false;
    if (item.speakerOnly && !isManagerOrAdmin) {
      // Show Talks link to all logged-in users (they'll see the page which handles speaker check)
      return true;
    }
    return true;
  });

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
        {visibleItems.map((item) => (
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
