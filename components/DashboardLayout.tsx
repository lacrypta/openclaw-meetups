"use client";

import { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNostr } from "../hooks/useNostr";
import { useProfile } from "../hooks/useProfile";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { pubkey, logout: dashboardLogout } = useAuth();
  const { pubkey: nostrPubkey, logout: nostrLogout } = useNostr();
  const { profile } = useProfile(nostrPubkey || pubkey);

  const handleLogout = () => {
    dashboardLogout();
    nostrLogout();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-8 py-3 flex justify-end items-center">
          <div className="flex gap-2 items-center">
            <Avatar className="w-8 h-8">
              {profile?.picture ? (
                <AvatarImage src={profile.picture} alt="" />
              ) : null}
              <AvatarFallback className="text-base">👤</AvatarFallback>
            </Avatar>
            {profile?.display_name || profile?.name ? (
              <span className="text-muted-foreground text-sm">
                {profile.display_name || profile.name}
              </span>
            ) : pubkey ? (
              <span className="text-muted-foreground text-sm">
                {pubkey.slice(0, 8)}...{pubkey.slice(-8)}
              </span>
            ) : null}
            <Button variant="outline" size="sm" className="text-xs" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>
        {/* Content */}
        <main className="flex-1 p-8 text-foreground">{children}</main>
      </div>
    </div>
  );
}
