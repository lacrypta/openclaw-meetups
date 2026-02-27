"use client";

import { useState, useMemo } from "react";
import { useContacts } from "@/hooks/useContacts";
import { ContactsTable } from "@/components/ContactsTable";
import { StatsBar } from "@/components/StatsBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type FilterStatus = "all" | "approved" | "waitlist" | "checked_in";

export default function AttendeesPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const filters = useMemo(() => {
    if (filterStatus === "all") return {};
    if (filterStatus === "checked_in") return { checked_in: true };
    return { status: filterStatus };
  }, [filterStatus]);

  const { contacts, loading, error, refetch, updateContact } = useContacts(filters);

  const stats = useMemo(() => {
    const total = contacts.length;
    const approved = contacts.filter((c) => c.status === "approved").length;
    const waitlist = contacts.filter((c) => c.status === "waitlist").length;
    const checkedIn = contacts.filter((c) => c.checked_in).length;

    return [
      { label: "Total Contacts", value: total, color: "#7c3aed" },
      { label: "Approved", value: approved, color: "#34d399" },
      { label: "Waitlist", value: waitlist, color: "#fbbf24" },
      { label: "Checked In", value: checkedIn, color: "#e879a8" },
    ];
  }, [contacts]);

  const filterButtons: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "Approved", value: "approved" },
    { label: "Waitlist", value: "waitlist" },
    { label: "Checked In", value: "checked_in" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Attendees</h1>

      <StatsBar stats={stats} loading={loading} />

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {filterButtons.map((btn) => (
          <Button
            key={btn.value}
            variant={filterStatus === btn.value ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilterStatus(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
        <Button variant="secondary" size="sm" className="ml-auto" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* Content */}
      <Card className="p-6">
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-md" />
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
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!loading && !error && (
          <ContactsTable contacts={contacts} onUpdateContact={updateContact} />
        )}
      </Card>
    </div>
  );
}
