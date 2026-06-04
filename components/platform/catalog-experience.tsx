"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  BookOpen,
  CheckCircle2,
  Download,
  Filter,
  MessageCircle,
  MessageSquare,
  PackageCheck,
  PlayCircle,
  Search,
  ShoppingCart,
  Star,
  ThumbsUp,
  Users,
  Wallet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PriceDisplay } from "@/components/ui/price-display";
import { SafeImage } from "@/components/ui/safe-image";
import { VerifiedMark } from "@/components/ui/verified-mark";
import { convertMoney, isFreePrice, parseMoney } from "@/lib/currency";
import { courseImageForCategory } from "@/lib/course-media";
import { useI18n } from "@/hooks/use-i18n";
import { usePlatformStore } from "@/hooks/use-platform-store";
import { useUserPreferences } from "@/hooks/use-user-preferences";

type CatalogMode = "courses" | "marketplace";
type CatalogCourse = {
  id?: string;
  title: string;
  slug: string;
  level: string;
  category: string;
  price: string;
  compareAt?: string;
  rating: number;
  learners: number;
  duration: string;
  lessons: number;
  instructor: string;
  instructorAvatar?: string;
  instructorVerified?: boolean;
  image: string;
  tools: string[];
  pricingType?: string;
  accessType?: string;
  likes?: number;
};
type CatalogProduct = {
  id?: string;
  sellerId?: string;
  name: string;
  slug: string;
  type: string;
  category: string;
  price: string;
  compareAt?: string;
  seller: string;
  stock: number;
  rating: number;
  downloads: number;
  delivery: string;
  image: string;
  tools: string[];
  isVerified?: boolean;
  sellerVerified?: boolean;
  sellerEmail?: string;
  sellerPhone?: string;
};

const courseFilterChips = [
  "All",
  "Premium",
  "Paid",
  "Free",
  "AI",
  "Business",
  "Marketing",
  "Design",
  "Programming",
  "UI/UX",
  "Video Editing",
  "Data Science",
  "Finance",
  "E-commerce",
  "Photography",
  "Music",
  "Language",
  "Health",
  "Personal Development"
];

function compactCount(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(Math.max(0, value));
}

function courseAccessType(course: Pick<CatalogCourse, "accessType" | "pricingType" | "price">) {
  const explicit = course.accessType || course.pricingType;
  if (explicit === "premium" || explicit === "subscription" || explicit === "manual") return "premium";
  if (explicit === "free" || isFreePrice(course.price)) return "free";
  return "paid";
}

function accessLabel(accessType: string) {
  if (accessType === "premium") return "Premium";
  if (accessType === "free") return "Free";
  return "Paid";
}

