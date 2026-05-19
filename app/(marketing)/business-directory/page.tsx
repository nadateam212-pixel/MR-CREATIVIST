import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { ShopDirectory, type PublicShopProfile } from "@/components/platform/job-shop-workbenches";
import { Button } from "@/components/ui/button";
import { getShopProfiles } from "@/lib/platform-db";

const exampleBusinesses: PublicShopProfile[] = [
  {
    name: "Creator Media Studio",
    slug: "creator-media-studio",
    ownerName: "MR Creativist Team",
    tagline: "Video production, launch assets and creator content systems.",
    description:
      "A Kigali-based creative studio helping instructors, sellers and brands plan, produce and publish high-quality media assets.",
    category: "Multimedia Production",
    logo: "/icons/logo.png",
    coverImage: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=85",
    contactName: "Studio Desk",
    contactEmail: "hello@mrcreativist.com",
    phone: "+250 789 223 887",
    whatsapp: "+250789223887",
    website: "https://mrcreativist.com",
    address: "Kigali Innovation District",
    city: "Kigali",
    country: "Rwanda",
    openingHours: "Monday to Friday, 9:00 - 18:00",
    productsOrServices: [
      {
        name: "Course launch video pack",
        type: "Service",
        description: "Editing, captions, thumbnails and launch shorts.",
        price: 350,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=85"
      }
    ],
    tags: ["video", "courses", "launch"],
    rating: 4.9,
    status: "published",
    isFeatured: true
  },
  {
    name: "AI Growth Lab",
    slug: "ai-growth-lab",
    ownerName: "Aline Strategy",
    tagline: "AI workflow design for small teams and creator businesses.",
    description:
      "Builds prompt systems, automations, dashboards and support playbooks for businesses that need repeatable execution.",
    category: "AI Automation",
    logo: "/icons/logo.png",
    coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=85",
    contactEmail: "hello@mrcreativist.com",
    phone: "+1 (581) 990-1981",
    whatsapp: "+15819901981",
    address: "Remote",
    city: "Online",
    country: "Global",
    openingHours: "Remote support, Monday to Saturday",
    productsOrServices: [
      {
        name: "AI operations setup",
        type: "Service",
        description: "Workflows, SOPs and team training.",
        price: 600,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=85"
      }
    ],
    tags: ["ai", "automation", "operations"],
    rating: 4.8,
    status: "published",
    isFeatured: true
  }
];

export default async function BusinessDirectoryPage() {
  const [session, businesses] = await Promise.all([auth(), getShopProfiles({ limit: 48 })]);
  const businessItems = businesses.length ? businesses : exampleBusinesses;
  const listHref = session?.user ? "/seller/shop" : "/login?callbackUrl=/seller/shop";

  return (
    <div>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[hsl(var(--primary))]">Business Directory</p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-tight sm:text-6xl">
            Discover trusted creative, media, AI and digital businesses.
          </h1>
          <p className="mt-5 text-lg leading-8 text-[hsl(var(--muted-foreground))]">
            MR Creativist connects learners, buyers and companies with verified service providers, studios, consultants
            and sellers ready to support serious growth.
          </p>
          <Button asChild className="mt-8" size="lg">
            <Link href={listHref}>LIST YOUR BUSINESS</Link>
          </Button>
        </div>
        <div className="relative min-h-[22rem] overflow-hidden rounded-lg border border-[hsl(var(--border))]">
          <Image
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=85"
            alt="Business directory team"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        </div>
      </section>

      <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <ShopDirectory shops={businessItems} showHeader={false} />
        </div>
      </section>
    </div>
  );
}
