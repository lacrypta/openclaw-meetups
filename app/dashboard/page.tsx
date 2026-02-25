"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useEvents } from "@/hooks/useEvents";
import { useContacts } from "@/hooks/useContacts";
import { EventCard } from "@/components/EventCard";
import { StatsBar } from "@/components/StatsBar";
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

const statusVariant: Record<string, string> = {
  approved: "bg-success/20 text-success",
  waitlist: "bg-warning/20 text-warning",
  declined: "bg-destructive/20 text-destructive",
};

export default function DashboardOverviewPage() {
  const { events, loading: eventsLoading } = useEvents();
  const { contacts, loading: contactsLoading } = useContacts();

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => new Date(e.date) >= now && e.status !== "cancelled")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [events]);

  const overallStats = useMemo(
    () => [
      { label: "Total Events", value: events.length, color: "#7c3aed" },
      { label: "Active Events", value: events.filter((e) => e.status === "published").length, color: "#34d399" },
      { label: "Total Attendees", value: contacts.length, color: "#e879a8" },
      { label: "Total Check-ins", value: events.reduce((sum, e) => sum + e.checked_in_count, 0), color: "#fbbf24" },
    ],
    [events, contacts]
  );

  const recentRegistrations = useMemo(() => {
    return [...contacts]
      .sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime())
      .slice(0, 8);
  }, [contacts]);

  const loading = eventsLoading || contactsLoading;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Overview</h1>

      {loading ? (
        <div className="space-y-6">
          {/* Stat cards skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </Card>
            ))}
          </div>
          {/* Upcoming events skeleton */}
          <div>
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
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
          </div>
          {/* Recent registrations skeleton */}
          <div>
            <Skeleton className="h-6 w-48 mb-4" />
            <Card className="p-0 overflow-hidden">
              <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <>
          <StatsBar stats={overallStats} />

          {/* Upcoming events */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Upcoming Events</h2>
              <Link href="/dashboard/events" className="text-primary text-sm">
                View all →
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <Card className="p-6 text-muted-foreground">
                No upcoming events.{" "}
                <Link href="/dashboard/events" className="text-primary">
                  Create one
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>

          {/* Recent registrations */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Registrations</h2>
              <Link href="/dashboard/attendees" className="text-primary text-sm">
                View all →
              </Link>
            </div>
            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRegistrations.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link href={`/dashboard/attendees/${c.id}`} className="text-foreground">
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs font-semibold",
                            statusVariant[c.status] || "bg-muted text-muted-foreground"
                          )}
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(c.registered_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
