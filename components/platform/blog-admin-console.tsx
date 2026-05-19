"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ExternalLink, ImageIcon, Loader2, Newspaper, Pencil, Send, Trash2, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";

export type PublicBlogPost = {
  id?: string;
  title: string;
  slug: string;
  excerpt?: string;
  image?: string;
  content?: string;
  published?: boolean;
  publishedAt?: string | Date;
  categoryName?: string;
  categorySlug?: string;
  authorName?: string;
};

const emptyPostForm = {
  title: "How creators can use AI to sell digital products",
  excerpt: "A practical MR Creativist guide for turning ideas, skills and AI workflows into sellable digital assets.",
  image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=85",
  categoryName: "Platform Updates",
  content:
    "Creators win when they package knowledge clearly. Start with one customer problem, build a useful resource, add examples, and publish it with a strong shop or marketplace listing.\n\nUse MrCreativist.AI to draft outlines, product descriptions, course lessons and buyer messages, then edit the result with your own voice.",
  published: true
};

export function BlogAdminConsole({ initialPosts = [] }: { initialPosts?: PublicBlogPost[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [form, setForm] = useState(emptyPostForm);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  function update(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(post: PublicBlogPost) {
    setEditingPostId(String(post.id ?? post.slug));
    setForm({
      title: post.title,
      excerpt: post.excerpt ?? "",
      image: post.image ?? "",
      categoryName: post.categoryName ?? "Platform Updates",
      content: post.content ?? "",
      published: Boolean(post.published)
    });
    setMessage(`Editing ${post.title}.`);
  }

  async function uploadImage(file: File | null) {
    if (!file) return;

    setUploadingImage(true);
    setMessage("Uploading blog image...");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("kind", "image");
      formData.set("ownerType", "general");
      formData.set("metadata", JSON.stringify({ module: "blog" }));

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Image upload failed.");

      const nextImage = payload.asset?.secureUrl ?? payload.asset?.url;
      if (!nextImage) throw new Error("Image upload did not return a usable URL.");

      update("image", nextImage);
      setMessage("Image attached to blog post.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  }

  function resetForm() {
    setEditingPostId(null);
    setForm(emptyPostForm);
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(editingPostId ? "Saving blog post..." : "Publishing blog post...");

    try {
      const response = await fetch(editingPostId ? `/api/posts/${editingPostId}` : "/api/posts", {
        method: editingPostId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Blog post save failed.");

      setPosts((current) =>
        editingPostId
          ? current.map((post) => (String(post.id ?? post.slug) === editingPostId ? payload : post))
          : [payload, ...current]
      );
      setEditingPostId(null);
      setMessage(editingPostId ? "Blog post updated." : "Blog post published to the public blog.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Blog post save failed.");
    }
  }

  async function deletePost(post: PublicBlogPost) {
    const recordId = String(post.id ?? post.slug);
    if (!window.confirm(`Delete ${post.title} from the public blog?`)) return;

    setMessage("Deleting blog post...");

    try {
      const response = await fetch(`/api/posts/${recordId}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Blog post delete failed.");

      setPosts((current) => current.filter((item) => String(item.id ?? item.slug) !== recordId));
      if (editingPostId === recordId) resetForm();
      setMessage("Blog post removed from the public blog.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Blog post delete failed.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="size-5 text-[hsl(var(--primary))]" />
            {editingPostId ? "Edit blog post" : "Create blog post"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submit}>
            <Input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Post title" />
            <Input value={form.categoryName} onChange={(event) => update("categoryName", event.target.value)} placeholder="Category" />
            <div className="grid gap-2">
              <Input value={form.image} onChange={(event) => update("image", event.target.value)} placeholder="Cover image URL" />
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[hsl(var(--border))] p-3 text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/40">
                {uploadingImage ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {uploadingImage ? "Uploading image..." : "Upload cover image"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingImage}
                  className="sr-only"
                  onChange={(event) => void uploadImage(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <textarea
              value={form.excerpt}
              onChange={(event) => update("excerpt", event.target.value)}
              className="min-h-20 rounded-md border border-[hsl(var(--border))] bg-transparent p-3"
              placeholder="Short excerpt"
            />
            <textarea
              value={form.content}
              onChange={(event) => update("content", event.target.value)}
              className="min-h-72 rounded-md border border-[hsl(var(--border))] bg-transparent p-3"
              placeholder="Blog, news or information content"
            />
            <label className="flex items-center gap-3 rounded-md border border-[hsl(var(--border))] p-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) => update("published", event.target.checked)}
                className="size-4"
              />
              Publish on public blog
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">
                <Send className="size-4" />
                {editingPostId ? "Save blog" : "Publish blog"}
              </Button>
              {editingPostId ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="size-4" />
                  Cancel edit
                </Button>
              ) : null}
            </div>
            {message ? <p className="text-sm text-[hsl(var(--muted-foreground))]">{message}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blog records</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {posts.map((post) => (
            <div key={post.slug} className="rounded-md border border-[hsl(var(--border))] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[hsl(var(--muted))]">
                    {post.image ? (
                      <SafeImage src={post.image} alt="" fill sizes="56px" className="object-cover" />
                    ) : (
                      <ImageIcon className="size-5 text-[hsl(var(--muted-foreground))]" />
                    )}
                  </div>
                  <div className="min-w-0">
                  <p className="font-semibold">{post.title}</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    {post.categoryName ?? "Platform Updates"} - {post.published ? "Published" : "Draft"}
                  </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={post.published ? "border-[hsl(var(--primary))]/35 text-[hsl(var(--primary))]" : ""}>
                    {post.published ? "published" : "draft"}
                  </Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/blog/${post.slug}`} target="_blank">
                      <ExternalLink className="size-4" />
                      View
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => startEdit(post)}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void deletePost(post)}>
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {posts.length === 0 ? (
            <div className="rounded-md border border-dashed border-[hsl(var(--border))] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No blog posts yet. Create the first public blog, news or information post.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
