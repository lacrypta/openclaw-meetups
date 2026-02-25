"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { EventWithCounts } from "../lib/types";

interface EventCardProps {
  event: EventWithCounts;
}

const statusVariant: Record<string, string> = {
  draft: "bg-muted-foreground/20 text-muted-foreground",
  published: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
  completed: "bg-primary/20 text-primary",
};

export function EventCard({ event }: EventCardProps) {
  const capacityPct = event.capacity
    ? Math.min((event.attendee_count / event.capacity) * 100, 100)
    : 0;

  return (
    <Link href={`/dashboard/events/${event.id}`} className="no-underline">
      <Card className="p-6 cursor-pointer transition-colors hover:border-white/20">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-foreground text-lg font-semibold m-0">
            {event.name}
          </h3>
          <Badge
            variant="secondary"
            className={cn(
              "text-[0.7rem] font-semibold uppercase shrink-0 ml-2",
              statusVariant[event.status]
            )}
          >
            {event.status}
          </Badge>
        </div>

        <div className="text-muted-foreground text-sm mb-2">
          {new Date(event.date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}{" "}
          {new Date(event.date).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

        {event.location && (
          <div className="text-muted-foreground/60 text-xs mb-4">
            {event.location}
          </div>
        )}

        {event.capacity && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{event.attendee_count} registered</span>
              <span>{event.capacity} capacity</span>
            </div>
            <Progress
              value={capacityPct}
              className="h-1"
            />
          </div>
        )}

        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>{event.approved_count} approved</span>
          <span>{event.checked_in_count} checked in</span>
        </div>
      </Card>
    </Link>
  );
}
