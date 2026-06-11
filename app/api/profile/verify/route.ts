import { auth } from "@/auth";
import { ApiError, apiError, apiOk } from "@/lib/api";
import connectMongoDB from "@/lib/mongodb";
import { latestBalance, recordWalletTransaction } from "@/lib/platform-ledger";
import User from "@/models/User";

const VERIFICATION_PRICE_FRW = 5000;

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) throw new ApiError("Unauthorized.", 401);

    await connectMongoDB();
    const user = await User.findById(session.user.id).select("_id email name role isVerified").lean();
    if (!user) throw new ApiError("Profile not found.", 404);
    if (user.isVerified) return apiOk({ verified: true, message: "Account is already verified." });

    const balance = await latestBalance(session.user.email.toLowerCase(), "FRW");
    if (balance < VERIFICATION_PRICE_FRW) {
      throw new ApiError("Add at least FRW 5,000 to your wallet to verify this account.", 402);
    }

    const transaction = await recordWalletTransaction(
      { id: String(user._id), email: user.email, name: user.name, role: user.role },
      {
        type: "purchase",
        direction: "debit",
        amount: VERIFICATION_PRICE_FRW,
        currency: "FRW",
        status: "completed",
        description: "Account verification badge",
        referenceType: "manual",
        metadata: {
          payableType: "account_verification",
          usdPrice: 3.99
        }
      }
    );

    await User.findByIdAndUpdate(user._id, { isVerified: true });
    return apiOk({
      verified: true,
      message: "Account verified. Badge activated.",
      transactionId: String(transaction._id)
    });
  } catch (error) {
    return apiError(error);
  }
}
