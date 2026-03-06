"use client";

import { useState, useEffect, useCallback } from "react";
import { getToken } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WaSenderIntegration {
  id: string;
  config: {
    api_key: string;
    phone_number: string;
    send_whatsapp_on_new_guest: boolean;
  };
}

export function WhatsAppIntegrationTab() {
  const token = getToken();
  const [integration, setIntegration] = useState<WaSenderIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendOnNewGuest, setSendOnNewGuest] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editing, setEditing] = useState(false);

  const loadIntegration = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/integrations/wasender", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const { integration: data } = await res.json();
      setIntegration(data);
      if (data?.config?.send_whatsapp_on_new_guest !== undefined) {
        setSendOnNewGuest(data.config.send_whatsapp_on_new_guest);
      }
      if (data?.config?.phone_number) {
        setPhoneNumber(data.config.phone_number);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load WhatsApp integration" });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadIntegration(); }, [loadIntegration]);

  const handleVerify = async () => {
    if (!apiKey.trim() || !token) return;
    setVerifying(true);
    setMessage(null);
    try {
      const res = await fetch("/api/integrations/wasender/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ api_key: apiKey }),
      });
      const data = await res.json();
      if (data.valid) {
        setMessage({ type: "success", text: "✅ API key verified successfully!" });
      } else {
        setMessage({ type: "error", text: data.error || "Invalid API key" });
      }
    } catch {
      setMessage({ type: "error", text: "Verification failed" });
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim() || !token) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/integrations/wasender", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          api_key: apiKey,
          phone_number: phoneNumber,
          send_whatsapp_on_new_guest: sendOnNewGuest,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Save failed" });
        return;
      }
      setMessage({ type: "success", text: "WhatsApp integration saved!" });
      setApiKey("");
      setEditing(false);
      loadIntegration();
    } catch {
      setMessage({ type: "error", text: "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!token) return;
    try {
      await fetch("/api/integrations/wasender", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setIntegration(null);
      setApiKey("");
      setPhoneNumber("");
      setSendOnNewGuest(false);
      setMessage({ type: "success", text: "WhatsApp integration disconnected" });
    } catch {
      setMessage({ type: "error", text: "Failed to disconnect" });
    }
  };

  const toggleSendOnNewGuest = async () => {
    const newVal = !sendOnNewGuest;
    setSendOnNewGuest(newVal);
    if (integration && token) {
      try {
        await fetch("/api/integrations/wasender", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            api_key: integration.config?.api_key || apiKey,
            phone_number: phoneNumber || integration.config?.phone_number || "",
            send_whatsapp_on_new_guest: newVal,
          }),
        });
      } catch { /* silent */ }
    }
  };

  if (loading) return <div className="text-muted-foreground p-4">Loading...</div>;

  return (
    <div className="space-y-4 py-4">
      {/* Status message */}
      {message && (
        <div className={`px-4 py-2 rounded-md text-sm ${
          message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        }`}>
          {message.text}
        </div>
      )}

      {/* Connection card */}
      <Card>
        <CardContent className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">WaSender API</p>
              <p className="text-xs text-muted-foreground">
                Connect your WaSender account to send WhatsApp messages.
              </p>
            </div>
            {integration && !editing && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-500 font-medium">● Connected</span>
              </div>
            )}
          </div>

          {integration && !editing ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">API Key</p>
                <code className="text-xs bg-muted/40 rounded px-3 py-1.5 font-mono">
                  {integration.config.api_key}
                </code>
              </div>
              {integration.config.phone_number && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
                  <code className="text-xs bg-muted/40 rounded px-3 py-1.5 font-mono">
                    {integration.config.phone_number}
                  </code>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-red-500">
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">API Key</label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Enter your WaSender API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="text-sm font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVerify}
                    disabled={verifying || !apiKey.trim()}
                  >
                    {verifying ? "Verifying..." : "Verify"}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Phone Number <span className="text-muted-foreground/50">(optional)</span>
                </label>
                <Input
                  type="text"
                  placeholder="+5491100000000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="text-sm font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving || !apiKey.trim()}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                {editing && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send WhatsApp on new guest toggle */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Send WhatsApp message on new guest</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                When enabled, new event attendees will receive a WhatsApp confirmation message.
              </p>
            </div>
            <button
              onClick={toggleSendOnNewGuest}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                sendOnNewGuest ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  sendOnNewGuest ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>
      {/* Webhook hint */}
      <Card>
        <CardContent className="py-4 space-y-2">
          <p className="text-sm font-medium">Webhook URL</p>
          <p className="text-xs text-muted-foreground">
            Paste this URL in your WaSender session webhook settings to receive incoming messages:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted/40 rounded px-3 py-2 font-mono break-all">
              https://openclaw.lacrypta.ar/api/webhooks/wasender
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { navigator.clipboard.writeText("https://openclaw.lacrypta.ar/api/webhooks/wasender"); }}
            >
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
