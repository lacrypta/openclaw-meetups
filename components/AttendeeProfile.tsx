"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getToken } from "../lib/auth";
import type { User, AttendeeStatus } from "../lib/types";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface AttendeeEvent {
  event_id: string;
  event_name: string;
  event_date: string;
  status: AttendeeStatus;
  checked_in: boolean;
  registered_at: string;
}

interface WhatsAppMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

interface UserEmail {
  id: string;
  email: string;
  status: string;
  error: string | null;
  sent_at: string | null;
  created_at: string;
  attempts: number;
  job_id: string;
  email_jobs: { id: string; name: string | null; subject: string; status: string } | null;
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
  const [attendee, setAttendee] = useState<User | null>(null);
  const [events, setEvents] = useState<AttendeeEvent[]>([]);
  const [userEmails, setUserEmails] = useState<UserEmail[]>([]);
  const [waMessages, setWaMessages] = useState<WhatsAppMessage[]>([]);
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
              phone: found.phone || null,
              pubkey: found.pubkey || null,
              email_verified: found.email_verified || false,
              phone_verified: found.phone_verified || false,
              luma_id: found.luma_id || null,
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
                (ea: any) => ea.user_id === attendeeId
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

        // Fetch email history
        const emailsRes = await fetch(`/api/users/${attendeeId}/emails`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (emailsRes.ok) {
          const { emails } = await emailsRes.json();
          setUserEmails(emails);
        }

        // Fetch WhatsApp conversations
        const waRes = await fetch(`/api/users/${attendeeId}/whatsapp`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (waRes.ok) {
          const { messages } = await waRes.json();
          setWaMessages(messages);
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

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">📅 Eventos ({events.length})</TabsTrigger>
          <TabsTrigger value="emails">📧 Emails ({userEmails.length})</TabsTrigger>
          <TabsTrigger value="whatsapp">💬 WhatsApp ({waMessages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card className="p-6">
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
        </TabsContent>

        <TabsContent value="emails">
          <Card className="p-6">
            {userEmails.length === 0 ? (
              <div className="text-muted-foreground py-4">No se enviaron emails a este usuario.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaña</TableHead>
                      <TableHead>Asunto</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Intentos</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userEmails.map((em) => (
                      <TableRow key={em.id}>
                        <TableCell className="text-sm">
                          {em.email_jobs ? (
                            <Link
                              href={`/dashboard/campaigns/${em.email_jobs.id}`}
                              className="text-primary no-underline"
                            >
                              {em.email_jobs.name || "—"}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {em.email_jobs?.subject || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs font-semibold",
                              em.status === "sent" ? "bg-green-500/20 text-green-400" :
                              em.status === "failed" ? "bg-red-500/20 text-red-400" :
                              em.status === "bounced" ? "bg-orange-500/20 text-orange-400" :
                              "bg-muted text-muted-foreground"
                            )}
                          >
                            {em.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-center">{em.attempts}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {em.error || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {em.sent_at
                            ? new Date(em.sent_at).toLocaleString()
                            : new Date(em.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card className="p-6">
            {waMessages.length === 0 ? (
              <div className="text-muted-foreground py-4">No hay conversaciones de WhatsApp con este usuario.</div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {waMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      msg.role === "user"
                        ? "bg-muted ml-0 mr-auto"
                        : msg.role === "assistant"
                        ? "bg-primary/20 ml-auto mr-0"
                        : "bg-muted/50 mx-auto text-xs italic text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {msg.role === "user" ? "👤" : msg.role === "assistant" ? "🤖" : "⚙️"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