function estimatedLikes(course: Pick<CatalogCourse, "likes" | "learners" | "rating">) {
  return Number(course.likes ?? Math.round(Number(course.learners ?? 0) * 0.18 + Number(course.rating ?? 0) * 24));
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CatalogExperience({
  mode,
  courses = [],
  products = []
}: {
  mode: CatalogMode;
  courses?: CatalogCourse[];
  products?: CatalogProduct[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [actionMessage, setActionMessage] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const { t } = useI18n();
  const preferences = useUserPreferences();
  const addToCart = usePlatformStore((state) => state.addToCart);
  const enrollCourse = usePlatformStore((state) => state.enrollCourse);
  const cartCount = usePlatformStore((state) => state.cartCount);
  const enrolledCourseSlugs = usePlatformStore((state) => state.enrolledCourseSlugs);

  const isCourses = mode === "courses";
  const catalogCourses = useMemo(() => courses, [courses]);
  const catalogProducts = useMemo(() => products, [products]);
  const filters = useMemo(
    () =>
      isCourses
        ? Array.from(new Set([...courseFilterChips, ...catalogCourses.map((item) => item.category)]))
        : [
            "All",
            ...Array.from(new Set(catalogProducts.map((item) => item.category)))
          ],
    [catalogCourses, catalogProducts, isCourses]
  );

  const filteredCourses = catalogCourses.filter((course) => {
    const searchTarget = `${course.title} ${course.category} ${course.instructor} ${course.level}`.toLowerCase();
    const matchesQuery = searchTarget.includes(query.toLowerCase());
    const accessType = courseAccessType(course);
    const matchesFilter =
      activeFilter === "All" ||
      course.category === activeFilter ||
      activeFilter.toLowerCase() === accessType ||
      searchTarget.includes(activeFilter.toLowerCase());

    return matchesQuery && matchesFilter;
  });

  const filteredProducts = catalogProducts.filter((product) => {
    const searchTarget = `${product.name} ${product.category} ${product.seller} ${product.type}`.toLowerCase();
    const matchesQuery = searchTarget.includes(query.toLowerCase());
    const matchesFilter = activeFilter === "All" || product.category === activeFilter;

    return matchesQuery && matchesFilter;
  });

  async function handleEnroll(course: CatalogCourse, openAfter = false) {
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(openAfter ? `/dashboard/learning/${course.slug}` : `/courses/${course.slug}/enroll`)}`);
      return;
    }

    setPendingAction(course.slug);
    enrollCourse(course.slug);

    try {
      const parsedPrice = parseMoney(course.price);
      const paidAmount = parsedPrice ? convertMoney(parsedPrice.amount, parsedPrice.currency, "USD", preferences.usdToFrw) : 0;
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id ?? course.slug,
          paidAmount
        })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Enrollment saved on this device. Please try again if it does not appear in your dashboard.");
      }

      setActionMessage(payload.message ?? "Enrollment saved.");
      toast.success(payload.message ?? "Enrollment saved.");
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Enrollment saved on this device. Please try again if it does not appear in your dashboard.";
      setActionMessage(nextMessage);
      if (nextMessage.toLowerCase().includes("saved")) {
        toast.success(nextMessage);
      } else {
        toast.error(nextMessage);
      }
    } finally {
      setPendingAction("");
      if (openAfter) router.push(`/dashboard/learning/${course.slug}`);
    }
  }

  function handleStartCourse(course: CatalogCourse) {
    const accessType = courseAccessType(course);
    if (accessType !== "free") {
      router.push(`/courses/${course.slug}/preview`);
      return;
    }

    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/dashboard/learning/${course.slug}`)}`);
      return;
    }

    void handleEnroll(course, true);
  }

  function handleAddToCart(product: CatalogProduct) {
    if (!canCheckoutProduct(product)) {
      const nextMessage = `${product.name} is not verified for online checkout yet. Contact the seller directly.`;
      setActionMessage(nextMessage);
      toast.message(nextMessage);
      return;
    }

    addToCart(product.slug);
    setActionMessage(`${product.name} added to cart.`);
    toast.success(`${product.name} added to cart.`);
  }

  function canCheckoutProduct(product: CatalogProduct) {
    return Boolean(product.isVerified || product.sellerVerified);
  }

  function messageHref(product: CatalogProduct) {
    if (product.sellerId) return `/messages/${product.sellerId}`;
    return `/messages?context=product&product=${encodeURIComponent(product.slug)}`;
  }

  function whatsappHref(product: CatalogProduct) {
    const phone = product.sellerPhone?.replace(/[^\d+]/g, "");
    const text = encodeURIComponent(`Hello ${product.seller}, I am interested in ${product.name} on MR Creativist.`);

    return phone ? `https://wa.me/${phone.replace(/^\+/, "")}?text=${text}` : `https://wa.me/?text=${text}`;
  }

  return (
    <div className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            {isCourses ? t("course.catalog") : t("nav.marketplace")}
          </h1>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href={isCourses ? "/dashboard/my-courses" : "/marketplace/cart"}>
                {isCourses ? <BookOpen className="size-4" /> : <ShoppingCart className="size-4" />}
                {isCourses ? t("course.myLearning") : `${t("market.cart")} ${cartCount ? `(${cartCount})` : ""}`}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={isCourses ? "/dashboard/certificates" : "/seller"}>
                <PackageCheck className="size-4" />
                {isCourses ? t("course.certificates") : t("market.sellerTools")}
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-14 pl-12 text-base"
              placeholder={isCourses ? "Search courses, skills, instructors, or certificates" : "Search products, sellers, services, or software"}
            />
          </div>
          <Button variant="outline" className="h-14">
            <Filter className="size-4" />
            Smart filters
          </Button>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`h-10 shrink-0 rounded-md border px-4 text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {actionMessage ? (
          <div className="mt-5 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 px-4 py-3 text-sm font-medium">
            {actionMessage}
          </div>
        ) : null}

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {isCourses && filteredCourses.length === 0 ? (
            <Card className="lg:col-span-3">
              <CardContent className="p-8 text-center">
                <BookOpen className="mx-auto mb-3 size-8 text-[hsl(var(--primary))]" />
                <h2 className="text-xl font-semibold">{t("course.noCourses")}</h2>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  {t("course.noCoursesBody")}
                </p>
              </CardContent>
            </Card>
          ) : !isCourses && filteredProducts.length === 0 ? (
            <Card className="lg:col-span-3">
              <CardContent className="p-8 text-center">
                <ShoppingCart className="mx-auto mb-3 size-8 text-[hsl(var(--primary))]" />
                <h2 className="text-xl font-semibold">{t("market.noProducts")}</h2>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  {t("market.noProductsBody")}
                </p>
              </CardContent>
            </Card>
          ) : isCourses
            ? filteredCourses.map((course) => {
                const enrolled = enrolledCourseSlugs.includes(course.slug);
                const courseHref = `/courses/${course.slug}`;
                const accessType = courseAccessType(course);
                const accessText = accessLabel(accessType);
                const likes = estimatedLikes(course);
                const instructorAvatar = "instructorAvatar" in course ? course.instructorAvatar : undefined;
                const instructorVerified = "instructorVerified" in course ? course.instructorVerified : false;

                return (
                  <Card key={course.slug} className="overflow-hidden">
                    <Link href={courseHref} className="block">
                      <div className="relative aspect-video">
                      <SafeImage
                        src={course.image}
                        fallbackSrc={courseImageForCategory(course.category)}
                        alt={course.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, 100vw"
                        className="object-cover"
                      />
                        <span className="absolute bottom-2 right-2 rounded bg-black/85 px-2 py-1 text-xs font-black text-white">
                          {course.duration || `${course.lessons} lessons`}
                        </span>
                      </div>
                    </Link>
                    <CardContent className="space-y-4 p-4">
                      <Link href={courseHref} className="block">
                        <h2 className="line-clamp-2 min-h-12 text-base font-black leading-6">{course.title}</h2>
                      </Link>
                      <div className="flex items-center gap-2">
                        <span
                          className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[hsl(var(--primary))]/10 text-xs font-black text-[hsl(var(--primary))]"
                          style={instructorAvatar ? { backgroundImage: `url(${instructorAvatar})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
                        >
                          {instructorAvatar ? null : initials(course.instructor || "MC")}
                        </span>
                        <span className="min-w-0 text-sm font-semibold">
                          <span className="inline-flex max-w-full items-center gap-1">
                            <span className="truncate">{course.instructor}</span>
                            {instructorVerified ? <VerifiedMark label="Verified instructor" className="size-3.5" /> : null}
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
                        <span className="flex items-center gap-1">
                          <Users className="size-4" />
                          {compactCount(course.learners)} students
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="size-4" />
                          {compactCount(likes)} likes
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <Badge className="border-[hsl(var(--primary))] text-[hsl(var(--primary))]">{accessText}</Badge>
                        <Button size="sm" disabled={pendingAction === course.slug} onClick={() => handleStartCourse(course)}>
                          {enrolled ? <CheckCircle2 className="size-4" /> : <PlayCircle className="size-4" />}
                          {pendingAction === course.slug
                            ? t("commerce.saving")
                            : enrolled
                              ? t("commerce.enrolled")
                              : accessType === "free"
                                ? "Start learning"
                                : "Start preview"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            : filteredProducts.map((product) => {
                const productHref = `/marketplace/product/${product.slug}`;
                const verifiedCheckout = canCheckoutProduct(product);

                return (
                <Card key={product.slug} className="overflow-hidden">
                  <div className="relative aspect-[4/3]">
                    <SafeImage src={product.image} alt={product.name} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                  </div>
                  <CardHeader>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{product.type}</Badge>
                      <Badge>{product.category}</Badge>
                    </div>
                    <CardTitle className="leading-tight">
                      <Link href={productHref} className="inline-flex min-w-0 items-center gap-1.5">
                        <span className="min-w-0">{product.name}</span>
                        {verifiedCheckout ? <VerifiedMark label="Verified seller account" /> : null}
                      </Link>
                    </CardTitle>
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                      <span>{product.seller}</span>
                      {verifiedCheckout ? <VerifiedMark label="Verified seller" /> : null}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-3 gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                      <span className="flex items-center gap-1">
                        <Star className="size-4 text-amber-500" />
                        {product.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="size-4" />
                        {product.downloads ? product.downloads.toLocaleString() : product.stock}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet className="size-4" />
                        {product.delivery}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.tools.slice(0, 3).map((tool) => (
                        <Badge key={tool}>{tool}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <PriceDisplay
                          price={product.price}
                          compareAt={product.compareAt}
                          className="text-xl text-[hsl(var(--primary))]"
                        />
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={productHref}>{t("commerce.view")}</Link>
                        </Button>
                        {verifiedCheckout ? (
                          <Button size="sm" onClick={() => handleAddToCart(product)}>
                            <ShoppingCart className="size-4" />
                            {t("commerce.add")}
                          </Button>
                        ) : (
                          <>
                            <Button asChild size="sm">
                              <Link href={messageHref(product)}>
                                <MessageSquare className="size-4" />
                                Message
                              </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <a href={whatsappHref(product)} target="_blank" rel="noreferrer">
                                <MessageCircle className="size-4" />
                                WhatsApp
                              </a>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
        </div>
      </section>

    </div>
  );
}
