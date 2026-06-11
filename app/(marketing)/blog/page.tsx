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

function formatDate(value?: string | Date) {
  if (!value) return "Recently";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export default async function BlogPage() {
  const posts = await getBlogPosts({ limit: 24 });
  const postItems: BlogListItem[] = posts;

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
              {post.image ? (
                <div className="relative aspect-video bg-[hsl(var(--muted))]">
                  <SafeImage
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(min-width: 1280px) 33vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="grid aspect-video place-items-center bg-[hsl(var(--muted))]">
                  <Newspaper className="size-10 text-[hsl(var(--primary))]" />
                </div>
              )}
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
                {post.excerpt ?? ""}
              </CardContent>
            </Card>
          </Link>
        ))}
        {postItems.length === 0 ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No blog posts yet.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PageShell>
  );
}
