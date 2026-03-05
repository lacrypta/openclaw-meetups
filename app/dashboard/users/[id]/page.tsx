"use client";

import { use } from "react";
import Link from "next/link";
import { AttendeeProfile } from "@/components/AttendeeProfile";

export default function AttendeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div>
      <Link
        href="/dashboard/users"
        className="text-muted-foreground text-sm inline-block mb-4 hover:text-foreground transition-colors"
      >
        ← Back to Users
      </Link>
      <AttendeeProfile attendeeId={id} />
    </div>
  );
}
