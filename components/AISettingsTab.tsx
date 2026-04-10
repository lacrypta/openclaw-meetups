"use client";

import { useState, useEffect, useCallback } from "react";
import { getToken } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AIIntegration {
  id: string;
  config: {
    has_key: boolean;
    default_model: string;
    master_prompt: string;
    enabled: boolean;
  };
}

const MODELS = [
  { value: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5' },
  { value: 'anthropic/claude-haiku-4.5', label: 'Claude Haiku 4.5' },
  { value: 'anthropic/claude-opus-4.5', label: 'Claude Opus 4.5' },
  { value: 'openai/gpt-4o', label: 'GPT-4o' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'openai/gpt-4.1', label: 'GPT-4.1' },
  { value: 'openai/gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  { value: 'openai/o3-mini', label: 'o3-mini' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'xai/grok-3', label: 'Grok 3' },
  { value: 'xai/grok-3-mini', label: 'Grok 3 Mini' },
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
  { value: 'deepseek/deepseek-reasoner', label: 'DeepSeek Reasoner' },
  { value: 'meta/llama-4-maverick', label: 'Llama 4 Maverick' },
  { value: 'meta/llama-4-scout', label: 'Llama 4 Scout' },
];

export function AISettingsTab() {
  const token = getToken();
  const [integration, setIntegration] = useState<AIIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState("anthropic/claude-haiku-4.5");
  const [masterPrompt, setMasterPrompt] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editing, setEditing] = useState(false);

  const loadIntegration = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/integrations/ai", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const { integration: data } = await res.json();
      setIntegration(data);
      if (data?.config) {
        setDefaultModel(data.config.default_model || "anthropic/claude-haiku-4.5");
        setMasterPrompt(data.config.master_prompt || "");
        setEnabled(data.config.enabled ?? false);
      }
    } catch {
      setMessage({ type: "error", text: "Error al cargar configuración de AI" });
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
      const res = await fetch("/api/integrations/ai/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ api_key: apiKey }),
      });
      const data = await res.json();
      if (data.valid) {
        setMessage({ type: "success", text: "✅ API key verificada correctamente!" });
      } else {
        setMessage({ type: "error", text: data.error || "API key inválida" });
      }
    } catch {
      setMessage({ type: "error", text: "Error al verificar" });
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim() || !token) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/integrations/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          api_key: apiKey,
          default_model: defaultModel,
          master_prompt: masterPrompt,
          enabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Error al guardar" });
        return;
      }
      setMessage({ type: "success", text: "Configuración de AI guardada!" });
      setApiKey("");
      setEditing(false);
      loadIntegration();
    } catch {
      setMessage({ type: "error", text: "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!token) return;
    try {
      await fetch("/api/integrations/ai", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setIntegration(null);
      setApiKey("");
      setDefaultModel("anthropic/claude-haiku-4.5");
      setMasterPrompt("");
      setEnabled(false);
      setMessage({ type: "success", text: "Integración de AI desconectada" });
    } catch {
      setMessage({ type: "error", text: "Error al desconectar" });
    }
  };

  const toggleEnabled = async () => {
    const newVal = !enabled;
    setEnabled(newVal);
    if (integration && token && !editing) {
      try {
        await fetch("/api/integrations/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            api_key: apiKey || "KEEP_EXISTING",
            default_model: defaultModel,
            master_prompt: masterPrompt,
            enabled: newVal,
          }),
        });
      } catch { /* silent */ }
    }
  };

  if (loading) return <div className="text-muted-foreground p-4">Cargando...</div>;

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
              <p className="text-sm font-medium">Vercel AI Gateway</p>
              <p className="text-xs text-muted-foreground">
                Conectá tu API key de Vercel AI para respuestas automáticas.
              </p>
            </div>
            {integration && !editing && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-500 font-medium">● Conectado</span>
              </div>
            )}
          </div>

          {integration && !editing ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">API Key</p>
                <code className="text-xs bg-muted/40 rounded px-3 py-1.5 font-mono">
                  ••••••••••••••••
                </code>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Modelo por defecto</p>
                <code className="text-xs bg-muted/40 rounded px-3 py-1.5 font-mono">
                  {integration.config.default_model}
                </code>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-red-500">
                  Desconectar
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
                    placeholder="Ingresá tu Vercel AI API key"
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
                    {verifying ? "Verificando..." : "Verificar"}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Modelo por defecto</label>
                <select
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving || !apiKey.trim()}>
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
                {editing && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enable AI responses toggle */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Habilitar respuestas automáticas</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cuando está activo, el AI responde automáticamente a mensajes de WhatsApp.
              </p>
            </div>
            <button
              onClick={toggleEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
