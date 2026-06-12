"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle2, CreditCard, GraduationCap, Loader2, ShieldCheck, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { convertMoney, formatConvertedAmount, isFreePrice, parseMoney } from "@/lib/currency";
import { titleFromCourseSlug } from "@/lib/course-media";
import { PaymentMethodSelector, type CheckoutPaymentDetails, type CheckoutPaymentMethod } from "@/components/platform/payment-method-selector";
import { useI18n } from "@/hooks/use-i18n";
import { usePlatformStore } from "@/hooks/use-platform-store";
import { useUserPreferences } from "@/hooks/use-user-preferences";

type EnrollmentCourse = {
  id?: string;
  title: string;
  slug: string;
  level: string;
  certificate: string;
  price: string;
  outcomes: string[];
};

export function CourseEnrollmentPanel({ slug, course }: { slug: string; course?: EnrollmentCourse | null }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("mtn_momo");
  const [paymentDetails, setPaymentDetails] = useState<CheckoutPaymentDetails>({
    mobilePhone: "",
    paypalEmail: "",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvc: ""
  });
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [walletBalanceFrw, setWalletBalanceFrw] = useState(0);
  const preferences = useUserPreferences();
  const { t } = useI18n();
  const enrollCourse = usePlatformStore((state) => state.enrollCourse);
  const enrolledCourseSlugs = usePlatformStore((state) => state.enrolledCourseSlugs);
  const createdCourses = usePlatformStore((state) => state.createdCourses);
  const localCourse = createdCourses.find((item) => item.slug === slug);
  const resolvedCourse =
    course ??
    (localCourse
      ? {
          id: localCourse.slug,
          title: localCourse.title,
          slug: localCourse.slug,
          level: localCourse.level,
          certificate: localCourse.certificate,
          price: localCourse.price,
          outcomes: localCourse.outcomes
        }
      : {
          id: slug,
          title: titleFromCourseSlug(slug),
          slug,
          level: "Beginner",
          certificate: "Completion certificate",
          price: "$0",
          outcomes: ["Start learning", "Complete practice tasks", "Earn certificate-ready proof"]
        });
  const alreadyEnrolled = resolvedCourse ? enrolledCourseSlugs.includes(resolvedCourse.slug) : false;
  const parsedPrice = parseMoney(resolvedCourse?.price ?? "$0");
  const subtotal = parsedPrice ? convertMoney(parsedPrice.amount, parsedPrice.currency, "USD", preferences.usdToFrw) : 0;
  const total = subtotal;
  const freeCourse = isFreePrice(resolvedCourse?.price ?? "$0");
  const displayMoney = (amount: number) => formatConvertedAmount(amount, "USD", preferences.currency, preferences.usdToFrw);
  const displayFrw = (amount: number) => formatConvertedAmount(amount, "FRW", "FRW", preferences.usdToFrw);
  const displayCourseMoney = (amount: number) => (amount <= 0 ? "Free" : displayMoney(amount));

  useEffect(() => {
    let active = true;

    async function loadWallet() {
      try {
        const response = await fetch("/api/wallet", { cache: "no-store" });
        const payload = await response.json();
        if (active && response.ok) setWalletBalanceFrw(Number(payload.balance ?? 0));
      } catch {
        if (active) setWalletBalanceFrw(0);
      }
    }

    void loadWallet();
    return () => {
      active = false;
    };
  }, []);

  async function completeEnrollment() {
    if (!resolvedCourse || submitting) return;
    if (!session?.user) {
      router.push(`/login?callbackUrl=/courses/${resolvedCourse.slug}/enroll`);
      return;
    }

    if (!freeCourse && paymentMethod === "stripe") {
      setStatus("Stripe card payments are coming soon. Choose MTN MoMo, PayPal, or Wallet.");
      return;
    }

    setSubmitting(true);
    setStatus(freeCourse ? "Saving enrollment..." : "Processing payment...");

    try {
      const response = await fetch(freeCourse ? "/api/enrollments" : "/api/checkout/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: resolvedCourse.id ?? resolvedCourse.slug,
          paidAmount: total,
          paymentMethod,
          paymentDetails,
          buyerName: session.user.name,
          buyerEmail: session.user.email
        })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(payload.error ?? "Enrollment could not be saved.");

      if (payload.approvalUrl) {
        setStatus("Redirecting to PayPal...");
        globalThis.location.assign(payload.approvalUrl);
        return;
      }

      setStatus(payload.message ?? "Enrollment saved.");
      if (payload.status === "pending") {
        setSubmitting(false);
        return;
      }

      enrollCourse(resolvedCourse.slug);
      setComplete(true);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Enrollment saved on this device. Please try again if it does not appear in your dashboard.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Badge>{resolvedCourse.level}</Badge>
            <Badge>{resolvedCourse.certificate}</Badge>
            {freeCourse ? <Badge className="border-[hsl(var(--primary))] text-[hsl(var(--primary))]">Free</Badge> : null}
          </div>
          <CardTitle className="pt-3">{resolvedCourse.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {complete || alreadyEnrolled ? (
            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35 p-5">
              <p className="flex items-center gap-2 text-lg font-semibold text-[hsl(var(--primary))]">
                <CheckCircle2 className="size-5" />
                Enrollment active
              </p>
              <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Course access, progress tracking, quizzes, assignments, uploads, and certificate eligibility are now enabled.
              </p>
              {status ? <p className="mt-3 text-sm font-medium">{status}</p> : null}
              <Button asChild className="mt-4">
                <Link href={`/dashboard/learning/${resolvedCourse.slug}`}>
                  <GraduationCap className="size-4" />
                  Continue learning
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                {resolvedCourse.outcomes.map((outcome) => (
                  <div key={outcome} className="rounded-md border border-[hsl(var(--border))] p-4 text-sm">
                    <ShieldCheck className="mb-3 size-4 text-[hsl(var(--primary))]" />
                    {outcome}
                  </div>
                ))}
              </div>
              <div className="grid gap-3">
                <div>
                  <p className="text-sm font-medium">Payment method</p>
                  <div className="mt-2">
                    <PaymentMethodSelector
                      value={paymentMethod}
                      onChange={setPaymentMethod}
                      details={paymentDetails}
                      onDetailsChange={setPaymentDetails}
                      walletBalance={displayFrw(walletBalanceFrw)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enrollment summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">{t("commerce.coursePrice")}</span>
              <span>{displayCourseMoney(subtotal)}</span>
            </div>
            <div className="border-t border-[hsl(var(--border))] pt-3 text-base font-semibold">
              <div className="flex justify-between">
                <span>{t("commerce.total")}</span>
                <span>{displayCourseMoney(total)}</span>
              </div>
            </div>
          </div>
          <div className="rounded-md border border-[hsl(var(--border))] p-3 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <Wallet className="size-4 text-[hsl(var(--primary))]" />
              {t("commerce.walletBalance")}
            </p>
            <p className="mt-1 text-[hsl(var(--muted-foreground))]">{displayFrw(walletBalanceFrw)}</p>
          </div>
          <Button className="w-full" disabled={complete || alreadyEnrolled || submitting} onClick={completeEnrollment}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
            {submitting ? "Saving enrollment" : freeCourse ? "Start free course" : "Complete enrollment"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
