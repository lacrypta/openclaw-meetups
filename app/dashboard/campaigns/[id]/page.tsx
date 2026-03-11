"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CampaignProgress } from "@/components/CampaignProgress";
import { CampaignResults } from "@/components/CampaignResults";
import { useCampaignDetail } from "@/hooks/useCampaigns";
import { useEvents } from "@/hooks/useEvents";
import { getToken } from "@/lib/auth";

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
      {/* Back + title */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/campaigns")}>
          ← Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{campaign.name || campaign.subject}</h1>
          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
        </div>
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

      {/* Recipients / Results */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">
          Destinatarios ({sends.length})
        </h2>
        <CampaignResults
          campaign={campaign}
          sends={sends}
          onRetry={async (id) => {
            const token = getToken();
            await fetch(`/api/campaigns/${id}/retry`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            });
            refetch();
          }}
        />
      </Card>
    </div>
  );
}
