"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CampaignCreateDialog } from "@/components/CampaignCreateDialog";
import { useCampaigns } from "@/hooks/useCampaigns";

const statusColor: Record<string, string> = {
  pending: "bg-muted-foreground/20 text-muted-foreground",
  running: "bg-blue-500/20 text-blue-400",
  partial: "bg-orange-500/20 text-orange-400",
  completed: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
  cancelled: "bg-muted-foreground/20 text-muted-foreground",
};

export default function CampaignsPage() {
  const { campaigns, loading, createCampaign } = useCampaigns();
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();

  const handleCreate = async (params: {
    name: string;
    template_id: string;
    subject: string;
    integration_id: string;
  }) => {
    const campaign = await createCampaign(params);
    router.push(`/dashboard/campaigns/${campaign.id}`);
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📨 Campañas</h1>
        <Button onClick={() => setCreateOpen(true)}>Nueva Campaña</Button>
      </div>

      {campaigns.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No hay campañas todavía. Creá una para empezar a enviar emails.
        </Card>
      ) : (
        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className={`text-xs shrink-0 ${statusColor[campaign.status] || ""}`}
                >
                  {campaign.status}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {campaign.name || campaign.subject}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {campaign.subject}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm">
                    {campaign.sent_count}/{campaign.total_contacts}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CampaignCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
