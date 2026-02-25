"use client";

import { useState, useEffect } from "react";
import { checkNip07 } from "../lib/nostr";
import { useTranslation } from "../i18n/useTranslation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface Props {
  loading: boolean;
  error: string | null;
  onNip07: () => void;
  onNsec: (nsec: string) => void;
  onBunker: (url: string) => void;
}

export function LoginScreen({ loading, error, onNip07, onNsec, onBunker }: Props) {
  const { t } = useTranslation();
  const [hasExtension, setHasExtension] = useState(false);
  const [nsec, setNsec] = useState("");
  const [bunkerUrl, setBunkerUrl] = useState("");

  useEffect(() => {
    checkNip07().then(setHasExtension);
  }, []);

  return (
    <div className="flex items-center justify-center">
      <Card className="p-10 max-w-[440px] w-full shadow-[0_0_40px_rgba(124,58,237,0.15)]">
        <div className="text-5xl text-center mb-2">⚡</div>
        <h1 className="text-foreground text-center text-[28px] font-bold m-0">
          {t.login.title}
        </h1>
        <p className="text-muted-foreground text-center mt-1 mb-6">
          {t.login.subtitle}
        </p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="nip07" className="w-full">
          <TabsList className="w-full mb-5">
            <TabsTrigger value="nip07" className="flex-1 text-[13px]">
              🔌 {t.login.extensionTab}
            </TabsTrigger>
            <TabsTrigger value="bunker" className="flex-1 text-[13px]">
              🔐 {t.login.bunkerTab}
            </TabsTrigger>
            <TabsTrigger value="nsec" className="flex-1 text-[13px]">
              🔑 {t.login.nsecTab}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nip07" className="min-h-[140px]">
            <p className="text-muted-foreground text-sm mb-4">
              {hasExtension ? t.login.extensionDetected : t.login.extensionNotFound}
            </p>
            <Button
              className="w-full"
              onClick={onNip07}
              disabled={loading || !hasExtension}
            >
              {loading ? t.login.connecting : t.login.connectExtension}
            </Button>
          </TabsContent>

          <TabsContent value="bunker" className="min-h-[140px]">
            <p className="text-muted-foreground text-sm mb-4">{t.login.bunkerDesc}</p>
            <Input
              className="mb-3"
              placeholder="bunker://pubkey?relay=wss://..."
              value={bunkerUrl}
              onChange={(e) => setBunkerUrl(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={() => onBunker(bunkerUrl)}
              disabled={loading || !bunkerUrl}
            >
              {loading ? t.login.connecting : t.login.connectBunker}
            </Button>
          </TabsContent>

          <TabsContent value="nsec" className="min-h-[140px]">
            <Alert className="mb-4 bg-warning/20 border-warning/40 text-warning">
              <AlertDescription className="text-[13px] font-medium">
                ⚠️ {t.login.nsecWarning}
              </AlertDescription>
            </Alert>
            <Input
              className="mb-3"
              type="password"
              placeholder="nsec1..."
              value={nsec}
              onChange={(e) => setNsec(e.target.value)}
            />
            <Button
              className="w-full bg-accent hover:bg-accent/80"
              onClick={() => onNsec(nsec)}
              disabled={loading || !nsec}
            >
              {loading ? t.login.connecting : t.login.loginNsec}
            </Button>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
