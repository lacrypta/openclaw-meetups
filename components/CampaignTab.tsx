"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CampaignCreateDialog } from "./CampaignCreateDialog";
import { CampaignProgress } from "./CampaignProgress";
import { CampaignResults } from "./CampaignResults";
import { useCampaigns, useCampaignDetail } from "@/hooks/useCampaigns";
import type { EmailJob, EmailJobSegment } from "@/lib/types";

const segmentLabel: Record<EmailJobSegment, string> = {
  "checked-in": "Checked In",
  "no-show": "No Show",
  waitlist: "Waitlist",
  custom: "Custom",
};

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
    event_id: string;
    segment: EmailJobSegment;
    template_id: string;
    subject: string;
    integration_id: string;
  }) => {
    const campaign = await createCampaign(params);
    // Auto-send after creation
    setSendingId(campaign.id);
    try {
      await sendCampaign(campaign.id);
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
    // Auto-send after retry
    setSendingId(id);
    try {
      await sendCampaign(id);
    } finally {
      setSendingId(null);
    }
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
        <h2 className="text-lg font-semibold">Campaigns</h2>
        <Button onClick={() => setCreateOpen(true)} disabled={!!activeCampaign || !!sendingId}>
          New Campaign
        </Button>
      </div>

      {/* Active campaign progress */}
      {activeCampaign && detailCampaign && detailCampaign.status === "running" && (
        <CampaignProgress
          campaign={detailCampaign}
          onCancel={handleCancel}
          onRefresh={handleRefreshDetail}
        />
      )}

      {/* Sending indicator for non-running states */}
      {sendingId && !activeCampaign && (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Starting campaign...</p>
        </Card>
      )}

      {/* Campaign history */}
      {campaigns.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground text-sm">
          No campaigns yet. Create one to send emails to your attendees.
        </Card>
      ) : (
        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <CampaignHistoryRow
              key={campaign.id}
              campaign={campaign}
              expanded={expandedId === campaign.id}
              onToggle={() =>
                setExpandedId(expandedId === campaign.id ? null : campaign.id)
              }
              sends={expandedId === campaign.id ? sends : []}
              onRetry={handleRetry}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CampaignCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        eventId={eventId}
        onSubmit={handleCreate}
      />
    </div>
  );
}

function CampaignHistoryRow({
  campaign,
  expanded,
  onToggle,
  sends,
  onRetry,
}: {
  campaign: EmailJob;
  expanded: boolean;
  onToggle: () => void;
  sends: import("@/lib/types").EmailSend[];
  onRetry: (id: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
      >
        <Badge
          variant="secondary"
          className={`text-xs shrink-0 ${statusColor[campaign.status] || ""}`}
        >
          {campaign.status}
        </Badge>
        <Badge variant="outline" className="text-xs shrink-0">
          {segmentLabel[campaign.segment] || campaign.segment}
        </Badge>
        <span className="text-sm truncate flex-1">{campaign.subject}</span>
        <span className="text-xs text-muted-foreground shrink-0">
          {campaign.sent_count}/{campaign.total_contacts}
        </span>
        <span className="text-xs text-muted-foreground shrink-0">
          {new Date(campaign.created_at).toLocaleDateString()}
        </span>
      </button>

      {expanded && (
        <div className="border-t p-4">
          <CampaignResults
            campaign={campaign}
            sends={sends}
            onRetry={onRetry}
          />
        </div>
      )}
    </Card>
  );
}
