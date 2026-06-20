import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  PlayCircle,
  Sparkles,
  Star,
  ThumbsUp,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LocalizedPrice } from "@/components/platform/localized-price";
import { SafeImage } from "@/components/ui/safe-image";
import { VerifiedMark } from "@/components/ui/verified-mark";
import { accessBadgeClass } from "@/lib/access-styles";
import { brand } from "@/lib/brand";
import { getCourses, getFreelancers, getGigs, getJobPosts, getProducts, getShopProfiles } from "@/lib/platform-db";

type RankedItem = {
  [key: string]: unknown;
  name?: string;
  title?: string;
  slug?: string;
  image?: string;
  price?: string | number;
  category?: string;
  companyName?: string;
  location?: string;
  companyLogo?: string;
  coverImage?: string;
  logo?: string;
  ownerName?: string;
  packageName?: string;
  instructor?: string;
  isFeatured?: boolean;
  rating?: number;
  learners?: number;
  likes?: number;
  pricingType?: string;
  accessType?: string;
  downloads?: number;
  completed?: number;
  isVerified?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  productsOrServices?: unknown[];
};

function textValue(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function timeValue(value: unknown) {
  const time = value ? new Date(String(value)).getTime() : 0;
  return Number.isFinite(time) ? time / 10_000_000_000 : 0;
}

function topItems<T extends RankedItem>(items: T[], score: (item: T) => number) {
  return [...items].sort((left, right) => score(right) - score(left));
}

function courseScore(course: RankedItem) {
  return (course.isFeatured ? 100000 : 0) + numberValue(course.learners) * 2 + numberValue(course.rating) * 1000 + timeValue(course.updatedAt ?? course.createdAt);
}

function productScore(product: RankedItem) {
  return (product.isFeatured ? 100000 : 0) + numberValue(product.downloads) * 3 + numberValue(product.rating) * 1000 + timeValue(product.updatedAt ?? product.createdAt);
}

function freelancerScore(freelancer: RankedItem) {
  return numberValue(freelancer.rating) * 1000 + numberValue(freelancer.completed) * 4 + timeValue(freelancer.updatedAt ?? freelancer.createdAt);
}

function freshFeaturedScore(item: RankedItem) {
  return (item.isFeatured ? 100000 : 0) + numberValue(item.rating) * 1000 + (item.productsOrServices?.length ?? 0) * 20 + timeValue(item.updatedAt ?? item.createdAt);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function accessLabel(item: RankedItem) {
  const explicit = String(item.accessType ?? item.pricingType ?? "").toLowerCase();
  if (["premium", "subscription", "manual"].includes(explicit)) return "Premium";
  if (explicit === "free") return "Free";
  const numericPrice = Number(String(item.price ?? "").replace(/[^0-9.]/g, ""));
  return numericPrice > 0 ? "Paid" : "Free";
}

function courseLikes(item: RankedItem) {
  return numberValue(item.likes ?? Math.round(numberValue(item.learners) * 0.18 + numberValue(item.rating) * 24));
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-lg font-black text-[hsl(var(--foreground))]">{title}</h2>
      <Link href={href} className="text-sm font-bold text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]">
        View all <ArrowRight className="ml-1 inline size-4 text-[hsl(var(--primary))]" />
      </Link>
    </div>
  );
}

function MiniRecordGrid({
  title,
  href,
  records,
  icon: Icon
}: {
  title: string;
  href: string;
  records: RankedItem[];
  icon: LucideIcon;
}) {
  return (
    <Card className="h-full border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">
      <CardContent className="p-4">
        <SectionTitle title={title} href={href} />
        <div className="grid gap-3 sm:grid-cols-2">
          {records.map((record) => {
            const image = textValue(record.image ?? record.companyLogo ?? record.coverImage ?? record.logo);
            const titleText = textValue(record.title ?? record.name, "Public record");
            const subtitle = textValue(record.companyName ?? record.ownerName ?? record.category ?? record.location, "MR Creativist");

            return (
              <Link key={String(record.slug ?? titleText)} href={href} className="overflow-hidden rounded-md border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/45">
                <div className="relative aspect-video bg-[hsl(var(--muted))]">
                  {image ? <SafeImage src={image} alt={titleText} fill sizes="220px" className="object-cover" /> : <Icon className="absolute left-3 top-3 size-5 text-[hsl(var(--primary))]" />}
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 font-semibold">{titleText}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-[hsl(var(--muted-foreground))]">{subtitle}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function HomePage() {
  const [courses, products, freelancers, jobs, shops, gigs] = await Promise.all([
    getCourses({ limit: 16 }),
    getProducts({ limit: 32 }),
    getFreelancers({ limit: 12 }),
    getJobPosts({ limit: 12 }),
    getShopProfiles({ limit: 12 }),
    getGigs({ limit: 12 })
  ]);
  const courseItems = topItems(courses, courseScore).slice(0, 8);
  const productItems = topItems(products, productScore).slice(0, 24);
  const freelancerItems = topItems(freelancers, freelancerScore).slice(0, 6);
  const jobItems = topItems(jobs, freshFeaturedScore).slice(0, 4);
  const shopItems = topItems(shops, freshFeaturedScore).slice(0, 4);
  const gigItems = topItems(gigs, freshFeaturedScore).slice(0, 4);
  const ratingValues = [...courseItems, ...freelancerItems, ...productItems, ...shopItems]
    .map((item) => numberValue((item as RankedItem).rating))
    .filter((rating) => rating > 0);
  const averageRating = ratingValues.length
    ? ratingValues.reduce((total, rating) => total + rating, 0) / ratingValues.length
    : 0;
  const learnerTotal = courseItems.reduce((total, course) => total + numberValue(course.learners), 0);
  const liveRecordCount = courses.length + products.length + freelancers.length + jobs.length + shops.length + gigs.length;

  return (
    <div className="app-frame py-5">
      <section
        className="overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-lg"
        style={{ boxShadow: "0 20px 60px hsl(var(--primary) / 0.12)" }}
      >
        <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:p-5 xl:grid-cols-[1fr_24rem]">
          <div className="flex min-h-[10rem] flex-col justify-center">
            <div className="mb-3 flex items-center gap-3">
              <span className="relative flex size-12 shrink-0 overflow-hidden rounded-md bg-white p-1 shadow-md sm:size-14">
                <Image src={brand.logo} alt={brand.name} fill sizes="56px" className="object-contain p-1" priority />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[hsl(var(--primary))]">Welcome to</p>
                <p className="text-lg font-black uppercase tracking-wide">{brand.name}</p>
              </div>
            </div>
            <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              Learn. Work. Sell. Grow.
            </h1>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/courses">
                  Explore Platform
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/ai-tools">
                  <Sparkles className="size-4" />
                  MrCreativist.AI
                </Link>
              </Button>
            </div>
          </div>

          <div className="hidden content-center gap-3 sm:grid sm:grid-cols-3 xl:grid-cols-1">
            {[
              { value: averageRating.toFixed(1), label: "Average platform rating", icon: Star },
              { value: formatCompact(learnerTotal), label: "Course learners", icon: Users },
              { value: formatCompact(liveRecordCount), label: "Live public records", icon: BadgeCheck }
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/55 p-3">
                <Icon className="size-5 shrink-0 text-[hsl(var(--primary))]" />
                <div>
                  <p className="text-xl font-black">{value}</p>
                  <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle title="Featured Courses" href="/courses" />
        <div className="card-grid-fill grid-courses">
          {courseItems.map((course) => (
            <Link key={textValue(course.slug, course.title)} href={`/courses/${textValue(course.slug)}`}>
              <Card className="overflow-hidden border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]/45">
                <div className="relative aspect-video">
                  <SafeImage src={textValue(course.image)} alt={textValue(course.title, "Course")} fill sizes="(min-width: 1280px) 25vw, 50vw" className="object-cover" />
                  <span className="absolute bottom-2 right-2 rounded bg-black/85 px-2 py-1 text-xs font-black text-white">
                    {textValue(course.duration, "Self-paced")}
                  </span>
                  <span className="absolute left-3 top-3 rounded-full bg-slate-950/75 p-2 text-white">
                    <PlayCircle className="size-4" />
                  </span>
                </div>
                <CardContent className="p-4">
                  <p className="line-clamp-2 min-h-10 font-bold leading-5">{textValue(course.title, "Course")}</p>
                  <p className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                    <span className="truncate">{textValue(course.instructor, "MR Creativist")}</span>
                    {"instructorVerified" in course && course.instructorVerified ? <VerifiedMark label="Verified instructor" className="size-3.5" /> : null}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                    <span>{formatCompact(Number(course.learners ?? 0))} students</span>
                    <span><ThumbsUp className="mr-1 inline size-3" />{formatCompact(courseLikes(course))} likes</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <span className={`rounded-md border px-2 py-1 font-bold ${accessBadgeClass(accessLabel(course).toLowerCase())}`}>{accessLabel(course)}</span>
                    <span><Star className="mr-1 inline size-3 fill-amber-400 text-amber-400" />{course.rating}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle title="Top Freelancers" href="/freelancers" />
        <div className="card-grid-fill grid-freelancers">
          {freelancerItems.map((freelancer) => (
            <Card key={textValue(freelancer.name, freelancer.slug)} className="overflow-hidden border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">
              <div className="relative h-40">
                <SafeImage src={textValue(freelancer.image)} alt={textValue(freelancer.name, "Freelancer")} fill sizes="220px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="flex items-center gap-1 font-bold text-white">
                    <span className="min-w-0 truncate">{textValue(freelancer.name, "Freelancer")}</span>
                    {"isVerified" in freelancer && freelancer.isVerified ? <VerifiedMark label="Verified freelancer" className="size-4" /> : null}
                  </p>
                  <p className="text-xs text-white/80">{textValue(freelancer.role, "Creator")}</p>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-xs">
                  <span><Star className="mr-1 inline size-3 fill-amber-400 text-amber-400" />{freelancer.rating}</span>
                  <span>{freelancer.completed} jobs</span>
                </div>
                <Button asChild size="sm" className="mt-3 w-full">
                  <Link href="/freelancers">Hire Me</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle title="Popular Products" href="/marketplace" />
        <div className="card-grid-fill grid-products">
          {productItems.map((product) => (
            <Link key={textValue(product.slug, product.name)} href={`/marketplace/product/${textValue(product.slug)}`}>
              <Card className="overflow-hidden border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">
                <div className="relative aspect-video">
                  <SafeImage src={textValue(product.image)} alt={textValue(product.name, "Product")} fill sizes="220px" className="object-cover" />
                </div>
                <CardContent className="p-4">
                  <p className="line-clamp-1 font-bold">{textValue(product.name, "Product")}</p>
                  <LocalizedPrice value={textValue(product.price, "$0")} className="mt-1 block text-sm text-[hsl(var(--muted-foreground))]" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="card-grid-fit grid-mini-records mt-6">
        <MiniRecordGrid title="Recent Job" href="/jobs" records={jobItems} icon={BriefcaseBusiness} />
        <MiniRecordGrid title="Top Business" href="/business-directory" records={shopItems} icon={Building2} />
        <MiniRecordGrid title="Top Gigs" href="/freelancers" records={gigItems} icon={Sparkles} />
      </section>
    </div>
  );
}
