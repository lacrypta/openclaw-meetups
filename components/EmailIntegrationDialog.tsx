"use client";

import { useState } from "react";
import type { EmailIntegration, EmailIntegrationType } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmailIntegrationDialogProps {
  integration?: EmailIntegration | null;
  onSubmit: (data: {
    name: string;
    type: EmailIntegrationType;
    config: string;
    is_default: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

interface SmtpForm {
  host: string;
  port: string;
  secure: boolean;
  username: string;
  password: string;
  from_email: string;
}

interface AwsSesForm {
  region: string;
  access_key_id: string;
  secret_access_key: string;
  from_email: string;
}

interface ResendForm {
  api_key: string;
  from_email: string;
}

function parseConfig(integration: EmailIntegration | null | undefined) {
  if (!integration) return null;
  try {
    return JSON.parse(integration.config);
  } catch {
    return null;
  }
}

export function EmailIntegrationDialog({
  integration,
  onSubmit,
  onClose,
}: EmailIntegrationDialogProps) {
  const isEdit = !!integration;
  const existing = parseConfig(integration);

  const [name, setName] = useState(integration?.name || "");
  const [type, setType] = useState<EmailIntegrationType>(integration?.type || "smtp");
  const [isDefault, setIsDefault] = useState(integration?.is_default || false);
  const [submitting, setSubmitting] = useState(false);

  const [smtp, setSmtp] = useState<SmtpForm>({
    host: existing?.host || "",
    port: existing?.port?.toString() || "587",
    secure: existing?.secure || false,
    username: existing?.username || "",
    password: existing?.password || "",
    from_email: existing?.from_email || "",
  });

  const [ses, setSes] = useState<AwsSesForm>({
    region: existing?.region || "us-east-1",
    access_key_id: existing?.access_key_id || "",
    secret_access_key: existing?.secret_access_key || "",
    from_email: existing?.from_email || "",
  });

  const [resend, setResend] = useState<ResendForm>({
    api_key: existing?.api_key || "",
    from_email: existing?.from_email || "",
  });

  const buildConfig = (): string => {
    switch (type) {
      case "smtp":
        return JSON.stringify({
          host: smtp.host,
          port: parseInt(smtp.port) || 587,
          secure: smtp.secure,
          username: smtp.username,
          password: smtp.password,
          from_email: smtp.from_email,
        });
      case "aws_ses":
        return JSON.stringify({
          region: ses.region,
          access_key_id: ses.access_key_id,
          secret_access_key: ses.secret_access_key,
          from_email: ses.from_email,
        });
      case "resend":
        return JSON.stringify({
          api_key: resend.api_key,
          from_email: resend.from_email,
        });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        name,
        type,
        config: buildConfig(),
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
      <DialogContent className="max-w-[520px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Integration" : "Add Integration"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production SMTP"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Provider *</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as EmailIntegrationType)}
              disabled={isEdit}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smtp">SMTP</SelectItem>
                <SelectItem value="aws_ses">AWS SES</SelectItem>
                <SelectItem value="resend">Resend</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_default"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
            <Label htmlFor="is_default" className="cursor-pointer">
              Set as default
            </Label>
          </div>

          {/* Provider-specific fields */}
          {type === "smtp" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Host *</Label>
                  <Input
                    required
                    value={smtp.host}
                    onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Port *</Label>
                  <Input
                    required
                    type="number"
                    value={smtp.port}
                    onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
                    placeholder="587"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="smtp_secure"
                  checked={smtp.secure}
                  onCheckedChange={(checked) =>
                    setSmtp({ ...smtp, secure: checked })
                  }
                />
                <Label htmlFor="smtp_secure" className="cursor-pointer">
                  Use SSL/TLS
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Username *</Label>
                  <Input
                    required
                    value={smtp.username}
                    onChange={(e) =>
                      setSmtp({ ...smtp, username: e.target.value })
                    }
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Password *</Label>
                  <Input
                    required
                    type="password"
                    value={smtp.password}
                    onChange={(e) =>
                      setSmtp({ ...smtp, password: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>From Email *</Label>
                <Input
                  required
                  type="email"
                  value={smtp.from_email}
                  onChange={(e) =>
                    setSmtp({ ...smtp, from_email: e.target.value })
                  }
                  placeholder="noreply@example.com"
                />
              </div>
            </>
          )}

          {type === "aws_ses" && (
            <>
              <div className="space-y-1.5">
                <Label>Region *</Label>
                <Input
                  required
                  value={ses.region}
                  onChange={(e) => setSes({ ...ses, region: e.target.value })}
                  placeholder="us-east-1"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Access Key ID *</Label>
                <Input
                  required
                  value={ses.access_key_id}
                  onChange={(e) =>
                    setSes({ ...ses, access_key_id: e.target.value })
                  }
                  placeholder="AKIA..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Secret Access Key *</Label>
                <Input
                  required
                  type="password"
                  value={ses.secret_access_key}
                  onChange={(e) =>
                    setSes({ ...ses, secret_access_key: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <Label>From Email *</Label>
                <Input
                  required
                  type="email"
                  value={ses.from_email}
                  onChange={(e) =>
                    setSes({ ...ses, from_email: e.target.value })
                  }
                  placeholder="noreply@example.com"
                />
              </div>
            </>
          )}

          {type === "resend" && (
            <>
              <div className="space-y-1.5">
                <Label>API Key *</Label>
                <Input
                  required
                  type="password"
                  value={resend.api_key}
                  onChange={(e) =>
                    setResend({ ...resend, api_key: e.target.value })
                  }
                  placeholder="re_..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>From Email *</Label>
                <Input
                  required
                  type="email"
                  value={resend.from_email}
                  onChange={(e) =>
                    setResend({ ...resend, from_email: e.target.value })
                  }
                  placeholder="noreply@example.com"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : isEdit
                  ? "Update Integration"
                  : "Add Integration"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
