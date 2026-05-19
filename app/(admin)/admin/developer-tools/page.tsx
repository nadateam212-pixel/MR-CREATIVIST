import { WorkspacePage } from "@/components/layout/workspace-page";

export default function AdminDeveloperToolsPage() {
  return <WorkspacePage title="Developer tools" description="API tester, webhook logs, integration keys, event replay, rate limits, and platform diagnostics." tags={["API tester", "Webhooks", "Keys", "Diagnostics"]} />;
}
