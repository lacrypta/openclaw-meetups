"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailIntegrationsTab } from "@/components/EmailIntegrationsTab";

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your dashboard configuration
        </p>
      </div>

      <Tabs defaultValue="email">
        <TabsList>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>
        <TabsContent value="email">
          <EmailIntegrationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
