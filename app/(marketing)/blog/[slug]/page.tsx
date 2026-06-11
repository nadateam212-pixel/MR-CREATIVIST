import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { getBlogPostBySlug } from "@/lib/platform-db";

function formatDate(value?: string | Date) {
  if (!value) return "Recently";
  return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(value));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const title = post.title;
  const content = String(post?.content ?? "");
  const paragraphs = content.split("\n").filter(Boolean);

  return (
    <PageShell
      eyebrow={post?.categoryName ?? "Article"}
      title={title}
      description={post?.excerpt ?? ""}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/blog">
            <ArrowLeft className="size-4" />
            Back to blogs
          </Link>
        </Button>
        {post?.categoryName ? <Badge>{post.categoryName}</Badge> : null}
        {post?.publishedAt ? (
          <span className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <CalendarDays className="size-4" />
            {formatDate(post.publishedAt)}
          </span>
        ) : null}
        {post?.authorName ? (
          <span className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">
            By {post.authorName}
          </span>
        ) : null}
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
        {paragraphs.length === 0 ? (
          <p className="leading-8 text-[hsl(var(--muted-foreground))]">No article content yet.</p>
        ) : null}
      </article>
    </PageShell>
  );
}
