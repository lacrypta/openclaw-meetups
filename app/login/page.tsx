"use client";

import { useRouter } from "next/navigation";
import { useNostr } from "@/hooks/useNostr";
import { useAuth } from "@/hooks/useAuth";
import { LoginScreen } from "@/components/LoginScreen";
import { login as authLogin } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { loading, error, loginNip07, loginNsec, loginBunker } = useNostr();
  const { recheckAuth } = useAuth();

  const handleLoginSuccess = async () => {
    try {
      await authLogin();
      recheckAuth();
      router.push("/dashboard");
    } catch (err) {
      console.error("Dashboard auth failed after Nostr login:", err);
    }
  };

  const handleNip07 = async () => {
    await loginNip07();
    await handleLoginSuccess();
  };

  const handleNsec = async (nsec: string) => {
    await loginNsec(nsec);
    await handleLoginSuccess();
  };

  const handleBunker = async (url: string) => {
    await loginBunker(url);
    await handleLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <LoginScreen
        loading={loading}
        error={error}
        onNip07={handleNip07}
        onNsec={handleNsec}
        onBunker={handleBunker}
      />
    </div>
  );
}
