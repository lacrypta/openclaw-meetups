"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const { token } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card className="p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-64" />
          ))}
        </Card>
      </div>
    );
  }

  if (!user) {
    return <p className="text-muted-foreground">No se pudo cargar tu perfil.</p>;
  }

  const fields = [
    { label: "Nombre", value: user.name },
    { label: "Email", value: user.email },
    { label: "Teléfono", value: user.phone || "—" },
    { label: "Rol", value: user.role },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
      <Card className="p-6 space-y-4">
        {fields.map((f) => (
          <div key={f.label} className="flex gap-4">
            <span className="text-muted-foreground w-28 shrink-0">{f.label}:</span>
            <span className="text-foreground">{f.value}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
