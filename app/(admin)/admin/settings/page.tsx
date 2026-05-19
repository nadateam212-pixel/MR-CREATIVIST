import { WorkspacePage } from "@/components/layout/workspace-page";

export default function AdminSettingsPage() {
  return <WorkspacePage title="Platform settings" description="Feature flags, payment settings, email templates, legal content, webhooks, branding, and integrations." tags={["Feature flags", "Webhooks", "Branding"]} />;
}
