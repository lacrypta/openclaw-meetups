"use client";

import { useMemo } from "react";
import { useContacts } from "@/hooks/useContacts";
import { ContactsTable } from "@/components/ContactsTable";
import { StatsBar } from "@/components/StatsBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersPage() {
  const { contacts, loading, error, refetch, updateContact } = useContacts({});

  const stats = useMemo(() => {
    const total = contacts.length;
    const subscribed = contacts.filter((c) => c.subscribed !== false).length;
    const withPhone = contacts.filter((c) => c.phone).length;

    return [
      { label: "Total", value: total, color: "#7c3aed" },
      { label: "Suscriptos", value: subscribed, color: "#34d399" },
      { label: "Con teléfono", value: withPhone, color: "#3b82f6" },
    ];
  }, [contacts]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">👥 Usuarios</h1>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          ↻ Refresh
        </Button>
      </div>

      <StatsBar stats={stats} loading={loading} />

      <Card className="p-6 mt-6">
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-md" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-16 rounded-full" />
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
