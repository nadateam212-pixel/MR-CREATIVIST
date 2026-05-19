import { WorkspacePage } from "@/components/layout/workspace-page";

export default function OrdersPage() {
  return <WorkspacePage title="Orders" description="Course enrollments, product purchases, invoices, refunds, and subscription billing history." tags={["Stripe", "PayPal", "Mobile money", "Refunds"]} />;
}
