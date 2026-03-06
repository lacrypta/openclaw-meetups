"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface LumaEvent {
  api_id: string;
  name: string;
  start_at: string;
}

interface LumaIntegration {
  id: string;
  provider: string;
  name: string;
  is_active: boolean;
  config: {
    api_key: string | null;
    base_url: string;
    webhook_secret?: string;
  };
}

const WEBHOOK_URL = "https://openclaw.lacrypta.ar/api/webhooks/luma";

export function LumaIntegrationTab() {
  const { token, ready } = useAuth();

  const [integration, setIntegration] = useState<LumaIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lumaEvents, setLumaEvents] = useState<LumaEvent[] | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editing, setEditing] = useState(false);

  const fetchIntegration = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch("/api/integrations/luma", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const { integration: data } = await res.json();
      setIntegration(data);
    } catch {
      setMessage({ type: "error", text: "Failed to load Luma integration" });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!ready) return;
    fetchIntegration();
  }, [ready, fetchIntegration]);

  const handleVerify = async () => {
    if (!apiKey.trim()) return;
    setVerifying(true);
    setMessage(null);
    setLumaEvents(null);
    try {
      const res = await fetch("/api/integrations/luma/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ api_key: apiKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Verification failed" });
        return;
      }
      setLumaEvents(data.events || []);
      setMessage({ type: "success", text: `API key verified! ${data.event_count} event(s) found.` });
    } catch {
      setMessage({ type: "error", text: "Verification request failed" });
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/integrations/luma", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ api_key: apiKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Save failed" });
        return;
      }
      setMessage({ type: "success", text: "Luma integration saved!" });
      setApiKey("");
      setLumaEvents(null);
      setEditing(false);
      await fetchIntegration();
    } catch {
      setMessage({ type: "error", text: "Save request failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Luma integration?")) return;
    try {
      const res = await fetch("/api/integrations/luma", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Disconnect failed" });
        return;
      }
      setMessage({ type: "success", text: "Luma integration disconnected" });
      setIntegration(null);
      setEditing(false);
    } catch {
      setMessage({ type: "error", text: "Disconnect request failed" });
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading Luma integration...</div>;
  }

  const isConnected = integration?.is_active;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Luma Integration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect Luma to import events and sync guests automatically
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-500/10 text-green-500 border border-green-500/20"
              : "bg-red-500/10 text-red-500 border border-red-500/20"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Connected state */}
      {isConnected && !editing && (
        <Card>
          <CardContent className="py-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-lg">✅</span>
                <span className="font-medium">Connected</span>
              </div>
              <p className="text-sm text-muted-foreground">
                API Key: {integration.config.api_key || "****"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setEditing(true); setMessage(null); }}>
                Update Key
              </Button>
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input form */}
      {(!isConnected || editing) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editing ? "Update API Key" : "Connect Luma Account"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Luma API Key</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="luma-api-key-..."
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setLumaEvents(null); }}
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  onClick={handleVerify}
                  disabled={verifying || !apiKey.trim()}
                >
                  {verifying ? "Verifying..." : "Verify"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://lu.ma/settings/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-500 hover:underline"
                >
                  lu.ma/settings/developers
                </a>
              </p>
            </div>

            {lumaEvents !== null && (
              <div className="rounded-md bg-muted/30 p-3 space-y-2">
                <p className="text-sm font-medium text-green-500">✅ API Key Valid</p>
                {lumaEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events found in your Luma account</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">{lumaEvents.length} event(s) found:</p>
                    <ul className="space-y-1">
                      {lumaEvents.map((ev) => (
                        <li key={ev.api_id} className="text-sm text-foreground">
                          • {ev.name} {ev.start_at ? `— ${new Date(ev.start_at).toLocaleDateString()}` : ''}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving || !apiKey.trim()}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
              {editing && (
                <Button
                  variant="outline"
                  onClick={() => { setEditing(false); setApiKey(""); setLumaEvents(null); setMessage(null); }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhook hint */}
      <Card>
        <CardContent className="py-4 space-y-2">
          <p className="text-sm font-medium">Webhook URL</p>
          <p className="text-xs text-muted-foreground">
            Paste this URL in your Luma event settings under Webhooks to receive real-time guest updates:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted/40 rounded px-3 py-2 font-mono break-all">
              {WEBHOOK_URL}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { navigator.clipboard.writeText(WEBHOOK_URL); }}
            >
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
