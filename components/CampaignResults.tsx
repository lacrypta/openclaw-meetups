"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { composeEmail } from "@/lib/email-composer";
import { getToken } from "@/lib/auth";
import type { EmailJob, EmailSend } from "@/lib/types";

interface CampaignResultsProps {
  campaign: EmailJob;
  sends: EmailSend[];
  onRetry?: (id: string) => void;
  onRemoveRecipient?: (sendId: string) => void;
  onBulkRemove?: (sendIds: string[]) => Promise<void>;
  templateHtml?: string;
  templateSubject?: string;
  layoutHtml?: string | null;
}

const statusBadge: Record<string, { className: string; label: string }> = {
  sent: { className: "bg-green-500/20 text-green-400", label: "Sent" },
  failed: { className: "bg-red-500/20 text-red-400", label: "Failed" },
  pending: { className: "bg-muted-foreground/20 text-muted-foreground", label: "Pending" },
  bounced: { className: "bg-orange-500/20 text-orange-400", label: "Bounced" },
};

export function CampaignResults({
  campaign,
  sends,
  onRetry,
  onRemoveRecipient,
  onBulkRemove,
  templateHtml,
  templateSubject,
  layoutHtml,
}: CampaignResultsProps) {
  const [previewSend, setPreviewSend] = useState<EmailSend | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailSend | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const allSelected = sends.length > 0 && selected.size === sends.length;
  const someSelected = selected.size > 0 && selected.size < sends.length;

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(sends.map((s) => s.id)));
  };

  const handleBulkDelete = async () => {
    if (!onBulkRemove || selected.size === 0) return;
    setBulkDeleting(true);
    try {
      await onBulkRemove(Array.from(selected));
      setSelected(new Set());
    } finally {
      setBulkDeleting(false);
      setBulkDeleteOpen(false);
    }
  };

  const getVariablesForSend = (send: EmailSend): Record<string, string> => {
    const userName = send.users?.name || "";
    const userEmail = send.users?.email || send.email;
    const firstName = userName.split(" ")[0] || userName;
    const lastName = userName.split(" ").slice(1).join(" ") || "";
    return {
      firstname: firstName,
      first_name: firstName,
      lastname: lastName,
      fullname: userName,
      name: userName,
      email: userEmail,
      subject: templateSubject || campaign.subject || "",
    };
  };

  const getPreviewHtml = (send: EmailSend): string => {
    const html = templateHtml || "";
    if (!html) return "<p style='font-family:sans-serif;padding:2rem;color:#666'>No hay contenido de template disponible</p>";

    const variables = getVariablesForSend(send);
    const composed = composeEmail({
      template: { html_content: html, subject: templateSubject || campaign.subject },
      layout: layoutHtml ? { html_content: layoutHtml } : null,
      variables,
    });
    return composed.html;
  };

  const handleDelete = async () => {
    if (!deleteTarget || !onRemoveRecipient) return;
    setDeleting(true);
    try {
      onRemoveRecipient(deleteTarget.id);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleSendTest = async () => {
    if (!previewSend || !testEmail) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const token = getToken();
      const res = await fetch(`/api/campaigns/${campaign.id}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: testEmail,
          variables: getVariablesForSend(previewSend),
        }),
      });
      if (res.ok) {
        setTestResult("✅ Email de prueba enviado");
      } else {
        const data = await res.json();
        setTestResult(`❌ ${data.error || "Error al enviar"}`);
      }
    } catch {
      setTestResult("❌ Error de conexión");
    } finally {
      setTestSending(false);
    }
  };

  const openPreview = (send: EmailSend) => {
    setPreviewSend(send);
    setTestEmail(send.users?.email || send.email);
    setTestResult(null);
  };

  const isPending = campaign.status === "pending";

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex gap-4 text-sm">
        <span className="text-green-400">Sent: {campaign.sent_count}</span>
        <span className="text-red-400">Failed: {campaign.failed_count}</span>
        <span className="text-muted-foreground">Total: {campaign.total_contacts}</span>
        {onRetry && campaign.failed_count > 0 && ["partial", "failed"].includes(campaign.status) && (
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => onRetry(campaign.id)}>
            Retry Failed
          </Button>
        )}
      </div>

      {/* Selection bar */}
      {isPending && selected.size > 0 && (
        <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2">
          <span className="text-sm">{selected.size} seleccionado{selected.size > 1 ? "s" : ""}</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkDeleteOpen(true)}
          >
            🗑 Eliminar ({selected.size})
          </Button>
        </div>
      )}

      {/* Sends table */}
      {sends.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {isPending && onRemoveRecipient && (
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allSelected}
                      ref={(el) => {
                        if (el) (el as unknown as HTMLButtonElement).dataset.indeterminate = someSelected ? "true" : "false";
                      }}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                )}
                <TableHead>Nombre completo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Enviado</TableHead>
                <TableHead className="w-[80px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sends.map((send) => {
                const badge = statusBadge[send.status] || statusBadge.pending;
                return (
                  <TableRow key={send.id}>
                    {isPending && onRemoveRecipient && (
                      <TableCell className="w-[40px]">
                        <Checkbox
                          checked={selected.has(send.id)}
                          onCheckedChange={() => toggleOne(send.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="text-sm">
                      {send.user_id ? (
                        <a href={`/dashboard/attendees/${send.user_id}`} className="text-primary hover:underline">
                          {send.users?.name || "—"}
                        </a>
                      ) : (
                        send.users?.name || "—"
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {send.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs ${badge.className}`}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {send.error || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {send.sent_at ? new Date(send.sent_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            ⋯
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openPreview(send)}>
                            👁 Preview
                          </DropdownMenuItem>
                          {isPending && onRemoveRecipient && (
                            <DropdownMenuItem
                              className="text-red-400 focus:text-red-400"
                              onClick={() => setDeleteTarget(send)}
                            >
                              🗑 Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={(open) => !bulkDeleting && setBulkDeleteOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selected.size} destinatario{selected.size > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán <strong>{selected.size}</strong> destinatario{selected.size > 1 ? "s" : ""} de esta campaña. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkDeleting ? "Eliminando..." : `Eliminar (${selected.size})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar destinatario?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{deleteTarget?.email}</strong> de esta campaña. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview + Test Email dialog */}
      <Dialog open={!!previewSend} onOpenChange={(open) => !open && setPreviewSend(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Preview — {previewSend?.users?.name || previewSend?.email}</DialogTitle>
          </DialogHeader>

          {/* Email preview */}
          {previewSend && (
            <iframe
              sandbox=""
              srcDoc={getPreviewHtml(previewSend)}
              className="w-full flex-1 min-h-[400px] border rounded bg-white"
              title={`Preview ${previewSend.email}`}
            />
          )}

          {/* Test email section */}
          <div className="border-t pt-4 mt-2">
            <p className="text-sm font-medium mb-2">🧪 Enviar email de prueba</p>
            <div className="flex gap-2">
              <Input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                type="email"
                className="flex-1"
              />
              <Button
                onClick={handleSendTest}
                disabled={testSending || !testEmail}
                variant="outline"
              >
                {testSending ? "Enviando..." : "Enviar test"}
              </Button>
            </div>
            {testResult && (
              <p className="text-sm mt-2">{testResult}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
