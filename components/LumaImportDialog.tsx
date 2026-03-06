"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LumaEvent {
  api_id: string;
  name: string;
  start_at?: string;
  cover_url?: string;
  description?: string;
  geo_address_info?: { full_address?: string; city?: string; country?: string };
}

interface LumaImportDialogProps {
  onClose: () => void;
  onImported: () => void;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLocation(event: LumaEvent): string {
  const g = event.geo_address_info;
  if (!g) return "—";
  return g.full_address || (g.city && g.country ? `${g.city}, ${g.country}` : g.city || g.country || "—");
}

export function LumaImportDialog({ onClose, onImported }: LumaImportDialogProps) {
  const { token } = useAuth();
  const [events, setEvents] = useState<LumaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    setMessage(null);
    try {
      const res = await fetch("/api/integrations/luma/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to load events" });
        return;
      }
      setMessage(null);
      setEvents(data.events || []);
    } catch {
      setMessage({ type: "error", text: "Failed to load Luma events" });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleImport = async (api_id: string) => {
    setImporting(api_id);
    setMessage(null);
    try {
      const res = await fetch("/api/events/import-luma", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ luma_event_id: api_id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Import failed" });
        return;
      }
      setMessage({ type: "success", text: `Event "${data.event?.name}" imported successfully!` });
      setTimeout(() => {
        onImported();
        onClose();
      }, 1500);
    } catch {
      setMessage({ type: "error", text: "Import request failed" });
    } finally {
      setImporting(null);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Event from Luma</DialogTitle>
        </DialogHeader>

        {message && (
          <div
            className={`px-4 py-3 rounded-md text-sm ${
              message.type === "success"
                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                : "bg-red-500/10 text-red-500 border border-red-500/20"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading Luma events...
            </div>
          )}

          {!loading && events.length === 0 && !message && (
            <div className="text-center py-8 text-muted-foreground">
              No upcoming events found in Luma
            </div>
          )}

          {events.map((event) => (
            <div
              key={event.api_id}
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/10 transition-colors"
            >
              {event.cover_url && (
                <img
                  src={event.cover_url}
                  alt={event.name}
                  className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{event.name}</p>
                <p className="text-sm text-muted-foreground">{formatDate(event.start_at)}</p>
                <p className="text-sm text-muted-foreground truncate">{getLocation(event)}</p>
              </div>
              <Button
                size="sm"
                onClick={() => handleImport(event.api_id)}
                disabled={importing === event.api_id}
              >
                {importing === event.api_id ? "Importing..." : "Import"}
              </Button>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
