"use client";

import { useState } from "react";
import type { EventStatus } from "../lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EventFormData {
  name: string;
  description: string;
  date: string;
  location: string;
  capacity: string;
  status: EventStatus;
}

interface EventFormProps {
  initial?: Partial<EventFormData>;
  onSubmit: (data: {
    name: string;
    description?: string;
    date: string;
    location?: string;
    capacity?: number;
    status: EventStatus;
  }) => Promise<void>;
  onClose: () => void;
  title?: string;
}

export function EventForm({ initial, onSubmit, onClose, title = "Create Event" }: EventFormProps) {
  const [form, setForm] = useState<EventFormData>({
    name: initial?.name || "",
    description: initial?.description || "",
    date: initial?.date || "",
    location: initial?.location || "",
    capacity: initial?.capacity || "",
    status: initial?.status || "draft",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name,
        description: form.description || undefined,
        date: form.date,
        location: form.location || undefined,
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
        status: form.status,
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
      <DialogContent className="max-w-[520px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Event name"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Date & Time *</Label>
            <Input
              required
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Venue or address"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Capacity</Label>
            <Input
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              placeholder="Max attendees"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm({ ...form, status: value as EventStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Event description"
              className="min-h-[80px]"
            />
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : title}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
