"use client";

import { useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EmailJob } from "@/lib/types";

interface CampaignProgressProps {
  campaign: EmailJob;
  onCancel: (id: string) => void;
  onRefresh: () => void;
}

export function CampaignProgress({
  campaign,
  onCancel,
  onRefresh,
}: CampaignProgressProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (campaign.status === "running") {
      intervalRef.current = setInterval(onRefresh, 2000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [campaign.status, onRefresh]);

  const processed = campaign.sent_count + campaign.failed_count;
  const total = campaign.total_contacts;
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;
  const remaining = total - processed;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Sending Campaign</h3>
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
            {campaign.status}
          </Badge>
        </div>
        {campaign.status === "running" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(campaign.id)}
          >
            Cancel
          </Button>
        )}
      </div>

      <Progress value={pct} className="h-2" />

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="text-green-400">Sent: {campaign.sent_count}</span>
        {campaign.failed_count > 0 && (
          <span className="text-red-400">Failed: {campaign.failed_count}</span>
        )}
        <span>Remaining: {remaining}</span>
        <span className="ml-auto">{pct}%</span>
      </div>
    </Card>
  );
}
