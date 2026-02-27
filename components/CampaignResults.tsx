"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EmailJob, EmailSend } from "@/lib/types";

interface CampaignResultsProps {
  campaign: EmailJob;
  sends: EmailSend[];
  onRetry?: (id: string) => void;
}

const statusBadge: Record<string, { className: string; label: string }> = {
  sent: { className: "bg-green-500/20 text-green-400", label: "Sent" },
  failed: { className: "bg-red-500/20 text-red-400", label: "Failed" },
  pending: { className: "bg-muted-foreground/20 text-muted-foreground", label: "Pending" },
  bounced: { className: "bg-orange-500/20 text-orange-400", label: "Bounced" },
};

export function CampaignResults({ campaign, sends, onRetry }: CampaignResultsProps) {
  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex gap-4 text-sm">
        <span className="text-green-400">
          Sent: {campaign.sent_count}
        </span>
        <span className="text-red-400">
          Failed: {campaign.failed_count}
        </span>
        <span className="text-muted-foreground">
          Total: {campaign.total_contacts}
        </span>
        {onRetry && campaign.failed_count > 0 && ["partial", "failed"].includes(campaign.status) && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => onRetry(campaign.id)}
          >
            Retry Failed
          </Button>
        )}
      </div>

      {/* Sends table */}
      {sends.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Sent At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sends.map((send) => {
                const badge = statusBadge[send.status] || statusBadge.pending;
                return (
                  <TableRow key={send.id}>
                    <TableCell className="font-mono text-xs">
                      {send.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${badge.className}`}
                      >
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {send.error || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {send.sent_at
                        ? new Date(send.sent_at).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
