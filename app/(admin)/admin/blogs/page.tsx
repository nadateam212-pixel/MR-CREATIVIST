import type { Metadata } from "next";
import { BlogAdminConsole } from "@/components/platform/blog-admin-console";
import { getBlogPosts } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Blogs Admin"
};

export default async function AdminBlogsPage() {
  const posts = await getBlogPosts({ all: true, limit: 36 });

  return (
    <div className="content-frame space-y-8">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Blogs and news</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Publish public blogs, news and information</h1>
        <p className="mt-4 max-w-3xl text-[hsl(var(--muted-foreground))]">
          Only admins can create, edit, publish or remove public editorial content.
        </p>
      </div>
      <BlogAdminConsole initialPosts={posts} />
    </div>
  );
}
