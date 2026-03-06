"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WebhookLog {
  id: string;
  provider: string;
  event_type: string | null;
  status: string;
  request_body: unknown;
  response_status: number | null;
  error_message: string | null;
  processing_time_ms: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  success: "bg-green-500/10 text-green-500 border-green-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
  processing: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  received: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export default function LogsPage() {
  const { token, ready } = useAuth();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (filter !== "all") params.set("provider", filter);
      const res = await fetch(`/api/webhook-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => {
    if (ready) fetchLogs();
  }, [ready, fetchLogs]);

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Webhook Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Incoming webhook requests from integrations
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          ↻ Refresh
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        {["all", "luma", "wasender"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {loading && (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      )}

      {!loading && logs.length === 0 && (
        <p className="text-muted-foreground text-center py-8">
          No webhook logs yet
        </p>
      )}

      <div className="space-y-2">
        {logs.map((log) => (
          <Card
            key={log.id}
            className={cn(
              "p-4 cursor-pointer transition-colors hover:bg-accent/5",
              expandedId === log.id && "ring-1 ring-primary/30"
            )}
            onClick={() =>
              setExpandedId(expandedId === log.id ? null : log.id)
            }
          >
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className={cn("text-xs font-mono", statusColors[log.status])}
              >
                {log.status}
              </Badge>
              <Badge variant="outline" className="text-xs font-mono">
                {log.provider}
              </Badge>
              {log.event_type && (
                <span className="text-xs text-muted-foreground font-mono">
                  {log.event_type}
                </span>
              )}
              <span className="flex-1" />
              {log.processing_time_ms != null && (
                <span className="text-xs text-muted-foreground">
                  {log.processing_time_ms}ms
                </span>
              )}
              {log.response_status && (
                <span
                  className={cn(
                    "text-xs font-mono",
                    log.response_status < 300
                      ? "text-green-500"
                      : "text-red-500"
                  )}
                >
                  {log.response_status}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>

            {log.error_message && (
              <p className="text-xs text-red-400 mt-1">{log.error_message}</p>
            )}

            {log.metadata && expandedId !== log.id && (() => {
              const m = log.metadata as Record<string, unknown>;
              return (
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  {m.guest_name ? <span>👤 {String(m.guest_name)}</span> : null}
                  {m.guest_email ? <span>📧 {String(m.guest_email)}</span> : null}
                  {m.event_name ? <span>📅 {String(m.event_name)}</span> : null}
                </div>
              );
            })()}

            {expandedId === log.id && (
              <div className="mt-4 space-y-3">
                {log.metadata && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Metadata
                    </p>
                    <pre className="text-xs bg-muted/30 p-3 rounded overflow-x-auto max-h-40">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Request Body
                  </p>
                  <pre className="text-xs bg-muted/30 p-3 rounded overflow-x-auto max-h-60">
                    {JSON.stringify(log.request_body, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
