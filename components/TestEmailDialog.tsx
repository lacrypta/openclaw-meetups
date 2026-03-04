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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TestEmailDialogProps {
  integrationName: string;
  layouts?: EmailLayout[];
  onSubmit: (email: string, layoutId?: string) => Promise<void>;
  onClose: () => void;
}

export function TestEmailDialog({
  integrationName,
  layouts = [],
  onSubmit,
  onClose,
}: TestEmailDialogProps) {
  const [email, setEmail] = useState("");
  const [layoutId, setLayoutId] = useState<string>("none");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(email, layoutId === "none" ? undefined : layoutId);
      onClose();
    } catch {
      // error handled by caller
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Send a test email using <strong>{integrationName}</strong> to verify
          the configuration works.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label>Recipient Email *</Label>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Layout</Label>
            <Select value={layoutId} onValueChange={setLayoutId} disabled={submitting}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No layout (plain test)</SelectItem>
                {layouts.map((layout) => (
                  <SelectItem key={layout.id} value={layout.id}>
                    {layout.name}
                    {layout.is_default ? " (Default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send Test"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
