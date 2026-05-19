import { WorkspacePage } from "@/components/layout/workspace-page";

export default function ProfileSettingsPage() {
  return <WorkspacePage title="Account settings" description="Security, sessions, two-factor readiness, notification preferences, and connected accounts." tags={["Security", "Sessions", "Notifications"]} />;
}
