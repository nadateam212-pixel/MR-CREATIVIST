"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  GraduationCap,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Users,
  Wallet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PriceDisplay } from "@/components/ui/price-display";
import { SafeImage } from "@/components/ui/safe-image";
import { convertMoney, parseMoney } from "@/lib/currency";
import { courseImageForCategory } from "@/lib/course-media";
import { platformWorkflows } from "@/lib/platform-data";
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
  image: string;
  tools: string[];
};
type CatalogProduct = {
  id?: string;
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
};

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
  const createdCourses = usePlatformStore((state) => state.createdCourses);
  const createdProducts = usePlatformStore((state) => state.createdProducts);

  const isCourses = mode === "courses";
  const catalogCourses = useMemo(
    () => [...courses, ...createdCourses.filter((course) => course.status === "published")],
    [courses, createdCourses]
  );
  const catalogProducts = useMemo(
    () => [...products, ...createdProducts.filter((product) => product.status === "published")],
    [products, createdProducts]
  );
  const filters = useMemo(
    () => [
      "All",
      ...Array.from(new Set((isCourses ? catalogCourses.map((item) => item.category) : catalogProducts.map((item) => item.category))))
    ],
    [catalogCourses, catalogProducts, isCourses]
  );

  const filteredCourses = catalogCourses.filter((course) => {
    const searchTarget = `${course.title} ${course.category} ${course.instructor} ${course.level}`.toLowerCase();
    const matchesQuery = searchTarget.includes(query.toLowerCase());
    const matchesFilter = activeFilter === "All" || course.category === activeFilter;

    return matchesQuery && matchesFilter;
  });

  const filteredProducts = catalogProducts.filter((product) => {
    const searchTarget = `${product.name} ${product.category} ${product.seller} ${product.type}`.toLowerCase();
    const matchesQuery = searchTarget.includes(query.toLowerCase());
    const matchesFilter = activeFilter === "All" || product.category === activeFilter;

    return matchesQuery && matchesFilter;
  });

  const workflow = platformWorkflows.find((item) => item.title === (isCourses ? "Course completion" : "Marketplace purchase"));

  async function handleEnroll(course: CatalogCourse) {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/courses/${course.slug}/enroll`);
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
    }
  }

  function handleAddToCart(product: CatalogProduct) {
    addToCart(product.slug);
    setActionMessage(`${product.name} added to cart.`);
    toast.success(`${product.name} added to cart.`);
  }

  return (
    <div className="bg-[hsl(var(--background))]">
      <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
              {isCourses ? t("course.catalog") : t("nav.marketplace")}
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
              {isCourses ? t("course.heroTitle") : t("market.heroTitle")}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[hsl(var(--muted-foreground))]">
              {isCourses ? t("course.heroDescription") : t("market.heroDescription")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={isCourses ? "/dashboard/my-courses" : "/marketplace/cart"}>
                  {isCourses ? <GraduationCap className="size-5" /> : <ShoppingCart className="size-5" />}
                  {isCourses ? t("course.myLearning") : `${t("market.cart")} ${cartCount ? `(${cartCount})` : ""}`}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={isCourses ? "/dashboard/certificates" : "/seller"}>
                  {isCourses ? <ShieldCheck className="size-5" /> : <PackageCheck className="size-5" />}
                  {isCourses ? t("course.certificates") : t("market.sellerTools")}
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative min-h-[24rem] overflow-hidden rounded-lg border border-[hsl(var(--border))]">
            <SafeImage
              src={
                isCourses
                  ? "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=85"
                  : "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=85"
              }
              alt={isCourses ? "Learners using the course platform" : "Marketplace checkout workspace"}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
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

                return (
                  <Card key={course.slug} className="overflow-hidden">
                    <div className="relative aspect-[4/3]">
                      <SafeImage
                        src={course.image}
                        fallbackSrc={courseImageForCategory(course.category)}
                        alt={course.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <CardHeader>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{course.level}</Badge>
                        <Badge>{course.category}</Badge>
                      </div>
                      <CardTitle className="leading-tight">
                        <Link href={courseHref}>{course.title}</Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="grid grid-cols-3 gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                        <span className="flex items-center gap-1">
                          <Star className="size-4 text-amber-500" />
                          {course.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="size-4" />
                          {course.learners.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-4" />
                          {course.duration}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {course.tools.slice(0, 3).map((tool) => (
                          <Badge key={tool}>{tool}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <PriceDisplay
                            price={course.price}
                            compareAt={course.compareAt}
                            className="text-xl text-[hsl(var(--primary))]"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={courseHref}>{t("commerce.preview")}</Link>
                          </Button>
                          <Button size="sm" disabled={pendingAction === course.slug} onClick={() => handleEnroll(course)}>
                            {enrolled ? <CheckCircle2 className="size-4" /> : <BookOpen className="size-4" />}
                            {pendingAction === course.slug ? t("commerce.saving") : enrolled ? t("commerce.enrolled") : t("commerce.enroll")}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            : filteredProducts.map((product) => {
                const productHref = `/marketplace/product/${product.slug}`;

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
                      <Link href={productHref}>{product.name}</Link>
                    </CardTitle>
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
                    <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{product.seller}</p>
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
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={productHref}>{t("commerce.view")}</Link>
                        </Button>
                        <Button size="sm" onClick={() => handleAddToCart(product)}>
                          <ShoppingCart className="size-4" />
                          {t("commerce.add")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
        </div>
      </section>

      {workflow ? (
        <section className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              {workflow.steps.map((step, index) => (
                <div key={step} className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                  <p className="text-xs font-semibold text-[hsl(var(--primary))]">{String(index + 1).padStart(2, "0")}</p>
                  <p className="mt-2 font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
