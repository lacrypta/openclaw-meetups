"use client";

import { useState, useMemo } from "react";
import { StatsBar } from "./StatsBar";
import { ContactsTable } from "./ContactsTable";
import { EventForm } from "./EventForm";
import { useEvent } from "../hooks/useEvent";
import { useEventAttendees } from "../hooks/useEventAttendees";
import type { EventWithCounts } from "../lib/types";
import type { Contact } from "../hooks/useContacts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface EventDetailProps {
  eventId: string;
}

const statusVariant: Record<string, string> = {
  draft: "bg-muted-foreground/20 text-muted-foreground",
  published: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
  completed: "bg-primary/20 text-primary",
};

export function EventDetail({ eventId }: EventDetailProps) {
  const { event, loading: eventLoading, updateEvent } = useEvent(eventId);
  const { attendees, loading: attendeesLoading, updateAttendee } = useEventAttendees(eventId);
  const [editing, setEditing] = useState(false);

  const stats = useMemo(() => {
    if (!event) return [];
    return [
      { label: "Total Registered", value: event.attendee_count, color: "#7c3aed" },
      { label: "Approved", value: event.approved_count, color: "#34d399" },
      {
        label: "Waitlist",
        value: event.attendee_count - event.approved_count - attendees.filter((a) => a.status === "declined").length,
        color: "#fbbf24",
      },
      { label: "Checked In", value: event.checked_in_count, color: "#e879a8" },
    ];
  }, [event, attendees]);

  const contactsFromAttendees: Contact[] = useMemo(() => {
    return attendees.map((ea) => ({
      id: String(ea.attendee_id),
      name: ea.name,
      email: ea.email,
      pubkey: ea.pubkey || undefined,
      status: ea.status,
      checked_in: ea.checked_in,
      email_sent: ea.email_sent,
      email_type: ea.email_type || undefined,
      notes: ea.notes || undefined,
      registered_at: ea.registered_at,
    }));
  }, [attendees]);

  const handleUpdateContact = async (id: string, updates: Partial<Contact>) => {
    await updateAttendee(id, {
      status: updates.status,
      checked_in: updates.checked_in,
      notes: updates.notes,
    });
  };

  if (eventLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
        {/* Capacity card skeleton */}
        <Card className="p-4 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-1.5 w-full" />
        </Card>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
        {/* Attendees table skeleton */}
        <Card className="p-6 space-y-4">
          <Skeleton className="h-6 w-28" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </Card>
      </div>
    );
  }

  if (!event) {
    return <div className="text-center py-12 text-destructive">Event not found</div>;
  }

  const capacityPct = event.capacity
    ? Math.min((event.attendee_count / event.capacity) * 100, 100)
    : 0;

  return (
    <div>
      {/* Event header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[1.75rem] font-bold mb-2">{event.name}</h1>
          <div className="flex gap-4 flex-wrap text-muted-foreground text-sm">
            <span>
              {new Date(event.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              {new Date(event.date).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {event.location && <span>{event.location}</span>}
          </div>
          {event.description && (
            <p className="text-muted-foreground/60 mt-3 text-sm">{event.description}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-semibold uppercase",
              statusVariant[event.status]
            )}
          >
            {event.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
      </div>

      {/* Capacity bar */}
      {event.capacity && (
        <Card className="p-4 mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>
              Capacity: {event.attendee_count} / {event.capacity}
            </span>
            <span>{Math.round(capacityPct)}%</span>
          </div>
          <Progress value={capacityPct} className="h-1.5" />
        </Card>
      )}

      <StatsBar stats={stats} loading={attendeesLoading} />

      {/* Attendees table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Attendees</h2>
        {attendeesLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <ContactsTable
            contacts={contactsFromAttendees}
            onUpdateContact={handleUpdateContact}
            eventId={eventId}
          />
        )}
      </Card>

      {editing && (
        <EventForm
          title="Edit Event"
          initial={{
            name: event.name,
            description: event.description || "",
            date: event.date.slice(0, 16),
            location: event.location || "",
            capacity: event.capacity?.toString() || "",
            status: event.status,
          }}
          onSubmit={async (data) => {
            await updateEvent(data);
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
