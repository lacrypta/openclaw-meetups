"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { checkNip07 } from "../lib/nostr";
import { useTranslation } from "../i18n/useTranslation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  loading: boolean;
  error: string | null;
  onNip07: () => void;
  onNsec: (nsec: string) => void;
  onBunker: (url: string) => void;
  onNostrConnect?: () => Promise<{ uri: string; promise: Promise<void>; abort: () => void }>;
  onLoginSuccess?: () => Promise<void>;
}

export function LoginScreen({ loading, error, onNip07, onNsec, onBunker, onNostrConnect, onLoginSuccess }: Props) {
  const { t } = useTranslation();
  const [hasExtension, setHasExtension] = useState(false);
  const [nsec, setNsec] = useState("");
  const [bunkerUrl, setBunkerUrl] = useState("");
  const [activeTab, setActiveTab] = useState("nip07");
  const [bunkerMode, setBunkerMode] = useState<"qr" | "manual">(onNostrConnect ? "qr" : "manual");
  const [connectUri, setConnectUri] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<(() => void) | null>(null);
  const onNostrConnectRef = useRef(onNostrConnect);
  onNostrConnectRef.current = onNostrConnect;
  const onLoginSuccessRef = useRef(onLoginSuccess);
  onLoginSuccessRef.current = onLoginSuccess;

  useEffect(() => {
    checkNip07().then(setHasExtension);
  }, []);

  // Only start nostrconnect when bunker tab is active AND in QR mode
  const qrActive = activeTab === "bunker" && bunkerMode === "qr";

  useEffect(() => {
    if (!qrActive || !onNostrConnectRef.current) return;

    let cancelled = false;

    onNostrConnectRef.current().then(({ uri, promise, abort }) => {
      if (cancelled) { abort(); return; }
      setConnectUri(uri);
      abortRef.current = abort;

      promise.then(() => {
        if (!cancelled) onLoginSuccessRef.current?.();
      }).catch(() => {
        // error handled by useNostr
      });
    });

    return () => {
      cancelled = true;
      abortRef.current?.();
      abortRef.current = null;
      setConnectUri(null);
    };
  }, [qrActive]);

  const handleCopyUri = async () => {
    if (!connectUri) return;
    try {
      await navigator.clipboard.writeText(connectUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSwitchToManual = () => {
    abortRef.current?.();
    setBunkerMode("manual");
    setConnectUri(null);
  };

  const handleSwitchToQr = () => {
    setBunkerMode("qr");
  };

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

        <Tabs defaultValue="nip07" onValueChange={setActiveTab} className="w-full">
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
            {bunkerMode === "qr" && onNostrConnect ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-muted-foreground text-sm text-center">
                  {t.login.bunkerQrDesc}
                </p>

                {connectUri ? (
                  <>
                    <div
                      className="bg-white p-3 rounded-lg cursor-pointer relative group"
                      onClick={handleCopyUri}
                      title={t.login.bunkerCopied}
                    >
                      <QRCode value={connectUri} size={200} level="M" />
                      {copied && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                          <span className="text-white text-sm font-medium">
                            {t.login.bunkerCopied}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      className="w-full !text-white"
                      asChild
                    >
                      <a href={connectUri}>
                        {t.login.bunkerOpenApp}
                      </a>
                    </Button>

                    <p className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                      {t.login.bunkerWaiting}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[200px]">
                    <span className="text-muted-foreground text-sm">{t.login.connecting}</span>
                  </div>
                )}

                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                  onClick={handleSwitchToManual}
                >
                  {t.login.bunkerManualLink}
                </button>
              </div>
            ) : (
              <div>
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
                {onNostrConnect && (
                  <div className="text-center mt-3">
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                      onClick={handleSwitchToQr}
                    >
                      {t.login.bunkerQrLink}
                    </button>
                  </div>
                )}
              </div>
            )}
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
