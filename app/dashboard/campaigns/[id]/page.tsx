"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CampaignProgress } from "@/components/CampaignProgress";
import { CampaignResults } from "@/components/CampaignResults";
import { useCampaignDetail } from "@/hooks/useCampaigns";
import { useEvents } from "@/hooks/useEvents";
import { getToken } from "@/lib/auth";
import { composeEmail, AVAILABLE_VARIABLES, getSampleVariables } from "@/lib/email-composer";

const statusColor: Record<string, string> = {
  pending: "bg-muted-foreground/20 text-muted-foreground",
  running: "bg-blue-500/20 text-blue-400",
  partial: "bg-orange-500/20 text-orange-400",
  completed: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
  cancelled: "bg-muted-foreground/20 text-muted-foreground",
};

const SEGMENT_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "approved", label: "Aprobados" },
  { value: "waitlist", label: "Lista de espera" },
  { value: "checked-in", label: "Checked In" },
  { value: "no-show", label: "No Show" },
];

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const { campaign, sends, loading, refetch } = useCampaignDetail(campaignId);
  const { events } = useEvents();

  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // HTML editor state
  const [htmlContent, setHtmlContent] = useState("");
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiModel, setAiModel] = useState("anthropic/claude-sonnet-4.5");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [layoutHtml, setLayoutHtml] = useState<string | null>(null);
  const [templateSubject, setTemplateSubject] = useState("");


  // Test email state
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  // Load template HTML when campaign loads
  useEffect(() => {
    if (!campaign || templateLoaded) return;

    const loadTemplate = async () => {
      const config = (campaign.config || {}) as Record<string, unknown>;
      const subject = campaign.subject || "";
      setTemplateSubject(subject);

      // Check for custom HTML first
      if (typeof config.custom_html === "string" && config.custom_html) {
        setHtmlContent(config.custom_html);
        setTemplateLoaded(true);
      } else if (campaign.template_id) {
        // Fetch template from API
        try {
          const token = getToken();
          const res = await fetch(`/api/templates/${campaign.template_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setHtmlContent(data.template?.html_content || "");
            if (data.template?.email_layouts?.html_content) {
              setLayoutHtml(data.template.email_layouts.html_content);
            }
          }
        } catch {
          // Template fetch failed, leave empty
        }
        setTemplateLoaded(true);
      } else {
        setTemplateLoaded(true);
      }
    };

    loadTemplate();
  }, [campaign, templateLoaded]);

  // Generate preview HTML with sample variables
  const getPreviewHtml = useCallback(() => {
    if (!htmlContent) return "";
    const variableNames = AVAILABLE_VARIABLES.map((v) => v.name);
    const variables = {
      ...getSampleVariables(variableNames),
      subject: templateSubject || campaign?.subject || "",
    };
    const composed = composeEmail({
      template: { html_content: htmlContent, subject: templateSubject || campaign?.subject || "" },
      layout: layoutHtml ? { html_content: layoutHtml } : null,
      variables,
    });
    return composed.html;
  }, [htmlContent, layoutHtml, templateSubject, campaign?.subject]);

  // Memoize preview HTML for iframe srcDoc
  const previewHtml = getPreviewHtml();

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() || aiGenerating) return;
    setAiGenerating(true);
    setAiError(null);
    setAiProgress(10);

    const progressInterval = setInterval(() => {
      setAiProgress((prev) => Math.min(prev + Math.random() * 15, 90));
    }, 800);

    try {
      const token = getToken();
      const res = await fetch(`/api/campaigns/${campaignId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: aiPrompt, model: aiModel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Error generando email");
      } else if (data.html) {
        setHtmlContent(data.html);
        setAiModalOpen(false);
        setAiPrompt("");
      }
    } catch {
      setAiError("Error de conexión");
    } finally {
      clearInterval(progressInterval);
      setAiProgress(100);
      setTimeout(() => {
        setAiGenerating(false);
        setAiProgress(0);
      }, 300);
    }
  };

  const handleCopyVariable = async (varName: string) => {
    try {
      await navigator.clipboard.writeText(`{{${varName}}}`);
    } catch {
      // Fallback: just ignore
    }
  };

  const handleSaveHtml = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const token = getToken();
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ custom_html: htmlContent }),
      });
      if (res.ok) {
        setSaveMessage("✅ HTML guardado");
        refetch();
      } else {
        const data = await res.json();
        setSaveMessage(`❌ ${data.error || "Error al guardar"}`);
      }
    } catch {
      setSaveMessage("❌ Error al guardar");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) return;
    setTestSending(true);
    setTestMessage(null);
    try {
      const token = getToken();
      const res = await fetch(`/api/campaigns/${campaignId}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: testEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestMessage("✅ Email de prueba enviado");
      } else {
        setTestMessage(`❌ ${data.error || "Error al enviar"}`);
      }
    } catch {
      setTestMessage("❌ Error al enviar");
    } finally {
      setTestSending(false);
    }
  };

  const handleImport = async () => {
    if (!selectedEventId || !selectedSegment) return;

    setImporting(true);
    setImportMessage(null);

    try {
      const token = getToken();
      const response = await fetch(`/api/campaigns/${campaignId}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: selectedEventId,
          segment: selectedSegment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setImportMessage(`❌ ${data.error}`);
      } else {
        setImportMessage(
          `✅ ${data.imported} importados${data.skipped ? `, ${data.skipped} duplicados omitidos` : ""}`
        );
        refetch();
      }
    } catch {
      setImportMessage("❌ Error al importar");
    } finally {
      setImporting(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Error al enviar");
      }

      refetch();
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const token = getToken();
      await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "cancelled" }),
      });
      refetch();
    } finally {
      setCancelling(false);
    }
  };

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (loading || !campaign) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Back + title + test button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/campaigns")}>
          ← Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{campaign.name || campaign.subject}</h1>
          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setTestMessage(null);
            setTestDialogOpen(true);
          }}
        >
          🧪 Test Email
        </Button>
        <Badge
          variant="secondary"
          className={`text-sm ${statusColor[campaign.status] || ""}`}
        >
          {campaign.status}
        </Badge>
      </div>

      {/* Running progress */}
      {campaign.status === "running" && (
        <CampaignProgress
          campaign={campaign}
          onCancel={() => handleCancel()}
          onRefresh={handleRefresh}
        />
      )}

      {/* Audience builder — only for pending campaigns */}
      {campaign.status === "pending" && (
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">🎯 Audiencia</h2>
          <p className="text-sm text-muted-foreground">
            Importá contactos desde eventos. Podés importar de múltiples eventos (se deduplica por email).
          </p>

          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">Evento</label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar evento..." />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48 space-y-1">
              <label className="text-xs text-muted-foreground">Segmento</label>
              <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                <SelectTrigger>
                  <SelectValue placeholder="Segmento..." />
                </SelectTrigger>
                <SelectContent>
                  {SEGMENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleImport}
              disabled={!selectedEventId || !selectedSegment || importing}
            >
              {importing ? "Importando..." : "Importar"}
            </Button>
          </div>

          {importMessage && (
            <p className="text-sm">{importMessage}</p>
          )}

          {/* Send button */}
          {sends.length > 0 && (
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-4">
              <div>
                <p className="text-sm font-medium">Campaña lista para enviar</p>
                <p className="text-xs text-muted-foreground">
                  {campaign.total_contacts} destinatarios
                </p>
              </div>
              <Button
                onClick={handleSend}
                disabled={sending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {sending ? "Enviando..." : "📧 Enviar Campaña"}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Tabs: Contenido + Destinatarios */}
      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">✉️ Contenido del Email</TabsTrigger>
          <TabsTrigger value="recipients">👥 Destinatarios ({sends.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          {templateLoaded && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Contenido del Email</h2>
                <div className="flex items-center gap-2">
                  {saveMessage && <span className="text-sm">{saveMessage}</span>}
                  <Button onClick={() => setAiModalOpen(true)} variant="outline" size="sm">
                    🤖 Generar con AI
                  </Button>
                  <Button onClick={handleSaveHtml} disabled={saving} size="sm">
                    {saving ? "Guardando..." : "💾 Guardar HTML"}
                  </Button>
                </div>
              </div>

              {/* Available variables */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Variables disponibles (click para copiar):</p>
                <div className="flex flex-wrap gap-2">
                  {[...AVAILABLE_VARIABLES, { name: "subject", description: "Asunto del email", sample: "OpenClaw Meetup" }].map((v) => (
                    <Badge
                      key={v.name}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted transition-colors text-xs"
                      onClick={() => handleCopyVariable(v.name)}
                      title={v.description}
                    >
                      {`{{${v.name}}}`}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Editor + Preview side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* HTML Editor */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Editor HTML</label>
                  <textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    className="w-full h-[400px] rounded-md border bg-zinc-950 text-zinc-100 font-mono text-xs p-3 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    spellCheck={false}
                  />
                </div>

                {/* Live Preview */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Vista previa (con datos de ejemplo)</label>
                  <iframe
                    key={previewHtml.length}
                    sandbox=""
                    srcDoc={previewHtml}
                    className="w-full h-[400px] rounded-md border bg-white"
                    title="Email preview"
                  />
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recipients">
          <Card className="p-6">
            <CampaignResults
              campaign={campaign}
              sends={sends}
              templateHtml={htmlContent || undefined}
              templateSubject={templateSubject || campaign.subject}
              layoutHtml={layoutHtml}
              onRetry={async (id) => {
                const token = getToken();
                await fetch(`/api/campaigns/${id}/retry`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                });
                refetch();
              }}
              onRemoveRecipient={async (sendId) => {
                const token = getToken();
                const res = await fetch(`/api/campaigns/${campaignId}/recipients/${sendId}`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) refetch();
              }}
            />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Email Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>🧪 Enviar Email de Prueba</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Se enviará el email con datos de ejemplo al email indicado.
            </p>
            <Input
              type="email"
              placeholder="email@ejemplo.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            {testMessage && <p className="text-sm">{testMessage}</p>}
            <Button
              onClick={handleTestEmail}
              disabled={!testEmail || testSending}
              className="w-full"
            >
              {testSending ? "Enviando..." : "📧 Enviar Test"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* AI Generate Modal */}
      <Dialog open={aiModalOpen} onOpenChange={(open) => { if (!aiGenerating) setAiModalOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>🤖 Generar Email con AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Modelo</label>
              <Select value={aiModel} onValueChange={setAiModel} disabled={aiGenerating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anthropic/claude-sonnet-4.5">Claude Sonnet 4.5</SelectItem>
                  <SelectItem value="anthropic/claude-haiku-4.5">Claude Haiku 4.5</SelectItem>
                  <SelectItem value="anthropic/claude-opus-4.5">Claude Opus 4.5</SelectItem>
                  <SelectItem value="openai/gpt-4.1">GPT-4.1</SelectItem>
                  <SelectItem value="openai/gpt-4.1-mini">GPT-4.1 Mini</SelectItem>
                  <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                  <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Prompt</label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ej: Email de invitación al OpenClaw Meetup 2, 27 de marzo en La Crypta. Tono profesional pero cercano, con agenda del evento y CTA para registrarse en luma.com/openclaw2"
                rows={5}
                disabled={aiGenerating}
              />
            </div>

            {aiGenerating && (
              <div className="space-y-2">
                <Progress value={aiProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">Generando email...</p>
              </div>
            )}

            {aiError && (
              <p className="text-sm text-red-400">❌ {aiError}</p>
            )}

            <Button
              onClick={handleAiGenerate}
              disabled={aiGenerating || !aiPrompt.trim()}
              className="w-full"
            >
              {aiGenerating ? "Generando..." : "🤖 Generar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
