import type { Metadata } from "next";
import { auth } from "@/auth";
import { UploadsWorkbench, type UploadAssetView } from "@/components/platform/uploads-workbench";
import connectMongoDB, { hasMongoConfig } from "@/lib/mongodb";
import UploadAsset from "@/models/UploadAsset";

export const metadata: Metadata = {
  title: "Uploads"
};

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export default async function InstructorResourcesPage() {
  const session = await auth();
  let assets: UploadAssetView[] = [];

  if (session?.user?.id && hasMongoConfig()) {
    try {
      await connectMongoDB();
      const items = await UploadAsset.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(80).lean();
      assets = items.map((item) => ({
        id: String(item._id),
        fileName: item.fileName ?? "Upload",
        url: item.url,
        secureUrl: item.secureUrl,
        playbackUrl: item.playbackUrl,
        embedUrl: item.embedUrl,
        thumbnailUrl: item.thumbnailUrl,
        provider: item.provider,
        kind: item.kind ?? "other",
        ownerType: item.ownerType,
        status: item.status,
        sizeBytes: Number(item.sizeBytes ?? 0),
        createdAt: item.createdAt?.toISOString?.() ?? String(item.createdAt ?? "")
      }));
    } catch {
      assets = [];
    }
  }

  return <UploadsWorkbench initialAssets={clean(assets)} />;
}
