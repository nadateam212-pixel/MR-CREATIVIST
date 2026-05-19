import { WorkspacePage } from "@/components/layout/workspace-page";

export default function AdminHealthPage() {
  return <WorkspacePage title="System health" description="Uptime, queue status, cache, database, webhooks, email delivery, logs, and error tracking." tags={["Uptime", "Database", "Logs", "Sentry"]} />;
}
