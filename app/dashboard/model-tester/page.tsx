"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getToken } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MODEL_OPTIONS = [
  { value: "anthropic/claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
  { value: "anthropic/claude-haiku-4-5", label: "Claude Haiku 4.5" },
  { value: "anthropic/claude-opus-4-5", label: "Claude Opus 4.5" },
  { value: "openai/gpt-4o", label: "GPT-4o" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
];

interface MasterPrompt {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  tokens_in?: number;
  tokens_out?: number;
  created_at: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <div className={cn("flex mb-2", isUser ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[75%] px-3 py-2 rounded-2xl text-sm",
          isUser
            ? "bg-muted text-foreground rounded-tl-sm"
            : "bg-emerald-900/40 border border-emerald-800/30 text-foreground rounded-tr-sm"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        <div className={cn("flex items-center gap-2 mt-1", isUser ? "justify-start" : "justify-end")}>
          {!isUser && (msg.model || msg.tokens_in != null) && (
            <span className="text-[10px] text-muted-foreground">
              {msg.model}
              {msg.tokens_in != null && ` · ${msg.tokens_in}↑ ${msg.tokens_out ?? 0}↓`}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{formatTime(msg.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

export default function ModelTesterPage() {
  const [prompts, setPrompts] = useState<MasterPrompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [model, setModel] = useState(MODEL_OPTIONS[0].value);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [totalIn, setTotalIn] = useState(0);
  const [totalOut, setTotalOut] = useState(0);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptName, setPromptName] = useState("");
  const [showSave, setShowSave] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load master prompts
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch("/api/master-prompts", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const list: MasterPrompt[] = data.master_prompts || [];
        setPrompts(list);
        const def = list.find((p) => p.is_default) || list[0];
        if (def) {
          setSelectedPromptId(def.id);
          setSystemPrompt(def.content);
        }
      })
      .catch(() => {});
  }, []);

  const handlePromptSelect = (id: string) => {
    setSelectedPromptId(id);
    const p = prompts.find((pr) => pr.id === id);
    if (p) setSystemPrompt(p.content);
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;
    const token = getToken();
    if (!token) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/model-tester/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          system_prompt: systemPrompt,
          model,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${data.error || "Request failed"}`,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
        return;
      }

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content,
        model: data.model,
        tokens_in: data.tokens_in,
        tokens_out: data.tokens_out,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);
      setTotalIn((prev) => prev + (data.tokens_in || 0));
      setTotalOut((prev) => prev + (data.tokens_out || 0));
    } catch (err) {
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, systemPrompt, model]);

  const handleClear = () => {
    setMessages([]);
    setTotalIn(0);
    setTotalOut(0);
  };

  const handleGenerate = useCallback(async () => {
    if (sending) return;
    const token = getToken();
    if (!token) return;

    // Build messages: use existing conversation + optional instruction as a hidden user message
    const instruction = generatePrompt.trim() || "Generá un mensaje nuevo como si fueras el bot, continuando la conversación.";
    const apiMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: `[INSTRUCCIÓN INTERNA - no mostrar al usuario]: ${instruction}` },
    ];

    setSending(true);
    setShowGenerate(false);
    setGeneratePrompt("");

    try {
      const res = await fetch("/api/model-tester/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ system_prompt: systemPrompt, model, messages: apiMessages }),
      });
      const data = await res.json();

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.ok ? data.content : `Error: ${data.error || "Request failed"}`,
        model: res.ok ? data.model : undefined,
        tokens_in: data.tokens_in,
        tokens_out: data.tokens_out,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
      if (res.ok) {
        setTotalIn((prev) => prev + (data.tokens_in || 0));
        setTotalOut((prev) => prev + (data.tokens_out || 0));
      }
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setSending(false);
    }
  }, [sending, messages, systemPrompt, model, generatePrompt]);

  const handleSavePrompt = async () => {
    if (!promptName.trim() || !systemPrompt.trim()) return;
    const token = getToken();
    if (!token) return;
    setSavingPrompt(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/master-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: promptName.trim(), content: systemPrompt }),
      });
      if (res.ok) {
        const data = await res.json();
        const saved = data.master_prompt;
        setPrompts((prev) => [saved, ...prev]);
        setSelectedPromptId(saved.id);
        setSaveMsg("Prompt guardado");
        setShowSave(false);
        setPromptName("");
        setTimeout(() => setSaveMsg(null), 3000);
      }
    } catch {} finally {
      setSavingPrompt(false);
    }
  };

  const handleUpdateDefaultPrompt = async () => {
    const token = getToken();
    if (!token || !systemPrompt.trim()) return;
    try {
      await fetch("/api/master-prompt", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: systemPrompt }),
      });
      setSaveMsg("Prompt por defecto actualizado");
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {}
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left panel — config */}
      <div className="w-[340px] shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-bold text-base">Model Tester</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Test master prompts sin enviar mensajes reales</p>
        </div>

        <div className="p-4 space-y-4 flex-1">
          {/* Master prompt selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Master Prompt</label>
            <select
              value={selectedPromptId}
              onChange={(e) => handlePromptSelect(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">-- Seleccionar --</option>
              {prompts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.is_default ? "(default)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* System prompt editor */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={12}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground font-mono resize-y min-h-[120px]"
              placeholder="Ingresá el system prompt..."
            />
          </div>

          {/* Model selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Modelo</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {!showGenerate ? (
              <Button size="sm" className="w-full" onClick={() => setShowGenerate(true)} disabled={sending || !systemPrompt.trim()}>
                Generar mensaje del bot
              </Button>
            ) : (
              <div className="space-y-1.5">
                <Input
                  placeholder="Instrucción (vacío = continuar contexto)"
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  className="text-sm h-8"
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  autoFocus
                />
                <div className="flex gap-1.5">
                  <Button size="sm" className="flex-1" onClick={handleGenerate} disabled={sending}>
                    {sending ? "..." : "Generar"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowGenerate(false); setGeneratePrompt(""); }}>X</Button>
                </div>
              </div>
            )}

            <Button size="sm" variant="outline" className="w-full" onClick={handleUpdateDefaultPrompt}>
              Guardar como default
            </Button>

            {!showSave ? (
              <Button size="sm" variant="outline" className="w-full" onClick={() => setShowSave(true)}>
                Guardar como nuevo prompt
              </Button>
            ) : (
              <div className="flex gap-1.5">
                <Input
                  placeholder="Nombre del prompt"
                  value={promptName}
                  onChange={(e) => setPromptName(e.target.value)}
                  className="text-sm h-8"
                  onKeyDown={(e) => e.key === "Enter" && handleSavePrompt()}
                />
                <Button size="sm" onClick={handleSavePrompt} disabled={savingPrompt || !promptName.trim()}>
                  {savingPrompt ? "..." : "OK"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowSave(false)}>X</Button>
              </div>
            )}

            <Button size="sm" variant="outline" className="w-full text-red-400 hover:text-red-300" onClick={handleClear}>
              Limpiar chat
            </Button>
          </div>

          {saveMsg && <p className="text-xs text-green-500">{saveMsg}</p>}

          {/* Token stats */}
          {(totalIn > 0 || totalOut > 0) && (
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground mb-1">Tokens usados</p>
                <div className="flex gap-4 text-sm font-mono">
                  <span>{totalIn} ↑ in</span>
                  <span>{totalOut} ↓ out</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Right panel — chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-900/40 flex items-center justify-center text-lg">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm">Claudio (test)</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{MODEL_OPTIONS.find((m) => m.value === model)?.label || model}</span>
              <span>·</span>
              <span>{messages.length} msgs</span>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">Playground</Badge>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-background">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <div className="text-5xl mb-3">💬</div>
                <p className="text-sm">Enviá un mensaje para probar el bot</p>
                <p className="text-xs text-muted-foreground mt-1">Los mensajes no se guardan en la base de datos</p>
              </div>
            </div>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} msg={m} />)
          )}
          {sending && (
            <div className="flex justify-end mb-2">
              <div className="bg-emerald-900/40 border border-emerald-800/30 rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-muted-foreground animate-pulse">
                Pensando...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t p-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribir mensaje..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={sending || !systemPrompt.trim()}
          />
          <Button onClick={handleSend} disabled={sending || !input.trim() || !systemPrompt.trim()} size="sm">
            {sending ? "..." : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
