import ShopProfile from "@/models/ShopProfile";
import { shopProfileSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeShopProfile, slugify } from "@/lib/platform-db";

const shopPatchSchema = shopProfileSchema.partial();

function canManageShop(session: Awaited<ReturnType<typeof requireRole>>, shop: { ownerId?: unknown }) {
  if (session.user.role === "admin") return true;
  return String(shop.ownerId ?? "") === String(session.user.id);
}

export async function GET(_: Request, context: { params: Promise<{ shopId: string }> }) {
  try {
    await requireMongo();
    const { shopId } = await context.params;
    const shop = await ShopProfile.findOne(mongoIdOrSlug(shopId)).lean();

    if (!shop) return jsonOk({ error: "Shop not found." }, 404);

    return jsonOk(normalizeShopProfile(shop));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ shopId: string }> }) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin", "seller"]);
    const { shopId } = await context.params;
    const existing = await ShopProfile.findOne(mongoIdOrSlug(shopId));

    if (!existing) return jsonOk({ error: "Shop not found." }, 404);
    if (!canManageShop(session, existing)) {
      return jsonOk({ error: "You can only manage your own shop." }, 403);
    }

    const body = shopPatchSchema.parse(await readJson(request));
    const isAdmin = session.user.role === "admin";
    const patch: Record<string, unknown> = {
      ...body,
      ...(isAdmin ? {} : { status: body.status === "draft" ? "draft" : "published", isVerified: existing.isVerified })
    };

    if (body.slug || body.name) {
      patch.slug = await uniqueSlugFor(ShopProfile, body.slug ?? slugify(body.name), existing._id);
    }

    const shop = await ShopProfile.findByIdAndUpdate(existing._id, patch, {
      returnDocument: "after",
      runValidators: true
    });

    return jsonOk(normalizeShopProfile(shop));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ shopId: string }> }) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin", "seller"]);
    const { shopId } = await context.params;
    const existing = await ShopProfile.findOne(mongoIdOrSlug(shopId));

    if (!existing) return jsonOk({ error: "Shop not found." }, 404);
    if (!canManageShop(session, existing)) {
      return jsonOk({ error: "You can only archive your own shop." }, 403);
    }

    if (session.user.role === "admin" && new URL(request.url).searchParams.get("hard") === "1") {
      await ShopProfile.findByIdAndDelete(existing._id);
      return jsonOk({ ok: true, deleted: true });
    }

    const shop = await ShopProfile.findByIdAndUpdate(existing._id, { status: "archived" }, { returnDocument: "after" });

    return jsonOk({ ok: true, item: normalizeShopProfile(shop) });
  } catch (error) {
    return jsonError(error);
  }
}
