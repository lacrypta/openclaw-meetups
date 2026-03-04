"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplatesTab } from "@/components/TemplatesTab";
import { LayoutsTab } from "@/components/LayoutsTab";
import { useTemplates } from "@/hooks/useTemplates";
import { useLayouts } from "@/hooks/useLayouts";

export default function TemplatesPage() {
  const {
    templates,
    loading: templatesLoading,
    refetch: refetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useTemplates();

  const {
    layouts,
    loading: layoutsLoading,
    createLayout,
    updateLayout,
    setDefault,
    deleteLayout,
  } = useLayouts();

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Templates</h1>
        <p className="text-muted-foreground mt-1">
          Manage email templates and layouts for your campaigns
        </p>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Content Templates</TabsTrigger>
          <TabsTrigger value="layouts">Layouts</TabsTrigger>
        </TabsList>
        <TabsContent value="templates">
          <TemplatesTab
            templates={templates}
            layouts={layouts}
            loading={templatesLoading}
            onRefetch={refetchTemplates}
            onCreate={createTemplate}
            onUpdate={updateTemplate}
            onDelete={deleteTemplate}
          />
        </TabsContent>
        <TabsContent value="layouts">
          <LayoutsTab
            layouts={layouts}
            loading={layoutsLoading}
            onCreate={createLayout}
            onUpdate={updateLayout}
            onSetDefault={setDefault}
            onDelete={deleteLayout}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
