import { auth } from "@/auth";
import { ConsultingServiceManager } from "@/components/platform/consulting-service-manager";
import { connectMongoDB } from "@/lib/mongodb";
import { studioTrackId } from "@/lib/studio-identity";
import ConsultingService from "@/models/ConsultingService";

function cleanJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function normalizeManagerService(service: any) {
  return {
    id: String(service._id ?? service.id ?? service.slug),
    title: service.title ?? "Consulting service",
    slug: service.slug,
    expertName: service.expertName ?? "MR Creativist Consultant",
    expertTitle: service.expertTitle ?? "Creative business consultant",
    description: service.description ?? "",
    hourlyRate: Number(service.hourlyRate ?? 0),
    currency: (service.currency === "FRW" ? "FRW" : "USD") as "USD" | "FRW",
    expertise: Array.isArray(service.expertise) ? service.expertise : [],
    languages: Array.isArray(service.languages) ? service.languages : ["English"],
    sessionTypes: Array.isArray(service.sessionTypes) ? service.sessionTypes : [],
    availability: Array.isArray(service.availability) ? service.availability : [],
    image: service.heroImage ?? service.avatar,
    heroImage: service.heroImage,
    status: service.status ?? "draft",
    isVerified: Boolean(service.isVerified),
    rating: Number(service.rating ?? 0)
  };
}

export default async function ConsultantProfileEditPage() {
  const session = await auth();
  const ownerName = session?.user?.name ?? "MR Creativist Consultant";
  let services: ReturnType<typeof normalizeManagerService>[] = [];

  if (session?.user?.id) {
    await connectMongoDB();
    const ownerQuery = {
      $or: [{ expertId: session.user.id }, { studioId: studioTrackId(session.user) }],
      status: { $ne: "deleted" }
    };
    const records = await ConsultingService.find(ownerQuery).sort({ updatedAt: -1 }).limit(48).lean();
    services = cleanJson(records).map(normalizeManagerService);
  }

  return <ConsultingServiceManager ownerName={ownerName} initialServices={services} />;
}
