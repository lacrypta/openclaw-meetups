"use client";

import { use } from "react";
import Link from "next/link";
import { EventDetail } from "@/components/EventDetail";

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div>
      <Link
        href="/dashboard/events"
        className="text-muted-foreground text-sm inline-block mb-4 hover:text-foreground transition-colors"
      >
        ← Back to Events
      </Link>
      <EventDetail eventId={id} />
    </div>
  );
}
