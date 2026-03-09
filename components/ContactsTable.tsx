"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Contact } from "../hooks/useContacts";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getToken } from "@/lib/auth";

interface ContactsTableProps {
  contacts: Contact[];
  onUpdateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  eventId?: string;
}

type SortField = "name" | "email" | "status" | "registered_at" | "checked_in" | "attendance_confirmed";
type SortDirection = "asc" | "desc";

const statusVariant: Record<string, string> = {
  approved: "bg-success/20 text-success border-success/40",
  waitlist: "bg-warning/20 text-warning border-warning/40",
  declined: "bg-destructive/20 text-destructive border-destructive/40",
};

export function ContactsTable({ contacts, onUpdateContact, eventId }: ContactsTableProps) {
  const [search, setSearch] = useState("");
  const [sendingAction, setSendingAction] = useState<string | null>(null);

  const handleSendConfirmation = async (contact: Contact) => {
    if (!eventId) return;
    const token = getToken();
    if (!token) return;

    setSendingAction(`email-${contact.id}`);
    try {
      const res = await fetch(`/api/events/${eventId}/attendees/send-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: contact.id }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.error}`);
        return;
      }

      onUpdateContact(contact.id, { attendance_confirmed: true } as any);
    } catch (err) {
      alert('Failed to send confirmation email');
    } finally {
      setSendingAction(null);
    }
  };

  const handleSendWhatsApp = async (contact: Contact) => {
    if (!eventId) return;
    const token = getToken();
    if (!token) return;

    setSendingAction(`whatsapp-${contact.id}`);
    try {
      const res = await fetch(`/api/events/${eventId}/attendees/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: contact.id }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.error}`);
        return;
      }

      alert(`WhatsApp sent to ${contact.phone}`);
    } catch (err) {
      alert('Failed to send WhatsApp');
    } finally {
      setSendingAction(null);
    }
  };

  const [sortField, setSortField] = useState<SortField>("registered_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    let filtered = contacts;

    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
      );
    }

    filtered = [...filtered].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === "registered_at") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (typeof aVal === "boolean") {
        aVal = aVal ? 1 : 0;
        bVal = bVal ? 1 : 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [contacts, search, sortField, sortDirection]);

  const columns: { field: SortField; label: string }[] = [
    { field: "name", label: "Name" },
    { field: "email", label: "Email" },
    { field: "status", label: "Status" },
    { field: "checked_in", label: "Checked In" },
    { field: "attendance_confirmed", label: "Confirmed" },
    { field: "registered_at", label: "Registered" },
  ];

  return (
    <div>
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(({ field, label }) => (
                <TableHead
                  key={field}
                  onClick={() => handleSort(field)}
                  className="cursor-pointer select-none"
                >
                  {label} {sortField === field && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Link
                    href={`/dashboard/users/${contact.id}`}
                    className="text-foreground no-underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {contact.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{contact.email}</TableCell>
                <TableCell>
                  {eventId ? (
                    <select
                      value={contact.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        onUpdateContact(contact.id, {
                          status: e.target.value as Contact["status"],
                        });
                      }}
                      className={cn(
                        "px-2 py-1 rounded-md text-xs font-semibold border cursor-pointer bg-transparent",
                        statusVariant[contact.status] || "bg-muted text-muted-foreground"
                      )}
                    >
                      <option value="approved">approved</option>
                      <option value="waitlist">waitlist</option>
                      <option value="declined">declined</option>
                    </select>
                  ) : (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs font-semibold",
                        statusVariant[contact.status] || "bg-muted text-muted-foreground"
                      )}
                    >
                      {contact.status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {eventId ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateContact(contact.id, { checked_in: !contact.checked_in });
                      }}
                      className="bg-transparent border-none cursor-pointer text-base"
                    >
                      {contact.checked_in ? "✅" : "❌"}
                    </button>
                  ) : (
                    <span>{contact.checked_in ? "✅" : "❌"}</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {contact.attendance_confirmed ? (
                    <Badge variant="secondary" className="bg-success/20 text-success text-xs">
                      ✅ Confirmed
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(contact.registered_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {eventId ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={sendingAction?.endsWith(contact.id) || false}
                        >
                          {sendingAction?.endsWith(contact.id) ? (
                            <span className="animate-spin text-xs">⏳</span>
                          ) : (
                            <span className="text-lg">⋯</span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/users/${contact.id}`} className="no-underline">
                            👤 View Profile
                          </Link>
                        </DropdownMenuItem>
                        {!contact.attendance_confirmed && (
                          <DropdownMenuItem
                            onClick={() => handleSendConfirmation(contact)}
                            disabled={sendingAction === `email-${contact.id}`}
                          >
                            📧 Send Confirmation Email
                          </DropdownMenuItem>
                        )}
                        {contact.phone && (
                          <DropdownMenuItem
                            onClick={() => handleSendWhatsApp(contact)}
                            disabled={sendingAction === `whatsapp-${contact.id}`}
                          >
                            💬 Send WhatsApp Confirmation
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Link
                      href={`/dashboard/users/${contact.id}`}
                      className="text-primary text-sm no-underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
