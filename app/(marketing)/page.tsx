import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  PlayCircle,
  ShoppingBag,
  Sparkles,
  Star,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocalizedPrice } from "@/components/platform/localized-price";
import { SafeImage } from "@/components/ui/safe-image";
import { VerifiedMark } from "@/components/ui/verified-mark";
import { accessBadgeClass } from "@/lib/access-styles";
import { brand } from "@/lib/brand";
import { getCourses, getFreelancers, getGigs, getJobPosts, getProducts, getShopProfiles } from "@/lib/platform-db";

export const revalidate = 15;

type RankedItem = {
  [key: string]: unknown;
  id?: string;
  profileId?: string;
  name?: string;
  title?: string;
  slug?: string;
  image?: string;
  ownerImage?: string;
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
  seller?: string;
  role?: string;
  city?: string;
  country?: string;
  employmentType?: string;
  deliveryDays?: number;
  isFeatured?: boolean;
  isVerified?: boolean;
  instructorVerified?: boolean;
  rating?: number;
  learners?: number;
  likes?: number;
  pricingType?: string;
  accessType?: string;
  downloads?: number;
  completed?: number;
  orders?: number;
  rate?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  productsOrServices?: unknown[];
};

type HomeRecord = {
  key: string;
  href: string;
  title: string;
  subtitle: string;
  meta: string;
  image: string;
  icon: LucideIcon;
  badge?: string;
  badgeClass?: string;
  price?: string;
  verified?: boolean;
  media?: "cover" | "logo";
  weight: number;
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

function randomItems<T>(items: T[], limit: number) {
  return [...items]
    .map((item) => ({ item, rank: Math.random() }))
    .sort((left, right) => right.rank - left.rank)
    .map(({ item }) => item)
    .slice(0, limit);
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

function hrefFor(base: string, slug?: string) {
  return slug ? `${base}/${slug}` : base;
}

function rateLabel(rate: unknown) {
  const numeric = numberValue(rate);
  return numeric > 0 ? `FRW ${numeric.toLocaleString("en")}/hr` : "Rate on request";
}

function courseRecord(course: RankedItem): HomeRecord {
  const access = accessLabel(course);
  const slug = textValue(course.slug);
  return {
    key: `course-${slug || course.title}`,
    href: hrefFor("/courses", slug),
    title: textValue(course.title, "Course"),
    subtitle: textValue(course.instructor, "MR Creativist"),
    meta: `${formatCompact(numberValue(course.learners))} students - ${formatCompact(courseLikes(course))} likes`,
    image: textValue(course.image, brand.logo),
    icon: PlayCircle,
    badge: access,
    badgeClass: accessBadgeClass(access.toLowerCase()),
    verified: Boolean(course.instructorVerified),
    weight: 4
  };
}

function productRecord(product: RankedItem): HomeRecord {
  const slug = textValue(product.slug);
  return {
    key: `product-${slug || product.name}`,
    href: slug ? `/marketplace/product/${slug}` : "/marketplace",
    title: textValue(product.name, "Product"),
    subtitle: textValue(product.seller ?? product.category, "Marketplace"),
    meta: `${formatCompact(numberValue(product.downloads))} downloads`,
    image: textValue(product.image, brand.logo),
    icon: ShoppingBag,
    badge: textValue(product.category, "Product"),
    price: textValue(product.price),
    weight: 1
  };
}

function freelancerRecord(freelancer: RankedItem): HomeRecord {
  const profileId = textValue(freelancer.slug ?? freelancer.profileId ?? freelancer.id);
  return {
    key: `freelancer-${profileId || freelancer.name}`,
    href: hrefFor("/freelancers", profileId),
    title: textValue(freelancer.name, "Freelancer"),
    subtitle: textValue(freelancer.role, "Creative professional"),
    meta: `${rateLabel(freelancer.rate)} - ${textValue(freelancer.location, "Remote")}`,
    image: textValue(freelancer.image, brand.logo),
    icon: Users,
    badge: `${Number(freelancer.rating ?? 0).toFixed(1)} rating`,
    verified: Boolean(freelancer.isVerified),
    weight: 1.5
  };
}

function jobRecord(job: RankedItem): HomeRecord {
  return {
    key: `job-${textValue(job.slug) || job.title}`,
    href: "/jobs",
    title: textValue(job.title, "Open job"),
    subtitle: textValue(job.companyName, "Hiring company"),
    meta: textValue(job.location, "Remote"),
    image: textValue(job.companyLogo, ""),
    icon: BriefcaseBusiness,
    badge: textValue(job.employmentType, "Job"),
    verified: Boolean(job.isFeatured),
    media: "logo",
    weight: 2.5
  };
}

function businessRecord(shop: RankedItem): HomeRecord {
  return {
    key: `business-${textValue(shop.slug) || shop.name}`,
    href: "/business-directory",
    title: textValue(shop.name, "Business"),
    subtitle: textValue(shop.category, "Business"),
    meta: [shop.city, shop.country].filter(Boolean).join(", ") || "Online",
    image: textValue(shop.logo ?? shop.coverImage, brand.logo),
    icon: Building2,
    badge: `${Number(shop.rating ?? 0).toFixed(1)} rating`,
    verified: Boolean(shop.isVerified),
    media: "logo",
    weight: 1
  };
}

function gigRecord(gig: RankedItem): HomeRecord {
  return {
    key: `gig-${textValue(gig.slug) || gig.title}`,
    href: "/freelancers",
    title: textValue(gig.title, "Freelancer gig"),
    subtitle: textValue(gig.ownerName ?? gig.packageName, "Gig"),
    meta: `${numberValue(gig.deliveryDays) || 1} day delivery`,
    image: textValue(gig.ownerImage ?? gig.image, brand.logo),
    icon: Sparkles,
    badge: textValue(gig.category, "Gig"),
    verified: Boolean(gig.isVerified),
    media: "logo",
    weight: 1
  };
}

function pickWeighted(records: HomeRecord[], limit: number) {
  return records
    .map((record) => ({ record, rank: Math.pow(Math.random(), 1 / record.weight) }))
    .sort((left, right) => right.rank - left.rank)
    .map(({ record }) => record)
    .slice(0, limit);
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2 className="text-lg font-black text-[hsl(var(--foreground))]">{title}</h2>
      <Link href={href} className="text-sm font-bold text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]">
        View all <ArrowRight className="ml-1 inline size-4 text-[hsl(var(--primary))]" />
      </Link>
    </div>
  );
}

function HomeCard({ record }: { record: HomeRecord }) {
  const Icon = record.icon;

  return (
    <Link href={record.href} className="reference-card group flex h-full flex-col transition-colors hover:bg-[hsl(var(--muted))]/35">
      <div className={`reference-card-media aspect-video ${record.media === "logo" ? "grid place-items-center p-4" : ""}`}>
        {record.image ? (
          <SafeImage
            src={record.image}
            alt={record.title}
            fill
            sizes="(min-width: 1024px) 28vw, 90vw"
            className={record.media === "logo" ? "object-contain p-4" : "object-cover"}
          />
        ) : (
          <Icon className="absolute left-4 top-4 size-10 text-[hsl(var(--primary))]" />
        )}
        <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-[0.68rem] font-black text-white">
          {record.badge || "Featured"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="reference-card-title line-clamp-2 min-h-10">{record.title}</p>
        <p className="mt-2 flex min-w-0 items-center gap-1 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
          <span className="truncate">{record.subtitle}</span>
          {record.verified ? <VerifiedMark label="Verified" className="size-3.5" /> : null}
        </p>
        <p className="mt-2 line-clamp-1 text-xs font-semibold text-[hsl(var(--muted-foreground))]">{record.meta}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-xs">
          {record.price ? (
            <LocalizedPrice value={record.price} className="font-black text-[hsl(var(--foreground))]" />
          ) : (
            <span className={record.badgeClass ? `rounded-md border px-2 py-1 font-bold ${record.badgeClass}` : "font-black text-[hsl(var(--foreground))]"}>
              {record.badge || "Open"}
            </span>
          )}
          <ArrowRight className="size-4 text-[hsl(var(--primary))] transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

function HomeFillCard({ href, title, index }: { href: string; title: string; index: number }) {
  const labels = ["Explore more", "Fresh picks", "Open full list"];

  return (
    <Link href={href} className="reference-card group flex min-h-[13.75rem] flex-col justify-between p-4 transition-colors hover:bg-[hsl(var(--muted))]/35">
      <span className="grid size-10 place-items-center rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
        <Sparkles className="size-5" />
      </span>
      <div>
        <p className="reference-card-title">{labels[index % labels.length]}</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-[hsl(var(--muted-foreground))]">{title}</p>
      </div>
      <span className="inline-flex items-center gap-1 text-sm font-black text-[hsl(var(--primary))]">
        View all
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function SectionGrid({ title, href, records }: { title: string; href: string; records: HomeRecord[] }) {
  if (!records.length) return null;
  const fillerCount = (4 - (records.length % 4)) % 4;

  return (
    <section>
      <SectionTitle title={title} href={href} />
      <div className="home-section-grid">
        {records.map((record) => (
          <HomeCard key={record.key} record={record} />
        ))}
        {Array.from({ length: fillerCount }).map((_, index) => (
          <HomeFillCard key={`${title}-home-fill-${index}`} href={href} title={title} index={index} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [courses, products, freelancers, jobs, shops, gigs] = await Promise.all([
    getCourses({ limit: 120 }),
    getProducts({ limit: 120 }),
    getFreelancers({ limit: 120 }),
    getJobPosts({ limit: 120 }),
    getShopProfiles({ limit: 120 }),
    getGigs({ limit: 120 })
  ]);

  const courseRecords = randomItems(topItems(courses, courseScore), 12).map(courseRecord);
  const productRecords = randomItems(topItems(products, productScore), 12).map(productRecord);
  const freelancerRecords = randomItems(topItems(freelancers, freelancerScore), 12).map(freelancerRecord);
  const jobRecords = randomItems(topItems(jobs, freshFeaturedScore), 12).map(jobRecord);
  const businessRecords = randomItems(topItems(shops, freshFeaturedScore), 12).map(businessRecord);
  const gigRecords = randomItems(topItems(gigs.filter((gig: RankedItem) => gig.status === "published"), freshFeaturedScore), 12).map(gigRecord);
  const popularRecords = pickWeighted(
    [...courseRecords, ...jobRecords, ...freelancerRecords, ...gigRecords, ...businessRecords, ...productRecords],
    12
  );
  const ratingValues = [...courseRecords, ...freelancerRecords, ...productRecords, ...businessRecords]
    .map((item) => Number(String(item.badge ?? "").replace(/[^0-9.]/g, "")))
    .filter((rating) => rating > 0);
  const averageRating = ratingValues.length
    ? ratingValues.reduce((total, rating) => total + rating, 0) / ratingValues.length
    : 0;
  const learnerTotal = courses.reduce((total: number, course: RankedItem) => total + numberValue(course.learners), 0);
  const liveRecordCount = courses.length + products.length + freelancers.length + jobs.length + shops.length + gigs.length;

  return (
    <div className="app-frame space-y-6 py-5">
      <section className="reference-card p-4 md:p-5">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="relative flex size-12 shrink-0 overflow-hidden rounded-md bg-white p-1 shadow-md sm:size-14">
                <Image src={brand.logo} alt={brand.name} fill sizes="56px" className="object-contain p-1" priority />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[hsl(var(--primary))]">Welcome to</p>
                <p className="text-lg font-black uppercase tracking-wide">{brand.name}</p>
              </div>
            </div>
            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">Learn. Work. Sell. Grow.</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[hsl(var(--muted-foreground))]">
              Courses, jobs, freelancers, business listings, gigs, and digital products in one fast MR Creativist marketplace.
            </p>
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

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
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

      <SectionGrid title="Popular Now" href="/courses" records={popularRecords} />
      <SectionGrid title="Featured Courses" href="/courses" records={courseRecords} />
      <SectionGrid title="Top Gigs" href="/freelancers" records={gigRecords} />
      <SectionGrid title="Popular Products" href="/marketplace" records={productRecords} />
      <SectionGrid title="Find Work" href="/jobs" records={jobRecords} />
      <SectionGrid title="Top Freelancers" href="/freelancers" records={freelancerRecords} />
      <SectionGrid title="Businesses" href="/business-directory" records={businessRecords} />
    </div>
  );
}
