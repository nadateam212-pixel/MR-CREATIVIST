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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LocalizedPrice } from "@/components/platform/localized-price";
import { SafeImage } from "@/components/ui/safe-image";
import { VerifiedMark } from "@/components/ui/verified-mark";
import { brand } from "@/lib/brand";
import { getCourses, getFreelancers, getJobPosts, getProducts, getShopProfiles } from "@/lib/platform-db";

function fallbackItems<T>(items: T[], fallback: T[]) {
  return items.length ? items : fallback;
}

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

const fallbackCourses = [
  {
    title: "UI/UX Design Masterclass",
    slug: "ui-ux-design-masterclass",
    category: "Design",
    duration: "12:45:00",
    instructor: "MR Creativist",
    rating: 4.9,
    learners: 12000,
    image: "https://images.unsplash.com/photo-1558655146-364adaf25c9b?auto=format&fit=crop&w=900&q=85"
  },
  {
    title: "Python for Beginners",
    slug: "python-for-beginners",
    category: "Development",
    duration: "08:30:00",
    instructor: "MR Creativist Dev",
    rating: 4.8,
    learners: 8500,
    image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=900&q=85"
  },
  {
    title: "Digital Marketing Masterclass",
    slug: "digital-marketing-masterclass",
    category: "Marketing",
    duration: "09:20:00",
    instructor: "MR Creativist Growth",
    rating: 4.8,
    learners: 7100,
    image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?auto=format&fit=crop&w=900&q=85"
  }
];

const fallbackProducts = [
  {
    name: "AI Prompt Operations Pack",
    slug: "ai-prompt-operations-pack",
    category: "AI Tools",
    type: "Download",
    price: "$49",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=85"
  },
  {
    name: "Creator Brand Kit",
    slug: "creator-brand-kit",
    category: "Templates",
    type: "Digital",
    price: "$65",
    image: "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=800&q=85"
  },
  {
    name: "Studio Microphone",
    slug: "studio-microphone",
    category: "Media",
    type: "Physical",
    price: "$120",
    image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=85"
  },
  {
    name: "Creator Launch Kit",
    slug: "creator-launch-kit",
    category: "Templates",
    type: "Digital",
    price: "$29",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=85"
  },
  {
    name: "Consulting Proposal System",
    slug: "consulting-proposal-system",
    category: "Business",
    type: "Download",
    price: "$39",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=85"
  },
  {
    name: "Course Sales Page Templates",
    slug: "course-sales-page-templates",
    category: "Learning",
    type: "Template",
    price: "$45",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=85"
  },
  {
    name: "Freelancer Client Tracker",
    slug: "freelancer-client-tracker",
    category: "Operations",
    type: "Download",
    price: "$19",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=85"
  },
  {
    name: "Brand Voice AI Pack",
    slug: "brand-voice-ai-pack",
    category: "AI Tools",
    type: "Digital",
    price: "$35",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=85"
  }
];

const fallbackFreelancers = [
  {
    name: "Emmy Pro",
    role: "Video Editor",
    specialty: "Multimedia",
    rating: 5,
    completed: 220,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=85"
  },
  {
    name: "Aline Design",
    role: "UI/UX Designer",
    specialty: "Design",
    rating: 4.9,
    completed: 98,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=85"
  },
  {
    name: "Kevin Dev",
    role: "Web Developer",
    specialty: "Development",
    rating: 4.8,
    completed: 76,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=85"
  }
];

const fallbackJobs = [
  {
    title: "AI Workflow Specialist",
    slug: "ai-workflow-specialist",
    companyName: "MR Creativist Studio",
    location: "Remote"
  },
  {
    title: "Creative Content Producer",
    slug: "creative-content-producer",
    companyName: "MR Creativist Media",
    location: "Kigali"
  },
  {
    title: "Marketplace Operations Assistant",
    slug: "marketplace-operations-assistant",
    companyName: "MR Creativist Commerce",
    location: "Online"
  }
];

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

