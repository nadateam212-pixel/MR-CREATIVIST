import { WorkspacePage } from "@/components/layout/workspace-page";

export default function SecurityPage() {
  return <WorkspacePage title="Security" description="Two-factor authentication, trusted devices, connected accounts, active sessions, and account deletion controls." tags={["2FA", "Devices", "Sessions", "Privacy"]} />;
}
