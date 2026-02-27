"use client";

import { useState, useEffect, useCallback } from "react";
import type { EmailTemplate } from "@/lib/types";
import { getSampleVariables } from "@/lib/email-composer";
import { getToken } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface TemplatePreviewDialogProps {
  template: EmailTemplate;
  onClose: () => void;
}

export function TemplatePreviewDialog({
  template,
  onClose,
}: TemplatePreviewDialogProps) {
  const [html, setHtml] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>(() =>
    getSampleVariables(template.variables || [])
  );

  const fetchPreview = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/templates/${template.id}/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ variables }),
      });
      if (!res.ok) throw new Error("Failed to load preview");
      const data = await res.json();
      setHtml(data.html);
      setSubject(data.subject);
    } catch (err) {
      console.error("Preview error:", err);
      setHtml("<p>Failed to load preview</p>");
    } finally {
      setLoading(false);
    }
  }, [template.id, variables]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[720px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Preview: {template.name}</DialogTitle>
        </DialogHeader>

        {/* Variable overrides */}
        {template.variables && template.variables.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Variables</Label>
            <div className="grid grid-cols-2 gap-2">
              {template.variables.map((varName) => (
                <div key={varName} className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground min-w-[80px]">
                    {varName}
                  </Label>
                  <Input
                    value={variables[varName] || ""}
                    onChange={(e) =>
                      handleVariableChange(varName, e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground truncate max-w-[400px]">
            Subject: {subject}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "Light" : "Dark"} Mode
          </Button>
        </div>

        {/* Preview iframe */}
        <div
          className={`border rounded-md overflow-hidden ${darkMode ? "bg-gray-900" : "bg-white"}`}
        >
          {loading ? (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              Loading preview...
            </div>
          ) : (
            <iframe
              srcDoc={html}
              title="Email Preview"
              className="w-full h-[400px] border-0"
              sandbox="allow-same-origin"
              style={{
                colorScheme: darkMode ? "dark" : "light",
              }}
            />
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
