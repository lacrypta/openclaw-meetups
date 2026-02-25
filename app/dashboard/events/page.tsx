"use client";

import { useState } from "react";
import { useEvents } from "@/hooks/useEvents";
import { EventCard } from "@/components/EventCard";
import { EventForm } from "@/components/EventForm";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { EventStatus } from "@/lib/types";

const statusFilters: { label: string; value: EventStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function EventsPage() {
  const [filter, setFilter] = useState<EventStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);

  const { events, loading, error, createEvent } = useEvents(
    filter === "all" ? undefined : { status: filter }
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <Button onClick={() => setShowForm(true)}>+ Create Event</Button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {statusFilters.map((sf) => (
          <Button
            key={sf.value}
            variant={filter === sf.value ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter(sf.value)}
          >
            {sf.label}
          </Button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-2 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </Card>
          ))}
        </div>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No events found. Create your first event!
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {showForm && (
        <EventForm
          onSubmit={async (data) => {
            await createEvent(data);
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
