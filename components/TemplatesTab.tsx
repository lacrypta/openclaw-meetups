"use client";

import { useState } from "react";
import type { EmailTemplate, EmailJobSegment, EmailLayout } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TemplateEditorDialog } from "./TemplateEditorDialog";
import { TemplatePreviewDialog } from "./TemplatePreviewDialog";

const SEGMENT_LABELS: Record<EmailJobSegment, string> = {
  "checked-in": "Checked In",
  "no-show": "No Show",
  waitlist: "Waitlist",
  custom: "Custom",
};

interface TemplatesTabProps {
  templates: EmailTemplate[];
  layouts: EmailLayout[];
  loading: boolean;
  onRefetch: () => void;
  onCreate: (data: {
    name: string;
    description?: string;
    segment: EmailJobSegment;
    subject: string;
    html_content: string;
    text_content?: string;
    variables?: string[];
    layout_id?: string | null;
    is_active?: boolean;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    data: Partial<EmailTemplate>
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TemplatesTab({
  templates,
  layouts,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}: TemplatesTabProps) {
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [previewing, setPreviewing] = useState<EmailTemplate | null>(null);

  const handleCreate = async (data: Parameters<typeof onCreate>[0]) => {
    try {
      await onCreate(data);
      setMessage({ type: "success", text: "Template created" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to create template",
      });
      throw err;
    }
  };

  const handleUpdate = async (data: Parameters<typeof onCreate>[0]) => {
    if (!editing) return;
    try {
      await onUpdate(editing.id, data);
      setMessage({ type: "success", text: "Template updated" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update template",
      });
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      await onDelete(id);
      setMessage({ type: "success", text: "Template deleted" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete template",
      });
    }
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (template: EmailTemplate) => {
    setEditing(template);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  if (loading) {
    return (
      <div className="text-muted-foreground">Loading templates...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Content Templates
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage email templates for different audience segments
          </p>
        </div>
        <Button onClick={openCreate}>Create Template</Button>
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

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No email templates yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{template.name}</span>
                    <Badge variant="secondary">
                      {SEGMENT_LABELS[template.segment]}
                    </Badge>
                    {!template.is_active && (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {template.subject}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewing(template)}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(template)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {dialogOpen && (
        <TemplateEditorDialog
          template={editing}
          layouts={layouts}
          onSubmit={editing ? handleUpdate : handleCreate}
          onClose={closeDialog}
        />
      )}

      {previewing && (
        <TemplatePreviewDialog
          template={previewing}
          onClose={() => setPreviewing(null)}
        />
      )}
    </div>
  );
}
