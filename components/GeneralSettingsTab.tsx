"use client";

import { useState, useEffect } from "react";
import { getToken } from "@/lib/auth";

const COMMON_TIMEZONES = [
  "America/Buenos_Aires",
  "America/Sao_Paulo",
  "America/Santiago",
  "America/Bogota",
  "America/Lima",
  "America/Mexico_City",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Berlin",
  "Asia/Tokyo",
  "UTC",
];

export function GeneralSettingsTab() {
  const [timezone, setTimezone] = useState("America/Buenos_Aires");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch("/api/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTimezone(data.timezone);
        }
      } catch {
        // use default
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ timezone }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-muted-foreground p-4">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">General</h3>
        <p className="text-sm text-muted-foreground">
          Global settings for your dashboard and events.
        </p>
      </div>

      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            🌐 Timezone
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Used to display event dates and times. All events will be shown in this timezone.
          </p>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            {COMMON_TIMEZONES.map((tz) => {
              const now = new Date();
              const offset = new Intl.DateTimeFormat("en", {
                timeZone: tz,
                timeZoneName: "shortOffset",
              })
                .formatToParts(now)
                .find((p) => p.type === "timeZoneName")?.value || "";
              return (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")} ({offset})
                </option>
              );
            })}
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "✅ Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
