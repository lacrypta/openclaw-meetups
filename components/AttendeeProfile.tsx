"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getToken } from "../lib/auth";
import type { Attendee, AttendeeStatus } from "../lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AttendeeEvent {
  event_id: string;
  event_name: string;
  event_date: string;
  status: AttendeeStatus;
  checked_in: boolean;
  registered_at: string;
}

interface AttendeeProfileProps {
  attendeeId: string;
}

const statusVariant: Record<string, string> = {
  approved: "bg-success/20 text-success",
  waitlist: "bg-warning/20 text-warning",
  declined: "bg-destructive/20 text-destructive",
};

export function AttendeeProfile({ attendeeId }: AttendeeProfileProps) {
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [events, setEvents] = useState<AttendeeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) return;

      setLoading(true);
      try {
        const contactsRes = await fetch("/api/contacts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (contactsRes.ok) {
          const { contacts } = await contactsRes.json();
          const found = contacts.find((c: any) => String(c.id) === String(attendeeId));
          if (found) {
            setAttendee({
              id: found.id,
              name: found.name,
              email: found.email,
              pubkey: found.pubkey || null,
            });
          }
        }

        const eventsRes = await fetch("/api/events", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (eventsRes.ok) {
          const { events: allEvents } = await eventsRes.json();
          const attendeeEvents: AttendeeEvent[] = [];

          for (const evt of allEvents) {
            const eaRes = await fetch(`/api/events/${evt.id}/attendees`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (eaRes.ok) {
              const { attendees: eventAttendees } = await eaRes.json();
              const match = eventAttendees.find(
                (ea: any) => String(ea.attendee_id) === String(attendeeId)
              );
              if (match) {
                attendeeEvents.push({
                  event_id: evt.id,
                  event_name: evt.name,
                  event_date: evt.date,
                  status: match.status,
                  checked_in: match.checked_in,
                  registered_at: match.registered_at,
                });
              }
            }
          }
          setEvents(attendeeEvents);
        }
      } catch (err) {
        console.error("Failed to load attendee profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [attendeeId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-8 space-y-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-32" />
        </Card>
        <Card className="p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </Card>
      </div>
    );
  }

  if (!attendee) {
    return (
      <div className="text-center py-12 text-destructive">Attendee not found</div>
    );
  }

  return (
    <div>
      <Card className="p-8 mb-6">
        <h1 className="text-2xl font-bold mb-3">{attendee.name}</h1>
        <div className="flex flex-col gap-1.5 text-sm">
          <div>
            <span className="text-muted-foreground">Email: </span>
            <span className="text-foreground">{attendee.email}</span>
          </div>
          {attendee.pubkey && (
            <div>
              <span className="text-muted-foreground">Pubkey: </span>
              <span className="text-muted-foreground/60 font-mono text-xs">
                {attendee.pubkey.slice(0, 16)}...{attendee.pubkey.slice(-8)}
              </span>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Event Activity</h2>

        {events.length === 0 ? (
          <div className="text-muted-foreground py-4">No event registrations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Checked In</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((evt) => (
                  <TableRow key={evt.event_id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/events/${evt.event_id}`}
                        className="text-primary no-underline"
                      >
                        {evt.event_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(evt.event_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs font-semibold",
                          statusVariant[evt.status] || "bg-muted text-muted-foreground"
                        )}
                      >
                        {evt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {evt.checked_in ? "✅" : "❌"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(evt.registered_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
