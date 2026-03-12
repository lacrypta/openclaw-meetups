"use client";

import { ReactNode, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNostr } from "../hooks/useNostr";
import { useProfile } from "../hooks/useProfile";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { pubkey, logout: dashboardLogout } = useAuth();
  const { pubkey: nostrPubkey, logout: nostrLogout } = useNostr();
  const { profile } = useProfile(nostrPubkey || pubkey);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    dashboardLogout();
    nostrLogout();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 sm:px-8 py-3 flex justify-between items-center">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-foreground text-xl p-1 -ml-1"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          {/* Spacer for desktop (sidebar visible, no hamburger) */}
          <div className="hidden lg:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex gap-2 items-center cursor-pointer bg-transparent border-none outline-none hover:opacity-80 transition-opacity">
                <Avatar className="w-8 h-8">
                  {profile?.picture ? (
                    <AvatarImage src={profile.picture} alt="" />
                  ) : null}
                  <AvatarFallback className="text-base">👤</AvatarFallback>
                </Avatar>
                {profile?.display_name || profile?.name ? (
                  <span className="text-muted-foreground text-sm hidden sm:inline">
                    {profile.display_name || profile.name}
                  </span>
                ) : pubkey ? (
                  <span className="text-muted-foreground text-sm hidden sm:inline">
                    {pubkey.slice(0, 8)}...{pubkey.slice(-8)}
                  </span>
                ) : null}
                <span className="text-muted-foreground text-xs">▼</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                👤 Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-400">
                🚪 Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 text-foreground overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
