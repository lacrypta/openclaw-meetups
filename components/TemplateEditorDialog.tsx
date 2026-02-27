"use client";

import { useState } from "react";
import type { EmailTemplate, EmailJobSegment, EmailLayout } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AVAILABLE_VARIABLES } from "@/lib/email-composer";

const DEFAULT_HTML_CONTENT = `<h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 20px; text-align: center;">
  Hola {{firstname}}!
</h1>

<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
  Escribe el contenido de tu email aqui.
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
  <tr>
    <td align="center">
      <a href="https://example.com" style="display: inline-block; background-color: #ff8c00; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Call to action
      </a>
    </td>
  </tr>
</table>`;

interface TemplateEditorDialogProps {
  template?: EmailTemplate | null;
  layouts: EmailLayout[];
  onSubmit: (data: {
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
  onClose: () => void;
}

const SEGMENT_LABELS: Record<EmailJobSegment, string> = {
  "checked-in": "Checked In",
  "no-show": "No Show",
  waitlist: "Waitlist",
  custom: "Custom",
};

export function TemplateEditorDialog({
  template,
  layouts,
  onSubmit,
  onClose,
}: TemplateEditorDialogProps) {
  const isEdit = !!template;

  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [segment, setSegment] = useState<EmailJobSegment>(
    template?.segment || "custom"
  );
  const [subject, setSubject] = useState(template?.subject || "");
  const [htmlContent, setHtmlContent] = useState(template?.html_content || DEFAULT_HTML_CONTENT);
  const [textContent, setTextContent] = useState(template?.text_content || "");
  const [variablesStr, setVariablesStr] = useState(
    (template?.variables || []).join(", ")
  );
  const [layoutId, setLayoutId] = useState<string>(
    template?.layout_id || "none"
  );
  const [isActive, setIsActive] = useState(template?.is_active !== false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const variables = variablesStr
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      await onSubmit({
        name,
        description: description || undefined,
        segment,
        subject,
        html_content: htmlContent,
        text_content: textContent || undefined,
        variables,
        layout_id: layoutId === "none" ? null : layoutId,
        is_active: isActive,
      });
      onClose();
    } catch {
      // error handled by caller
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-[1200px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Template" : "Create Template"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Post-Meetup Thank You"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Segment *</Label>
              <Select
                value={segment}
                onValueChange={(v) => setSegment(v as EmailJobSegment)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SEGMENT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this template"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label>Subject *</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground text-[10px] font-bold cursor-help">?</span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[260px]">
                    <p className="font-medium mb-1">Variables disponibles:</p>
                    {AVAILABLE_VARIABLES.map((v) => (
                      <p key={v.name} className="text-xs">
                        <code className="bg-muted px-1 rounded">{`{{${v.name}}}`}</code>{" "}
                        {v.description}
                      </p>
                    ))}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Gracias por venir, {{firstname}}!"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Layout</Label>
            <Select value={layoutId} onValueChange={setLayoutId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No layout</SelectItem>
                {layouts.map((layout) => (
                  <SelectItem key={layout.id} value={layout.id}>
                    {layout.name}
                    {layout.is_default ? " (Default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>HTML Content *</Label>
            <div className="flex flex-wrap gap-1.5 mb-1">
              {AVAILABLE_VARIABLES.map((v) => (
                <TooltipProvider key={v.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-mono hover:bg-muted/80 transition-colors"
                        onClick={() =>
                          setHtmlContent((prev) => prev + `{{${v.name}}}`)
                        }
                      >
                        {`{{${v.name}}}`}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">{v.description} &mdash; ej: {v.sample}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            <Textarea
              required
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="font-mono text-xs min-h-[200px]"
              placeholder=""
            />
          </div>

          <div className="space-y-1.5">
            <Label>Text Content (optional)</Label>
            <Textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="font-mono text-xs min-h-[80px]"
              placeholder="Plain text fallback"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Active
            </Label>
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : isEdit
                  ? "Update Template"
                  : "Create Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
