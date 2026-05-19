import connectMongoDB from "@/lib/mongodb";
import CertificateCredential from "@/models/CertificateCredential";

export async function GET(request: Request) {
  try {
    await connectMongoDB();
    const url = new URL(request.url);
    const code = url.searchParams.get("code")?.trim().toUpperCase();

    if (!code) {
      return Response.json({ error: "Verification code is required." }, { status: 400 });
    }

    const certificate = await CertificateCredential.findOne({ verificationCode: code }).lean();
    if (!certificate) return Response.json({ verified: false, error: "Certificate not found." }, { status: 404 });

    return Response.json({
      verified: certificate.status === "issued",
      certificate: {
        learnerName: certificate.learnerName,
        courseTitle: certificate.courseTitle,
        verificationCode: certificate.verificationCode,
        issuedAt: certificate.issuedAt,
        status: certificate.status
      }
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Verification failed." }, { status: 500 });
  }
}

export async function POST() {
  return Response.json({ message: "Certificate share tracking ready.", requestId: crypto.randomUUID() }, { status: 201 });
}
