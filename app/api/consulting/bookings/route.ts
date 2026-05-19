import Booking from "@/models/Booking";
import ConsultingService from "@/models/ConsultingService";
import { bookingSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, mongoIdOrSlug, parsePagination, readJson, requireMongo } from "@/lib/mongo-api";

export async function GET(request: Request) {
  try {
    await requireMongo();
    const { limit, skip } = parsePagination(request);
    const [items, total] = await Promise.all([
      Booking.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Booking.countDocuments({})
    ]);

    return jsonOk({ items, total });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireMongo();
    const body = bookingSchema.parse(await readJson(request));
    const service = await ConsultingService.findOne(mongoIdOrSlug(body.serviceId)).lean();

    if (!service) return jsonOk({ error: "Consulting service not found." }, 404);

    const booking = await Booking.create({
      ...body,
      serviceId: service._id
    });

    return jsonOk({ item: booking, message: "Booking request saved." }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
