"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useNostr } from "@/hooks/useNostr";
import { useProfile } from "@/hooks/useProfile";
import { Dashboard } from "@/components/DashboardPage";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, ready, pubkey, logout: dashboardLogout } = useAuth();
  const { pubkey: nostrPubkey, logout: nostrLogout } = useNostr();
  const { profile } = useProfile(nostrPubkey || pubkey);

  const loggingOut = React.useRef(false);

  useEffect(() => {
    if (ready && !isAuthenticated && !loggingOut.current) {
      router.push("/login");
    }
  }, [ready, isAuthenticated, router]);

  const handleLogout = () => {
    loggingOut.current = true;
    dashboardLogout();
    nostrLogout();
    router.push("/");
  };

  if (!ready || !isAuthenticated) {
    return null;
  }

  return <Dashboard onLogout={handleLogout} profile={profile} />;
}
