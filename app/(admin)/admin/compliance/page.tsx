import { WorkspacePage } from "@/components/layout/workspace-page";

export default function AdminCompliancePage() {
  return <WorkspacePage title="Compliance" description="GDPR data requests, exports, delete requests, legal documents, audit logs, and consent records." tags={["GDPR", "Audit", "Legal", "Consent"]} />;
}
