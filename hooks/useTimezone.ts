"use client";

import { useState, useEffect } from "react";
import { getToken } from "@/lib/auth";

export function useTimezone(): string {
  const [timezone, setTimezone] = useState("America/Buenos_Aires");

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
          if (data.timezone) setTimezone(data.timezone);
        }
      } catch {
        // use default
      }
    })();
  }, []);

  return timezone;
}