export default async function HomePage() {
  const [courses, products, freelancers, jobs, shops] = await Promise.all([
    getCourses({ limit: 12 }),
    getProducts({ limit: 12 }),
    getFreelancers({ limit: 12 }),
    getJobPosts({ limit: 8 }),
    getShopProfiles({ limit: 8 })
  ]);
  const courseItems = topItems(fallbackItems(courses, fallbackCourses), courseScore).slice(0, 4);
  const productItems = topItems(fallbackItems(products, fallbackProducts), productScore).slice(0, 8);
  const freelancerItems = topItems(fallbackItems(freelancers, fallbackFreelancers), freelancerScore).slice(0, 6);
  const jobItems = topItems(fallbackItems(jobs, fallbackJobs), freshFeaturedScore).slice(0, 3);
  const shopItems = topItems(shops, freshFeaturedScore).slice(0, 3);
  const ratingValues = [...courseItems, ...freelancerItems, ...productItems, ...shopItems]
    .map((item) => numberValue((item as RankedItem).rating))
    .filter((rating) => rating > 0);
  const averageRating = ratingValues.length
    ? ratingValues.reduce((total, rating) => total + rating, 0) / ratingValues.length
    : 4.9;
  const learnerTotal = courseItems.reduce((total, course) => total + numberValue(course.learners), 0);
  const liveRecordCount = courses.length + products.length + freelancers.length + jobs.length + shops.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
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
            <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl xl:text-5xl">
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
              { value: formatCompact(liveRecordCount || courseItems.length + productItems.length + freelancerItems.length + jobItems.length + shopItems.length), label: "Live public records", icon: BadgeCheck }
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {courseItems.map((course) => (
            <Link key={course.slug} href={`/courses/${course.slug}`}>
              <Card className="overflow-hidden border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]/45">
                <div className="relative aspect-video">
                  <SafeImage src={course.image} alt={course.title} fill sizes="(min-width: 1280px) 25vw, 50vw" className="object-cover" />
                  <span className="absolute bottom-2 right-2 rounded bg-black/85 px-2 py-1 text-xs font-black text-white">
                    {course.duration}
                  </span>
                  <span className="absolute left-3 top-3 rounded-full bg-slate-950/75 p-2 text-white">
                    <PlayCircle className="size-4" />
                  </span>
                </div>
                <CardContent className="p-4">
                  <p className="line-clamp-2 min-h-10 font-bold">{course.title}</p>
                  <p className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                    <span className="truncate">{course.instructor}</span>
                    {"instructorVerified" in course && course.instructorVerified ? <VerifiedMark label="Verified instructor" className="size-3.5" /> : null}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                    <span>{formatCompact(Number(course.learners ?? 0))} students</span>
                    <span><ThumbsUp className="mr-1 inline size-3" />{formatCompact(courseLikes(course))} likes</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <span className="rounded-md border border-[hsl(var(--primary))]/35 px-2 py-1 font-bold text-[hsl(var(--primary))]">{accessLabel(course)}</span>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {freelancerItems.map((freelancer) => (
            <Card key={freelancer.name} className="overflow-hidden border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">
              <div className="relative h-40">
                <SafeImage src={freelancer.image} alt={freelancer.name} fill sizes="220px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="flex items-center gap-1 font-bold text-white">
                    <span className="min-w-0 truncate">{freelancer.name}</span>
                    {"isVerified" in freelancer && freelancer.isVerified ? <VerifiedMark label="Verified freelancer" className="size-4" /> : null}
                  </p>
                  <p className="text-xs text-white/80">{freelancer.role}</p>
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

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div>
          <SectionTitle title="Popular Products" href="/marketplace" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {productItems.map((product) => (
              <Link key={product.slug} href={`/marketplace/product/${product.slug}`}>
                <Card className="overflow-hidden border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">
                  <div className="relative aspect-video">
                    <SafeImage src={product.image} alt={product.name} fill sizes="280px" className="object-cover" />
                  </div>
                  <CardContent className="p-4">
                    <p className="line-clamp-1 font-bold">{product.name}</p>
                    <LocalizedPrice value={product.price} className="mt-1 block text-sm text-[hsl(var(--muted-foreground))]" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle title="Jobs & Businesses" href="/jobs" />
          <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">
            <CardContent className="grid gap-3 p-4">
              {jobItems.length ? jobItems.map((job: { slug: string; title: string; companyName: string; location: string }) => (
                <Link key={job.slug} href="/jobs" className="rounded-md border border-[hsl(var(--border))] p-3 hover:bg-[hsl(var(--muted))]/45">
                  <div className="flex items-center gap-3">
                    <BriefcaseBusiness className="size-5 text-[hsl(var(--primary))]" />
                    <div>
                      <p className="font-semibold">{job.title}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{job.companyName} - {job.location}</p>
                    </div>
                  </div>
                </Link>
              )) : (
                <Link href="/jobs" className="rounded-md border border-[hsl(var(--border))] p-3 hover:bg-[hsl(var(--muted))]/45">
                  <BriefcaseBusiness className="mr-2 inline size-5 text-[hsl(var(--primary))]" />
                  Browse public jobs
                </Link>
              )}
              {shopItems.length ? shopItems.map((shop) => (
                <Link key={String(shop.slug ?? shop.name)} href="/business-directory" className="rounded-md border border-[hsl(var(--border))] p-3 hover:bg-[hsl(var(--muted))]/45">
                  <Building2 className="mr-2 inline size-5 text-[hsl(var(--accent))]" />
                  {shop.name}
                </Link>
              )) : (
                <Link href="/business-directory" className="rounded-md border border-[hsl(var(--border))] p-3 hover:bg-[hsl(var(--muted))]/45">
                  <Building2 className="mr-2 inline size-5 text-[hsl(var(--accent))]" />
                  Publish or discover businesses
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
