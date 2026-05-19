import Link from "next/link";
import { CalendarDays, Newspaper } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import { getBlogPosts } from "@/lib/platform-db";

type BlogListItem = {
  title: string;
  slug: string;
  excerpt?: string;
  image?: string;
  publishedAt?: string | Date;
  categoryName?: string;
};

const examplePosts = [
  {
    title: "How AI-powered learning helps creators sell knowledge",
    slug: "ai-learning-creators-sell-knowledge",
    excerpt: "A practical guide to packaging expertise into courses, products and services with AI support.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=85",
    content: "",
    published: true,
    categoryName: "AI Learning",
    publishedAt: new Date().toISOString()
  },
  {
    title: "Building multimedia products for a modern African marketplace",
    slug: "multimedia-products-african-marketplace",
    excerpt: "How creators can turn media skills into digital products, services and repeatable business systems.",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85",
    content: "",
    published: true,
    categoryName: "Marketplace",
    publishedAt: new Date().toISOString()
  },
  {
    title: "What sellers should include in a professional business profile",
    slug: "professional-shop-profile-checklist",
    excerpt: "A clear checklist for business name, contact details, address, offers, trust signals and messaging.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=85",
    content: "",
    published: true,
    categoryName: "Business",
    publishedAt: new Date().toISOString()
  }
];

function formatDate(value?: string | Date) {
  if (!value) return "Recently";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export default async function BlogPage() {
  const posts = await getBlogPosts({ limit: 24 });
  const postItems: BlogListItem[] = posts.length ? posts : examplePosts;

  return (
    <PageShell
      eyebrow="INSIGHTS"
      title="Blogs, news and information"
      description="Practical updates for e-learning, marketplace selling, multimedia production, AI tools, consulting and creator growth."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {postItems.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
            <Card className="h-full overflow-hidden transition-colors hover:bg-[hsl(var(--muted))]/35">
              <div className="relative aspect-video bg-[hsl(var(--muted))]">
                <SafeImage
                  src={post.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85"}
                  alt={post.title}
                  fill
                  sizes="(min-width: 1280px) 33vw, 50vw"
                  className="object-cover"
                />
              </div>
              <CardHeader>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <Badge>{post.categoryName ?? "Platform Updates"}</Badge>
                  <span className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                    <CalendarDays className="size-3" />
                    {formatDate(post.publishedAt)}
                  </span>
                </div>
                <Newspaper className="mb-3 size-6 text-[hsl(var(--primary))]" />
                <CardTitle className="leading-tight group-hover:text-[hsl(var(--primary))]">{post.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                {post.excerpt ?? "Read practical playbooks for learning, selling, AI, media and digital growth."}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
