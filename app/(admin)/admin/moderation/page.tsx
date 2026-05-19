import { WorkspacePage } from "@/components/layout/workspace-page";

export default function AdminModerationPage() {
  return <WorkspacePage title="Content moderation" description="Course approvals, product approvals, consultant verification, review moderation, reports, and flags." tags={["Courses", "Products", "Reviews", "Flags"]} />;
}
