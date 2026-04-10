"use client";

import { useState, useEffect, useCallback } from "react";
import { getToken } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WhatsAppProvider } from "@/lib/types";

interface ProviderIntegration {
  id: string;
  config: Record<string, any>;
}

const PROVIDERS: { value: WhatsAppProvider; label: string; description: string }[] = [
  { value: "wasender", label: "WaSender", description: "WaSender API for WhatsApp messaging" },
  { value: "kapso", label: "Kapso", description: "Kapso WhatsApp Cloud API (Meta)" },
];

export function WhatsAppIntegrationTab() {
  const token = getToken();
  const [provider, setProvider] = useState<WhatsAppProvider>("wasender");
  const [integration, setIntegration] = useState<ProviderIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sendOnNewGuest, setSendOnNewGuest] = useState(false);

  // WaSender fields
  const [apiKey, setApiKey] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  // Kapso fields
  const [kapsoApiKey, setKapsoApiKey] = useState("");
  const [kapsoPhoneNumberId, setKapsoPhoneNumberId] = useState("");
  const [kapsoPhoneNumber, setKapsoPhoneNumber] = useState("");
  const [kapsoWebhookSecret, setKapsoWebhookSecret] = useState("");

  // Master prompt
  const [masterPrompt, setMasterPrompt] = useState("");
  const [promptSaving, setPromptSaving] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);

  // Detect which provider is currently active
  const detectActiveProvider = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Check both providers
      const [wasRes, kapsoRes] = await Promise.all([
        fetch("/api/integrations/wasender", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/integrations/kapso", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const wasData = wasRes.ok ? await wasRes.json() : null;
      const kapsoData = kapsoRes.ok ? await kapsoRes.json() : null;

      if (kapsoData?.integration) {
        setProvider("kapso");
        setIntegration(kapsoData.integration);
        const cfg = kapsoData.integration.config;
        setKapsoPhoneNumberId(cfg.phone_number_id || "");
        setKapsoPhoneNumber(cfg.phone_number || "");
        setSendOnNewGuest(cfg.send_whatsapp_on_new_guest ?? false);
      } else if (wasData?.integration) {
        setProvider("wasender");
        setIntegration(wasData.integration);
        const cfg = wasData.integration.config;
        setPhoneNumber(cfg.phone_number || "");
        setWebhookSecret(cfg.webhook_secret || "");
        setSendOnNewGuest(cfg.send_whatsapp_on_new_guest ?? false);
      } else {
        setIntegration(null);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load WhatsApp integration" });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { detectActiveProvider(); }, [detectActiveProvider]);

  useEffect(() => {
    (async () => {
      const t = getToken();
      if (!t) return;
      try {
        const res = await fetch("/api/master-prompt", { headers: { Authorization: `Bearer ${t}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.prompt?.content) setMasterPrompt(data.prompt.content);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const handleVerify = async () => {
    if (!token) return;
    setVerifying(true);
    setMessage(null);
    try {
      if (provider === "kapso") {
        const res = await fetch("/api/integrations/kapso/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ api_key: kapsoApiKey, phone_number_id: kapsoPhoneNumberId }),
        });
        const data = await res.json();
        setMessage(data.valid
          ? { type: "success", text: "Kapso API key verified!" }
          : { type: "error", text: data.error || "Invalid API key or phone number ID" });
      } else {
        const res = await fetch("/api/integrations/wasender/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ api_key: apiKey }),
        });
        const data = await res.json();
        setMessage(data.valid
          ? { type: "success", text: "WaSender API key verified!" }
          : { type: "error", text: data.error || "Invalid API key" });
      }
    } catch {
      setMessage({ type: "error", text: "Verification failed" });
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setMessage(null);
    try {
      const endpoint = provider === "kapso" ? "/api/integrations/kapso" : "/api/integrations/wasender";
      const body = provider === "kapso"
        ? { api_key: kapsoApiKey, phone_number_id: kapsoPhoneNumberId, phone_number: kapsoPhoneNumber, send_whatsapp_on_new_guest: sendOnNewGuest }
        : { api_key: apiKey, phone_number: phoneNumber, webhook_secret: webhookSecret, send_whatsapp_on_new_guest: sendOnNewGuest };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Save failed" });
        return;
      }
      setMessage({ type: "success", text: `${provider === "kapso" ? "Kapso" : "WaSender"} integration saved!` });
      setApiKey("");
      setKapsoApiKey("");
      setEditing(false);
      detectActiveProvider();
    } catch {
      setMessage({ type: "error", text: "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!token) return;
    const endpoint = provider === "kapso" ? "/api/integrations/kapso" : "/api/integrations/wasender";
    try {
      await fetch(endpoint, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setIntegration(null);
      setApiKey("");
      setKapsoApiKey("");
      setKapsoPhoneNumberId("");
      setKapsoPhoneNumber("");
      setPhoneNumber("");
      setSendOnNewGuest(false);
      setMessage({ type: "success", text: "WhatsApp integration disconnected" });
    } catch {
      setMessage({ type: "error", text: "Failed to disconnect" });
    }
  };

  const handleProviderSwitch = (p: WhatsAppProvider) => {
    setProvider(p);
    setEditing(false);
    setMessage(null);
    // If switching to a provider that has no integration, show edit mode
    if (!integration || (p === "kapso" && integration.config?.phone_number_id === undefined) || (p === "wasender" && integration.config?.phone_number_id !== undefined)) {
      setEditing(true);
    }
  };

  const toggleSendOnNewGuest = async () => {
    const newVal = !sendOnNewGuest;
    setSendOnNewGuest(newVal);
    if (!integration || !token) return;
    try {
      const endpoint = provider === "kapso" ? "/api/integrations/kapso" : "/api/integrations/wasender";
      const body = provider === "kapso"
        ? { api_key: integration.config?.api_key || kapsoApiKey, phone_number_id: kapsoPhoneNumberId || integration.config?.phone_number_id, phone_number: kapsoPhoneNumber || integration.config?.phone_number, send_whatsapp_on_new_guest: newVal }
        : { api_key: integration.config?.api_key || apiKey, phone_number: phoneNumber || integration.config?.phone_number, webhook_secret: webhookSecret || integration.config?.webhook_secret, send_whatsapp_on_new_guest: newVal };
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
    } catch { /* silent */ }
  };

  const webhookUrl = provider === "kapso"
    ? "https://openclaw.lacrypta.ar/api/webhooks/kapso"
    : "https://openclaw.lacrypta.ar/api/webhooks/wasender";

  const canVerify = provider === "kapso"
    ? kapsoApiKey.trim() && kapsoPhoneNumberId.trim()
    : apiKey.trim();

  const canSave = provider === "kapso"
    ? kapsoApiKey.trim() && kapsoPhoneNumberId.trim()
    : apiKey.trim();

  if (loading) return <div className="text-muted-foreground p-4">Loading...</div>;

  return (
    <div className="space-y-4 py-4">
      {message && (
        <div className={`px-4 py-2 rounded-md text-sm ${
          message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        }`}>
          {message.text}
        </div>
      )}

      {/* Provider selector */}
      <Card>
        <CardContent className="py-4">
          <p className="text-sm font-medium mb-3">WhatsApp Provider</p>
          <div className="flex gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.value}
                onClick={() => handleProviderSwitch(p.value)}
                className={`flex-1 rounded-md border px-3 py-2 text-left transition-colors ${
                  provider === p.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connection card */}
      <Card>
        <CardContent className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{provider === "kapso" ? "Kapso" : "WaSender"} API</p>
              <p className="text-xs text-muted-foreground">
                {provider === "kapso"
                  ? "Connect your Kapso account to send WhatsApp messages via Meta Cloud API."
                  : "Connect your WaSender account to send WhatsApp messages."}
              </p>
            </div>
            {integration && !editing && (
              <span className="text-xs text-green-500 font-medium">● Connected</span>
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
              {provider === "kapso" && integration.config.phone_number_id && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone Number ID</p>
                  <code className="text-xs bg-muted/40 rounded px-3 py-1.5 font-mono">
                    {integration.config.phone_number_id}
                  </code>
                </div>
              )}
              {integration.config.phone_number && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
                  <code className="text-xs bg-muted/40 rounded px-3 py-1.5 font-mono">
                    {integration.config.phone_number}
                  </code>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
                <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-red-500">Disconnect</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">API Key</label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder={provider === "kapso" ? "Enter your Kapso API key" : "Enter your WaSender API key"}
                    value={provider === "kapso" ? kapsoApiKey : apiKey}
                    onChange={(e) => provider === "kapso" ? setKapsoApiKey(e.target.value) : setApiKey(e.target.value)}
                    className="text-sm font-mono"
                  />
                  <Button variant="outline" size="sm" onClick={handleVerify} disabled={verifying || !canVerify}>
                    {verifying ? "Verifying..." : "Verify"}
                  </Button>
                </div>
              </div>

              {provider === "kapso" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Phone Number ID</label>
                  <Input
                    type="text"
                    placeholder="Meta WhatsApp phone number ID"
                    value={kapsoPhoneNumberId}
                    onChange={(e) => setKapsoPhoneNumberId(e.target.value)}
                    className="text-sm font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Found in your Kapso dashboard under Phone Numbers.
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Phone Number <span className="text-muted-foreground/50">(display)</span>
                </label>
                <Input
                  type="text"
                  placeholder="+5491100000000"
                  value={provider === "kapso" ? kapsoPhoneNumber : phoneNumber}
                  onChange={(e) => provider === "kapso" ? setKapsoPhoneNumber(e.target.value) : setPhoneNumber(e.target.value)}
                  className="text-sm font-mono"
                />
              </div>

              {provider === "wasender" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Webhook Secret <span className="text-muted-foreground/50">(optional)</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="Your webhook secret for signature verification"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    className="text-sm font-mono"
                  />
                </div>
              )}

              {provider === "kapso" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Webhook Secret <span className="text-muted-foreground/50">(optional, HMAC-SHA256)</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="HMAC secret for webhook signature verification"
                    value={kapsoWebhookSecret}
                    onChange={(e) => setKapsoWebhookSecret(e.target.value)}
                    className="text-sm font-mono"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving || !canSave}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                {editing && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send on new guest toggle */}
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
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                sendOnNewGuest ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Master Prompt */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <div>
            <p className="text-sm font-medium">AI Master Prompt</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              System prompt used by the AI to handle WhatsApp conversations.
            </p>
          </div>
          <textarea
            value={masterPrompt}
            onChange={(e) => { setMasterPrompt(e.target.value); setPromptSaved(false); }}
            rows={10}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground font-mono resize-y min-h-[120px]"
            placeholder="Enter the system prompt for the AI messaging engine..."
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={promptSaving || !masterPrompt.trim()}
              onClick={async () => {
                const t = getToken();
                if (!t) return;
                setPromptSaving(true);
                try {
                  const res = await fetch("/api/master-prompt", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
                    body: JSON.stringify({ content: masterPrompt }),
                  });
                  if (res.ok) {
                    setPromptSaved(true);
                    setTimeout(() => setPromptSaved(false), 3000);
                  }
                } catch { /* ignore */ }
                setPromptSaving(false);
              }}
            >
              {promptSaving ? "Saving..." : promptSaved ? "Saved" : "Save Prompt"}
            </Button>
            {promptSaved && <span className="text-xs text-green-500">Prompt updated</span>}
          </div>
        </CardContent>
      </Card>

      {/* Webhook URL */}
      <Card>
        <CardContent className="py-4 space-y-2">
          <p className="text-sm font-medium">Webhook URL</p>
          <p className="text-xs text-muted-foreground">
            {provider === "kapso"
              ? "Register this URL in your Kapso dashboard to receive incoming messages:"
              : "Paste this URL in your WaSender session webhook settings to receive incoming messages:"}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted/40 rounded px-3 py-2 font-mono break-all">
              {webhookUrl}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(webhookUrl)}
            >
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
