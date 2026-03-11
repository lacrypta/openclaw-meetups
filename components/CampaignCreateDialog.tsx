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

interface CampaignCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: {
    name: string;
    template_id: string;
    subject: string;
    integration_id: string;
  }) => Promise<void>;
}

export function CampaignCreateDialog({
  open,
  onOpenChange,
  onSubmit,
}: CampaignCreateDialogProps) {
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [integrationId, setIntegrationId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { templates } = useTemplates();
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
      setName("");
      setTemplateId("");
      setSubject("");
      setIntegrationId("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim() || !templateId || !subject || !integrationId) return;

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
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

  const isValid = name.trim() && templateId && subject.trim() && integrationId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Campaña</DialogTitle>
          <DialogDescription>
            Creá una campaña de email. Los destinatarios se importan después.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Invitación meetup marzo..."
            />
          </div>

          {/* Template */}
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    templates.length === 0
                      ? "No hay templates"
                      : "Seleccionar template..."
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
            <Label>Asunto</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto del email..."
            />
          </div>

          {/* Integration */}
          <div className="space-y-2">
            <Label>Proveedor de Email</Label>
            <Select value={integrationId} onValueChange={setIntegrationId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar proveedor..." />
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
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
          >
            {submitting ? "Creando..." : "Crear Campaña"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
