"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WebhookLogTab from "@/components/WebhookLogTab";
import EmailLogTab from "@/components/EmailLogTab";

export default function LogsPage() {
  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📋 Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Historial de webhooks y emails enviados
        </p>
      </div>

      <Tabs defaultValue="emails">
        <TabsList>
          <TabsTrigger value="emails">📧 Emails</TabsTrigger>
          <TabsTrigger value="webhooks">🔗 Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="emails">
          <EmailLogTab />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhookLogTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
