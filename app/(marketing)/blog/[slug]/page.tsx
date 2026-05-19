import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { getBlogPostBySlug } from "@/lib/platform-db";

const fallbackContent =
  "This MR Creativist article is prepared for public editorial publishing. Admins can replace it from the blog manager with full news, information, platform updates and creator playbooks.";

function titleFromSlug(slug: string) {
  return slug.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | Date) {
  if (!value) return "Recently";
  return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(value));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  const title = post?.title ?? titleFromSlug(slug);
  const content = String(post?.content ?? fallbackContent);
  const paragraphs = content.split("\n").filter(Boolean);

  return (
    <PageShell
      eyebrow={post?.categoryName ?? "Article"}
      title={title}
      description={post?.excerpt ?? "MR Creativist public blog, news and information article."}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/blog">
            <ArrowLeft className="size-4" />
            Back to blogs
          </Link>
        </Button>
        <Badge>{post?.categoryName ?? "Platform Updates"}</Badge>
        <span className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
          <CalendarDays className="size-4" />
          {formatDate(post?.publishedAt)}
        </span>
        <span className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">
          By {post?.authorName ?? "MR Creativist Editorial"}
        </span>
      </div>

      {post?.image ? (
        <div className="relative mb-6 aspect-[16/7] overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
          <SafeImage src={post.image} alt={title} fill sizes="(min-width: 1280px) 70vw, 100vw" className="object-cover" />
        </div>
      ) : null}

      <article className="prose prose-slate mx-auto max-w-4xl rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-[hsl(var(--foreground))] dark:prose-invert sm:p-8">
        {paragraphs.map((paragraph: string) => (
          <p key={paragraph} className="leading-8">
            {paragraph}
          </p>
        ))}
      </article>
    </PageShell>
  );
}
