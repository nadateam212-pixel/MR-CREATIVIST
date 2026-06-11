import mongoose from "mongoose";
import { auth } from "@/auth";
import { ApiError, apiError, apiOk } from "@/lib/api";
import connectMongoDB from "@/lib/mongodb";
import UploadAsset from "@/models/UploadAsset";

function contentDisposition(fileName: string) {
  const safeName = fileName.replace(/["\r\n]/g, "").slice(0, 180) || "document";
  return `inline; filename="${safeName}"`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) throw new ApiError("Unauthorized.", 401);

    const { assetId } = await params;
    if (!mongoose.Types.ObjectId.isValid(assetId)) {
      throw new ApiError("Document not found.", 404);
    }

    await connectMongoDB();

    const asset = await UploadAsset.findById(assetId).select("+data");
    if (!asset) throw new ApiError("Document not found.", 404);

    const ownsAsset = String(asset.userId) === session.user.id;
    const canReview = session.user.role === "admin";
    if (!ownsAsset && !canReview) {
      throw new ApiError("You do not have access to this document.", 403);
    }

    if (!asset.data) {
      const target = asset.secureUrl || asset.playbackUrl || asset.embedUrl || asset.url;
      if (target && !target.startsWith("/api/uploads/")) {
        return Response.redirect(target, 302);
      }

      throw new ApiError("Document not found.", 404);
    }

    return new Response(Buffer.from(asset.data, "base64"), {
      headers: {
        "Content-Type": asset.mimeType || "application/octet-stream",
        "Content-Length": String(asset.sizeBytes ?? 0),
        "Content-Disposition": contentDisposition(asset.fileName),
        "Cache-Control": "private, max-age=60"
      }
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) throw new ApiError("Unauthorized.", 401);

    const { assetId } = await params;
    if (!mongoose.Types.ObjectId.isValid(assetId)) {
      throw new ApiError("Document not found.", 404);
    }

    await connectMongoDB();
    const asset = await UploadAsset.findById(assetId);
    if (!asset) throw new ApiError("Document not found.", 404);

    const ownsAsset = String(asset.userId) === session.user.id;
    const canReview = session.user.role === "admin";
    if (!ownsAsset && !canReview) {
      throw new ApiError("You do not have access to this document.", 403);
    }

    await UploadAsset.findByIdAndDelete(assetId);
    return apiOk({ ok: true, deleted: true, id: assetId });
  } catch (error) {
    return apiError(error);
  }
}
