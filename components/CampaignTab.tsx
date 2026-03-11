"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CampaignCreateDialog } from "./CampaignCreateDialog";
import { CampaignProgress } from "./CampaignProgress";
import { CampaignResults } from "./CampaignResults";
import { useCampaigns, useCampaignDetail } from "@/hooks/useCampaigns";
import type { EmailJob } from "@/lib/types";

const statusColor: Record<string, string> = {
  pending: "bg-muted-foreground/20 text-muted-foreground",
  running: "bg-blue-500/20 text-blue-400",
  partial: "bg-orange-500/20 text-orange-400",
  completed: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
  cancelled: "bg-muted-foreground/20 text-muted-foreground",
};

interface CampaignTabProps {
  eventId: string;
}

export function CampaignTab({ eventId }: CampaignTabProps) {
  const {
    campaigns,
    loading,
    refetch,
    createCampaign,
    cancelCampaign,
    sendCampaign,
    retryCampaign,
  } = useCampaigns(eventId);

  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const activeCampaign = campaigns.find((c) => c.status === "running");
  const detailId = expandedId || activeCampaign?.id || null;
  const { campaign: detailCampaign, sends, refetch: refetchDetail } = useCampaignDetail(detailId);

  const handleCreate = async (params: {
    name: string;
    template_id: string;
    subject: string;
    integration_id: string;
  }) => {
    const campaign = await createCampaign({
      ...params,
      event_id: eventId,
    });
    setExpandedId(campaign.id);
  };

  const handleSend = async (id: string) => {
    setSendingId(id);
    try {
      await sendCampaign(id);
      refetchDetail();
    } finally {
      setSendingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    await cancelCampaign(id);
    refetchDetail();
  };

  const handleRetry = async (id: string) => {
    await retryCampaign(id);
    refetchDetail();
  };

  const handleRefreshDetail = useCallback(() => {
    refetchDetail();
    refetch();
  }, [refetchDetail, refetch]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Campañas</h2>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/campaigns">
            <Button variant="outline" size="sm">Ver todas</Button>
          </Link>
          <Button onClick={() => setCreateOpen(true)} disabled={!!activeCampaign || !!sendingId}>
            Nueva Campaña
          </Button>
        </div>
      </div>

      {/* Active campaign progress */}
      {activeCampaign && detailCampaign && detailCampaign.status === "running" && (
        <CampaignProgress
          campaign={detailCampaign}
          onCancel={handleCancel}
          onRefresh={handleRefreshDetail}
        />
      )}

      {/* Campaign history */}
      {campaigns.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground text-sm">
          No hay campañas para este evento todavía.
        </Card>
      ) : (
        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="overflow-hidden">
              <button
                onClick={() =>
                  setExpandedId(expandedId === campaign.id ? null : campaign.id)
                }
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
              >
                <Badge
                  variant="secondary"
                  className={`text-xs shrink-0 ${statusColor[campaign.status] || ""}`}
                >
                  {campaign.status}
                </Badge>
                <span className="text-sm truncate flex-1">
                  {campaign.name || campaign.subject}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {campaign.sent_count}/{campaign.total_contacts}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(campaign.created_at).toLocaleDateString()}
                </span>
                <Link
                  href={`/dashboard/campaigns/${campaign.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-blue-400 hover:underline shrink-0"
                >
                  Abrir →
                </Link>
              </button>

              {expandedId === campaign.id && (
                <div className="border-t p-4 space-y-4">
                  {campaign.status === "pending" && (
                    <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Campaña lista para enviar
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.total_contacts} destinatarios
                        </p>
                      </div>
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleSend(campaign.id); }}
                        disabled={sendingId === campaign.id || campaign.total_contacts === 0}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {sendingId === campaign.id ? "Enviando..." : "📧 Enviar"}
                      </Button>
                    </div>
                  )}
                  <CampaignResults
                    campaign={campaign}
                    sends={sends}
                    onRetry={handleRetry}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CampaignCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
