"use client";

import { useState } from "react";
import type { EmailLayout } from "@/lib/types";
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

interface LayoutEditorDialogProps {
  layout?: EmailLayout | null;
  onSubmit: (data: {
    name: string;
    description?: string;
    html_content: string;
    is_default?: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

export function LayoutEditorDialog({
  layout,
  onSubmit,
  onClose,
}: LayoutEditorDialogProps) {
  const isEdit = !!layout;

  const [name, setName] = useState(layout?.name || "");
  const [description, setDescription] = useState(layout?.description || "");
  const [htmlContent, setHtmlContent] = useState(layout?.html_content || "");
  const [isDefault, setIsDefault] = useState(layout?.is_default || false);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!htmlContent.includes("{{content}}")) {
      setValidationError(
        'Layout HTML must contain the {{content}} placeholder'
      );
      return;
    }

    setValidationError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name,
        description: description || undefined,
        html_content: htmlContent,
        is_default: isDefault,
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
      <DialogContent className="max-w-[640px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Layout" : "Create Layout"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Default OpenClaw"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this layout"
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              HTML Content *{" "}
              <span className="text-muted-foreground font-normal">
                (must include {"{{content}}"})
              </span>
            </Label>
            <Textarea
              required
              value={htmlContent}
              onChange={(e) => {
                setHtmlContent(e.target.value);
                if (validationError) setValidationError(null);
              }}
              className="font-mono text-xs min-h-[300px]"
              placeholder={'<!DOCTYPE html>\n<html>\n<body>\n  {{content}}\n</body>\n</html>'}
            />
            {validationError && (
              <p className="text-sm text-red-500">{validationError}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="layout_is_default"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
            <Label htmlFor="layout_is_default" className="cursor-pointer">
              Set as default
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
                  ? "Update Layout"
                  : "Create Layout"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
