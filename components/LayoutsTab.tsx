"use client";

import { useState } from "react";
import type { EmailLayout } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutEditorDialog } from "./LayoutEditorDialog";

interface LayoutsTabProps {
  layouts: EmailLayout[];
  loading: boolean;
  onCreate: (data: {
    name: string;
    description?: string;
    html_content: string;
    is_default?: boolean;
  }) => Promise<void>;
  onUpdate: (id: string, data: Partial<EmailLayout>) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function LayoutsTab({
  layouts,
  loading,
  onCreate,
  onUpdate,
  onSetDefault,
  onDelete,
}: LayoutsTabProps) {
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmailLayout | null>(null);

  const handleCreate = async (data: Parameters<typeof onCreate>[0]) => {
    try {
      await onCreate(data);
      setMessage({ type: "success", text: "Layout created" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to create layout",
      });
      throw err;
    }
  };

  const handleUpdate = async (data: Parameters<typeof onCreate>[0]) => {
    if (!editing) return;
    try {
      await onUpdate(editing.id, data);
      setMessage({ type: "success", text: "Layout updated" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update layout",
      });
      throw err;
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await onSetDefault(id);
      setMessage({ type: "success", text: "Default layout updated" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to set default",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this layout?")) return;
    try {
      await onDelete(id);
      setMessage({ type: "success", text: "Layout deleted" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete layout",
      });
    }
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (layout: EmailLayout) => {
    setEditing(layout);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  if (loading) {
    return (
      <div className="text-muted-foreground">Loading layouts...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Email Layouts
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage shared HTML wrappers for your email templates
          </p>
        </div>
        <Button onClick={openCreate}>Create Layout</Button>
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

      {layouts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No layouts configured yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {layouts.map((layout) => (
            <Card key={layout.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{layout.name}</span>
                    {layout.is_default && (
                      <Badge variant="default">Default</Badge>
                    )}
                  </div>
                  {layout.description && (
                    <p className="text-sm text-muted-foreground">
                      {layout.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(layout)}
                  >
                    Edit
                  </Button>
                  {!layout.is_default && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(layout.id)}
                      >
                        Set Default
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(layout.id)}
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
        <LayoutEditorDialog
          layout={editing}
          onSubmit={editing ? handleUpdate : handleCreate}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}
