import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { ShopDirectory, type PublicShopProfile } from "@/components/platform/job-shop-workbenches";
import { Button } from "@/components/ui/button";
import { getShopProfiles } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Business Directory",
  description:
    "Discover MR Creativist businesses in Rwanda, Africa, Canada and globally for AI, multimedia, marketplace, digital products, consulting and creative services."
};

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
    <div className="border-y border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Businesses</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Listed businesses</h1>
          </div>
          <Button asChild>
            <Link href={listHref}>List your business</Link>
          </Button>
        </div>
          <ShopDirectory shops={businessItems} showHeader={false} />
      </section>
    </div>
  );
}
