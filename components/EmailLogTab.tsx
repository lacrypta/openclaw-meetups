"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { getToken } from "@/lib/auth";

interface EmailRecord {
  id: string;
  email: string;
  status: string;
  error: string | null;
  sent_at: string | null;
  created_at: string;
  attempts: number;
  job_id: string;
  user_id: string | null;
  email_jobs: { id: string; name: string | null; subject: string; status: string } | null;
  users: { id: string; name: string; email: string } | null;
}

const statusBadge: Record<string, { className: string; label: string }> = {
  sent: { className: "bg-green-500/20 text-green-400", label: "Enviado" },
  failed: { className: "bg-red-500/20 text-red-400", label: "Fallido" },
  pending: { className: "bg-muted-foreground/20 text-muted-foreground", label: "Pendiente" },
  bounced: { className: "bg-orange-500/20 text-orange-400", label: "Rebotado" },
  skipped: { className: "bg-yellow-500/20 text-yellow-400", label: "Omitido" },
};

export default function EmailLogTab() {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const limit = 50;

  useEffect(() => {
    const fetchEmails = async () => {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/emails?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails);
        setTotal(data.total);
      }
      setLoading(false);
    };
    fetchEmails();
  }, [statusFilter, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{total} emails</span>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="sent">Enviados</SelectItem>
            <SelectItem value="failed">Fallidos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="bounced">Rebotados</SelectItem>
            <SelectItem value="skipped">Omitidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="p-0">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No se encontraron emails
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destinatario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Campaña</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Intentos</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.map((e) => {
                  const badge = statusBadge[e.status] || statusBadge.pending;
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm">
                        {e.users ? (
                          <Link
                            href={`/dashboard/users/${e.users.id}`}
                            className="text-primary hover:underline"
                          >
                            {e.users.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{e.email}</TableCell>
                      <TableCell className="text-sm">
                        {e.email_jobs ? (
                          <Link
                            href={`/dashboard/campaigns/${e.email_jobs.id}`}
                            className="text-primary hover:underline"
                          >
                            {e.email_jobs.name || e.email_jobs.subject}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${badge.className}`}>
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-center">{e.attempts}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {e.error || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {e.sent_at
                          ? new Date(e.sent_at).toLocaleString()
                          : new Date(e.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            ← Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            Siguiente →
          </Button>
        </div>
      )}
    </div>
  );
}
