import { AdminContentTable, type AdminContentRow } from "@/components/admin/admin-content-table";
import connectMongoDB from "@/lib/mongodb";
import { normalizeConsultingService } from "@/lib/platform-db";
import ConsultingService from "@/models/ConsultingService";

export const dynamic = "force-dynamic";

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export default async function AdminConsultantsPage() {
  await connectMongoDB();

  const services = clean(
    (await ConsultingService.find({}).sort({ rating: -1, updatedAt: -1 }).limit(120).lean()).map(normalizeConsultingService)
  );

  const rows: AdminContentRow[] = services.map((service: ReturnType<typeof normalizeConsultingService>) => ({
    id: String(service.id ?? service.slug),
    title: service.serviceTitle ?? service.title,
    subtitle: `${service.name ?? "Consultant"} - ${service.rate ?? "Rate not set"}`,
    kind: "consulting",
    status: service.status ?? "draft",
    isVerified: Boolean(service.isVerified),
    href: service.slug ? `/consulting#${service.slug}` : "/consulting",
    apiPath: `/api/consulting/${service.id ?? service.slug}`,
    updateMethod: "PUT",
    statusActions: [
      { label: "Approve", status: "approved" },
      { label: "Publish", status: "published" },
      { label: "Request changes", status: "changes_requested" },
      { label: "Verify badge", patch: { isVerified: true } }
    ],
    editFields: [
      { key: "title", label: "Service title", value: service.serviceTitle ?? service.title },
      { key: "expertName", label: "Consultant", value: service.name ?? "" },
      {
        key: "status",
        label: "Status",
        value: service.status ?? "draft",
        options: ["draft", "submitted", "changes_requested", "approved", "published", "archived"]
      }
    ]
  }));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Consulting moderation</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Consultants</h1>
      </div>
      <AdminContentTable title="Consulting service records" rows={rows} emptyMessage="No consulting services have been created yet." />
    </div>
  );
}
