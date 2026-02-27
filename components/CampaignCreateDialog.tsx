"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTemplates } from "@/hooks/useTemplates";
import { useEmailIntegrations } from "@/hooks/useEmailIntegrations";
import type { EmailJobSegment } from "@/lib/types";

const SEGMENT_OPTIONS: { value: EmailJobSegment; label: string }[] = [
  { value: "checked-in", label: "Checked In" },
  { value: "no-show", label: "No Show" },
  { value: "waitlist", label: "Waitlist" },
];

interface CampaignCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onSubmit: (params: {
    event_id: string;
    segment: EmailJobSegment;
    template_id: string;
    subject: string;
    integration_id: string;
  }) => Promise<void>;
}

export function CampaignCreateDialog({
  open,
  onOpenChange,
  eventId,
  onSubmit,
}: CampaignCreateDialogProps) {
  const [segment, setSegment] = useState<EmailJobSegment | "">("");
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [integrationId, setIntegrationId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { templates } = useTemplates(
    segment ? { segment: segment as EmailJobSegment } : undefined
  );
  const { integrations } = useEmailIntegrations();

  // Pre-fill subject when template changes
  useEffect(() => {
    if (templateId) {
      const tmpl = templates.find((t) => t.id === templateId);
      if (tmpl) setSubject(tmpl.subject);
    }
  }, [templateId, templates]);

  // Pre-select default integration
  useEffect(() => {
    if (integrations.length > 0 && !integrationId) {
      const defaultInt = integrations.find((i) => i.is_default);
      setIntegrationId(defaultInt?.id || integrations[0].id);
    }
  }, [integrations, integrationId]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSegment("");
      setTemplateId("");
      setSubject("");
      setIntegrationId("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!segment || !templateId || !subject || !integrationId) return;

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        event_id: eventId,
        segment: segment as EmailJobSegment,
        template_id: templateId,
        subject,
        integration_id: integrationId,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = segment && templateId && subject.trim() && integrationId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Campaign</DialogTitle>
          <DialogDescription>
            Send an email campaign to a segment of attendees.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Segment */}
          <div className="space-y-2">
            <Label>Segment</Label>
            <Select
              value={segment}
              onValueChange={(v) => {
                setSegment(v as EmailJobSegment);
                setTemplateId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select segment..." />
              </SelectTrigger>
              <SelectContent>
                {SEGMENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template */}
          <div className="space-y-2">
            <Label>Template</Label>
            <Select
              value={templateId}
              onValueChange={setTemplateId}
              disabled={!segment}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !segment
                      ? "Select segment first"
                      : templates.length === 0
                        ? "No templates for this segment"
                        : "Select template..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line..."
            />
          </div>

          {/* Integration */}
          <div className="space-y-2">
            <Label>Email Provider</Label>
            <Select value={integrationId} onValueChange={setIntegrationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider..." />
              </SelectTrigger>
              <SelectContent>
                {integrations.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name} ({i.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
          >
            {submitting ? "Creating..." : "Create Campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
