"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { EmailIntegration, EmailIntegrationType, EmailLayout } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmailIntegrationDialog } from "./EmailIntegrationDialog";
import { TestEmailDialog } from "./TestEmailDialog";
import { useLayouts } from "@/hooks/useLayouts";

const TYPE_LABELS: Record<EmailIntegrationType, string> = {
  smtp: "SMTP",
  aws_ses: "AWS SES",
  resend: "Resend",
};

function configSummary(integration: EmailIntegration): string {
  try {
    const cfg = JSON.parse(integration.config);
    switch (integration.type) {
      case "smtp":
        return `${cfg.host}:${cfg.port}`;
      case "aws_ses":
        return cfg.region;
      case "resend":
        return cfg.from_email;
      default:
        return "";
    }
  } catch {
    return "";
  }
}

export function EmailIntegrationsTab() {
  const { token, ready } = useAuth();
  const { layouts } = useLayouts();
  const [integrations, setIntegrations] = useState<EmailIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmailIntegration | null>(null);
  const [testing, setTesting] = useState<EmailIntegration | null>(null);

  const fetchIntegrations = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/email-integrations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const { integrations: data } = await res.json();
      setIntegrations(data);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      setMessage({ type: "error", text: "Failed to load email integrations" });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!ready) return;
    fetchIntegrations();
  }, [ready, fetchIntegrations]);

  const handleCreate = async (data: {
    name: string;
    type: EmailIntegrationType;
    config: string;
    is_default: boolean;
  }) => {
    const res = await fetch("/api/email-integrations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "Failed to create integration");
    }
    setMessage({ type: "success", text: "Integration created" });
    await fetchIntegrations();
  };

  const handleUpdate = async (data: {
    name: string;
    type: EmailIntegrationType;
    config: string;
    is_default: boolean;
  }) => {
    if (!editing) return;
    const res = await fetch(`/api/email-integrations/${editing.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "Failed to update integration");
    }
    setMessage({ type: "success", text: "Integration updated" });
    await fetchIntegrations();
  };

  const handleSetDefault = async (id: string) => {
    const res = await fetch(`/api/email-integrations/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_default: true }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      setMessage({ type: "error", text: error || "Failed to set default" });
      return;
    }
    setMessage({ type: "success", text: "Default integration updated" });
    await fetchIntegrations();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/email-integrations/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const { error } = await res.json();
      setMessage({ type: "error", text: error || "Failed to delete" });
      return;
    }
    setMessage({ type: "success", text: "Integration deleted" });
    await fetchIntegrations();
  };

  const handleTest = async (email: string, layoutId?: string) => {
    if (!testing) return;
    const res = await fetch(`/api/email-integrations/${testing.id}/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: email, layout_id: layoutId }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      setMessage({ type: "error", text: error || "Test email failed" });
      throw new Error(error);
    }
    setMessage({ type: "success", text: "Test email sent successfully" });
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (integration: EmailIntegration) => {
    setEditing(integration);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  if (loading) {
    return (
      <div className="text-muted-foreground">Loading integrations...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Email Integrations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure email providers for sending campaign emails
          </p>
        </div>
        <Button onClick={openCreate}>Add Integration</Button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-500/10 text-green-500 border border-green-500/20"
              : "bg-red-500/10 text-red-500 border border-red-500/20"
          }`}
        >
          {message.text}
        </div>
      )}

      {integrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No email integrations configured yet. Add one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{integration.name}</span>
                    <Badge variant="secondary">
                      {TYPE_LABELS[integration.type]}
                    </Badge>
                    {integration.is_default && (
                      <Badge variant="default">Default</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {configSummary(integration)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTesting(integration)}
                  >
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(integration)}
                  >
                    Edit
                  </Button>
                  {!integration.is_default && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(integration.id)}
                      >
                        Set Default
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(integration.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {dialogOpen && (
        <EmailIntegrationDialog
          integration={editing}
          onSubmit={editing ? handleUpdate : handleCreate}
          onClose={closeDialog}
        />
      )}

      {testing && (
        <TestEmailDialog
          integrationName={testing.name}
          layouts={layouts}
          onSubmit={handleTest}
          onClose={() => setTesting(null)}
        />
      )}
    </div>
  );
}
