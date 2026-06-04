"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  FileArchive,
  Image as ImageIcon,
  LayoutList,
  Link2,
  ListChecks,
  PlayCircle,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  Video
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { googleDriveFileIdFromUrl, normalizedExternalVideoUrl } from "@/lib/video-sources";
import { cn } from "@/lib/utils";

const defaultThumbnail =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85";

const steps = [
  { title: "Basic Information", icon: BookOpen },
  { title: "Curriculum", icon: LayoutList },
  { title: "Preview Settings", icon: PlayCircle },
  { title: "Pricing", icon: CircleDollarSign },
  { title: "Resources", icon: FileArchive },
  { title: "Review", icon: ListChecks }
];

type LessonDraft = {
  title: string;
  description: string;
  videoUrl: string;
  durationMinutes: string;
  freePreview: boolean;
  previewStartSeconds: string;
  previewEndSeconds: string;
};

type SectionDraft = {
  title: string;
  description: string;
  lessons: LessonDraft[];
};

type ResourceDraft = {
  title: string;
  type: string;
  url: string;
  accessRule: "enrolled" | "free";
  attachLevel: "course" | "lesson";
  downloadable: boolean;
};

function minutesToDuration(minutes: number) {
  if (minutes <= 0) return "Self-paced";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return hours ? `${hours}h ${rest ? `${rest}m` : ""}`.trim() : `${minutes}m`;
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function isDriveLink(value: string) {
  return Boolean(googleDriveFileIdFromUrl(value));
}

function firstLesson(sections: SectionDraft[]) {
  return sections.flatMap((section) => section.lessons)[0];
}

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Image could not be read."));
    reader.readAsDataURL(file);
  });
}

function savedLessonCount(payload: { lessons?: unknown; lessonsCount?: unknown; modules?: Array<{ lessons?: unknown[] }> }) {
  const moduleLessons = Array.isArray(payload.modules)
    ? payload.modules.reduce((total, module) => total + (Array.isArray(module.lessons) ? module.lessons.length : 0), 0)
    : 0;
  const reportedLessons = Number(payload.lessons ?? payload.lessonsCount ?? 0);

  return Math.max(moduleLessons, Number.isFinite(reportedLessons) ? reportedLessons : 0);
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="text-xs font-black uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
      {children}
      {required ? <span className="text-[hsl(var(--primary))]"> *</span> : null}
    </span>
  );
}

function StudioPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm sm:p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

function CheckRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <CheckCircle2 className={cn("size-4", ok ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]")} />
      <span className={ok ? "font-semibold" : "text-[hsl(var(--muted-foreground))]"}>{label}</span>
    </div>
  );
}

export function EasyCoursePublisher({ instructorName = "MR Creativist Instructor" }: { instructorName?: string }) {
  const [step, setStep] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [courseId, setCourseId] = useState("");
  const [publicSlug, setPublicSlug] = useState("");
  const [basic, setBasic] = useState({
    title: "",
    shortDescription: "",
    description: "",
    category: "AI and Education",
    subcategory: "",
    level: "Beginner",
    language: "English",
    thumbnail: defaultThumbnail,
    instructor: instructorName,
    outcomes: "",
    audience: "",
    tags: ""
  });
  const [sections, setSections] = useState<SectionDraft[]>([
    {
      title: "Getting Started",
      description: "",
      lessons: [
        {
          title: "Introduction",
          description: "",
          videoUrl: "",
          durationMinutes: "10",
          freePreview: true,
          previewStartSeconds: "0",
          previewEndSeconds: "90"
        }
      ]
    }
  ]);
  const [preview, setPreview] = useState({
    type: "smart",
    duration: "90",
    applyTo: "first",
    paywallMessage: "This is a preview. Enroll now to continue watching the full lesson.",
    customPreviewUrl: ""
  });
  const [pricing, setPricing] = useState({
    type: "paid",
    price: "49",
    compareAtPrice: "",
    currency: "USD"
  });
  const [resourcesEnabled, setResourcesEnabled] = useState(false);
  const [resources, setResources] = useState<ResourceDraft[]>([]);

  const allLessons = sections.flatMap((section) => section.lessons);
  const totalMinutes = allLessons.reduce((total, lesson) => total + (Number(lesson.durationMinutes) || 0), 0);
  const previewLesson = allLessons.find((lesson) => lesson.videoUrl.trim()) ?? firstLesson(sections);
  const previewSource = normalizedExternalVideoUrl(preview.customPreviewUrl || previewLesson?.videoUrl || "");
  const driveLessonCount = allLessons.filter((lesson) => isDriveLink(lesson.videoUrl)).length;

  const checks = useMemo(() => {
    const basicComplete =
      basic.title.trim().length >= 2 &&
      Boolean(basic.category && basic.level && basic.language);
    const curriculumComplete =
      sections.length > 0 &&
      allLessons.length > 0 &&
      allLessons.some((lesson) => lesson.title.trim().length >= 2);
    const previewComplete =
      preview.type === "none" ||
      (preview.type === "custom" && (!preview.customPreviewUrl.trim() || isDriveLink(preview.customPreviewUrl))) ||
      preview.type === "smart";
    const pricingComplete = true;
    const resourcesComplete = true;

    return {
      basicComplete,
      curriculumComplete,
      previewComplete,
      pricingComplete,
      resourcesComplete,
      reviewReady: basicComplete && curriculumComplete && previewComplete && pricingComplete && resourcesComplete
    };
  }, [allLessons, basic, preview, sections]);

  function updateBasic(field: keyof typeof basic, value: string) {
    setBasic((current) => ({ ...current, [field]: value }));
    setSaveState("idle");
  }

  async function uploadThumbnail(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSaveState("error");
      setMessage("Choose an image file for the course thumbnail.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveState("error");
      setMessage("Thumbnail image must be 5 MB or smaller.");
      return;
    }

    try {
      const data = new FormData();
      data.set("file", file);
      data.set("kind", "image");
      data.set("ownerType", "course");
      data.set("metadata", JSON.stringify({ module: "course-thumbnail" }));

      const response = await fetch("/api/upload", { method: "POST", body: data });
      const payload = await response.json();
      const hostedImage = payload.asset?.secureUrl ?? payload.asset?.url;

      if (!response.ok || !hostedImage) {
        throw new Error(payload.error ?? "Thumbnail upload failed.");
      }

      updateBasic("thumbnail", hostedImage);
      setMessage("Thumbnail uploaded and preview updated.");
    } catch {
      try {
        const image = await readImageAsDataUrl(file);
        updateBasic("thumbnail", image);
        setMessage("Thumbnail uploaded and preview updated.");
      } catch (error) {
        setSaveState("error");
        setMessage(error instanceof Error ? error.message : "Thumbnail could not be uploaded.");
      }
    }
  }

  function updateSection(sectionIndex: number, patch: Partial<SectionDraft>) {
    setSections((current) => current.map((section, index) => (index === sectionIndex ? { ...section, ...patch } : section)));
    setSaveState("idle");
  }

  function updateLesson(sectionIndex: number, lessonIndex: number, patch: Partial<LessonDraft>) {
    setSections((current) =>
      current.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              lessons: section.lessons.map((lesson, innerIndex) =>
                innerIndex === lessonIndex ? { ...lesson, ...patch } : lesson
              )
            }
          : section
      )
    );
    setSaveState("idle");
  }

  function addSection() {
    setSections((current) => [
      ...current,
      {
        title: `Section ${current.length + 1}`,
        description: "",
        lessons: []
      }
    ]);
  }

  function addLesson(sectionIndex: number) {
    updateSection(sectionIndex, {
      lessons: [
        ...sections[sectionIndex].lessons,
        {
          title: "New lesson",
          description: "",
          videoUrl: "",
          durationMinutes: "10",
          freePreview: false,
          previewStartSeconds: "0",
          previewEndSeconds: preview.duration
        }
      ]
    });
  }

  function removeLesson(sectionIndex: number, lessonIndex: number) {
    setSections((current) =>
      current.map((section, index) =>
        index === sectionIndex
          ? { ...section, lessons: section.lessons.filter((_, innerIndex) => innerIndex !== lessonIndex) }
          : section
      )
    );
  }

  function addResource() {
    setResourcesEnabled(true);
    setResources((current) => [
      ...current,
      {
        title: "Course resource",
        type: "PDF",
        url: "",
        accessRule: "enrolled",
        attachLevel: "course",
        downloadable: true
      }
    ]);
  }

  function buildPayload(status: "draft" | "submitted" | "published" | "unlisted") {
    const title = basic.title.trim() || "Untitled course";
    const shortDescription =
      basic.shortDescription.trim() || `${title} gives learners a clear, practical path to complete the topic.`;
    const description =
      basic.description.trim() ||
      `${title} is a practical MR Creativist course with guided lessons, resources, and a simple completion path for learners.`;
    const mappedSections = sections.map((section) => ({
      title: section.title.trim() || "Untitled section",
      description: section.description,
      status: "ready",
      lessons: section.lessons.map((lesson) => {
        const normalized = normalizedExternalVideoUrl(lesson.videoUrl);
        const videoUrl = lesson.videoUrl.trim();

        return {
          title: lesson.title.trim() || "Untitled lesson",
          type: videoUrl ? "video" : "article",
          sourceType: videoUrl ? "google-drive" : "text",
          durationMinutes: Number(lesson.durationMinutes) || 0,
          durationSeconds: (Number(lesson.durationMinutes) || 0) * 60,
          summary: lesson.description,
          videoUrl: videoUrl || undefined,
          videoProvider: videoUrl ? normalized.provider : undefined,
          freePreview: lesson.freePreview,
          isPreview: lesson.freePreview,
          previewStartSeconds: Number(lesson.previewStartSeconds) || 0,
          previewEndSeconds: Number(lesson.previewEndSeconds) || Number(preview.duration) || 90,
          resources: []
        };
      })
    }));

    return {
      title,
      shortDescription,
      description,
      instructorName: basic.instructor.trim() || instructorName,
      category: basic.category,
      subcategory: basic.subcategory,
      level: basic.level,
      language: basic.language,
      price: pricing.type === "free" ? 0 : Number(pricing.price) || 0,
      compareAtPrice: Number(pricing.compareAtPrice) || undefined,
      currency: pricing.currency,
      image: basic.thumbnail || defaultThumbnail,
      trailerUrl: preview.type === "custom" ? preview.customPreviewUrl : undefined,
      duration: minutesToDuration(totalMinutes),
      lessonsCount: allLessons.length,
      outcomes: basic.outcomes
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
        .concat(basic.outcomes.trim() ? [] : [`Complete ${title}`, "Use the course resources", "Earn a completion certificate"]),
      tools: ["Google Drive video", "Smart preview", "Resources", "Certificate"],
      tags: splitTags(basic.tags).length ? splitTags(basic.tags) : [basic.category, basic.level],
      modules: mappedSections,
      previewType: preview.type,
      defaultPreviewDuration: Number(preview.duration) || 90,
      previewApplyTo: preview.applyTo,
      paywallMessage: preview.paywallMessage.trim() || "Enroll to continue watching the full course.",
      pricingType: pricing.type,
      targetAudience: basic.audience,
      resources: resourcesEnabled
        ? resources.filter((resource) => resource.url.trim()).map((resource) => ({
            ...resource,
            label: resource.title,
            downloadable: resource.downloadable
          }))
        : [],
      status,
      isFeatured: false
    };
  }

  async function saveCourse(status: "draft" | "submitted" | "published" | "unlisted") {
    setSaveState("saving");
    setMessage("");

    try {
      const payloadToSave = buildPayload(status);
      const response = await fetch(courseId ? `/api/courses/${courseId}` : "/api/courses", {
        method: courseId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadToSave)
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Course could not be saved.");
      }
      const expectedLessons = Number(payloadToSave.lessonsCount ?? 0);
      const persistedLessons = savedLessonCount(payload);

      if (persistedLessons < expectedLessons) {
        throw new Error(`Publish validation failed: MongoDB saved ${persistedLessons} of ${expectedLessons} lessons. Please try again before leaving this page.`);
      }

      setCourseId(String(payload.id ?? payload._id ?? courseId));
      setPublicSlug(String(payload.slug ?? publicSlug));
      setSaveState("saved");
      setMessage(
        status === "published"
          ? "Course published to the public catalog."
          : status === "submitted"
            ? "Course submitted for admin review."
            : "Draft saved."
      );
    } catch (error) {
      setSaveState("error");
      setMessage(error instanceof Error ? error.message : "Course could not be saved.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-[hsl(var(--primary))]/35 text-[hsl(var(--primary))]">MrC. Studio</Badge>
            <Badge>{saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Draft"}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Create course</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {publicSlug ? (
            <Button asChild variant="outline">
              <Link href={`/courses/${publicSlug}`}>View course</Link>
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => void saveCourse("draft")}>
            <Save className="size-4" />
            Save Draft
          </Button>
          <Button type="button" disabled={!checks.reviewReady} onClick={() => void saveCourse("submitted")}>
            <Send className="size-4" />
            Submit Review
          </Button>
          <Button type="button" disabled={!checks.reviewReady} onClick={() => void saveCourse("published")}>
            <Sparkles className="size-4" />
            Publish
          </Button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-6">
        {steps.map((item, index) => {
          const Icon = item.icon;
          const done = index < step || [checks.basicComplete, checks.curriculumComplete, checks.previewComplete, checks.pricingComplete, checks.resourcesComplete, checks.reviewReady][index];

          return (
            <button
              key={item.title}
              type="button"
              onClick={() => setStep(index)}
              className={cn(
                "flex min-h-14 items-center gap-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 text-left text-sm font-bold transition-colors",
                step === index && "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
              )}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[hsl(var(--muted))]">
                {done ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
              </span>
              <span className="leading-tight">{item.title}</span>
            </button>
          );
        })}
      </div>

      {message ? (
        <div
          className={cn(
            "rounded-md border p-3 text-sm font-semibold",
            saveState === "error"
              ? "border-[hsl(var(--destructive))]/35 text-[hsl(var(--destructive))]"
              : "border-[hsl(var(--primary))]/35 text-[hsl(var(--primary))]"
          )}
        >
          {message}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-5">
          {step === 0 ? (
            <StudioPanel>
              <div className="mb-5 flex items-center gap-3">
                <BookOpen className="size-5 text-[hsl(var(--primary))]" />
                <h2 className="text-xl font-black">Basic Information</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 md:col-span-2">
                  <FieldLabel required>Course title</FieldLabel>
                  <Input value={basic.title} onChange={(event) => updateBasic("title", event.target.value)} maxLength={100} placeholder="Video Editing with Premiere Pro" />
                </label>
                <label className="grid gap-2 md:col-span-2">
                  <FieldLabel>Short description</FieldLabel>
                  <Input value={basic.shortDescription} onChange={(event) => updateBasic("shortDescription", event.target.value)} maxLength={180} placeholder="A clear one-line promise for the course card" />
                </label>
                <label className="grid gap-2 md:col-span-2">
                  <FieldLabel>Full description</FieldLabel>
                  <textarea
                    value={basic.description}
                    onChange={(event) => updateBasic("description", event.target.value)}
                    className="min-h-32 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                    placeholder="What students will learn, who it is for, and the outcome."
                  />
                </label>
                <label className="grid gap-2">
                  <FieldLabel required>Category</FieldLabel>
                  <select value={basic.category} onChange={(event) => updateBasic("category", event.target.value)} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                    {["AI and Education", "Coding", "Video Editing", "Marketing", "Business", "Design", "Freelancing"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <FieldLabel>Subcategory</FieldLabel>
                  <Input value={basic.subcategory} onChange={(event) => updateBasic("subcategory", event.target.value)} placeholder="Premiere Pro, APIs, Branding..." />
                </label>
                <label className="grid gap-2">
                  <FieldLabel required>Level</FieldLabel>
                  <select value={basic.level} onChange={(event) => updateBasic("level", event.target.value)} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                    {["Beginner", "Intermediate", "Advanced", "All levels", "Expert"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <FieldLabel required>Language</FieldLabel>
                  <select value={basic.language} onChange={(event) => updateBasic("language", event.target.value)} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                    {["English", "Kinyarwanda", "French", "Other"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-2 md:col-span-2">
                  <FieldLabel>Thumbnail</FieldLabel>
                  <div className="grid gap-3 rounded-md border border-[hsl(var(--border))] p-3 sm:grid-cols-[12rem_1fr] sm:items-center">
                    <div className="overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                      <img src={basic.thumbnail || defaultThumbnail} alt="" className="aspect-video w-full object-cover" />
                    </div>
                    <div className="grid gap-2">
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">Upload a course cover. Only the preview is shown.</p>
                      <Button asChild variant="outline" className="shrink-0 cursor-pointer">
                        <label>
                          <ImageIcon className="size-4" />
                          Upload image
                          <input type="file" accept="image/*" className="sr-only" onChange={uploadThumbnail} />
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>
                <label className="grid gap-2">
                  <FieldLabel>Students will learn</FieldLabel>
                  <textarea value={basic.outcomes} onChange={(event) => updateBasic("outcomes", event.target.value)} className="min-h-28 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" placeholder="One outcome per line" />
                </label>
                <label className="grid gap-2">
                  <FieldLabel>Target audience</FieldLabel>
                  <textarea value={basic.audience} onChange={(event) => updateBasic("audience", event.target.value)} className="min-h-28 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" placeholder="Who should take this course?" />
                </label>
                <label className="grid gap-2 md:col-span-2">
                  <FieldLabel>Tags</FieldLabel>
                  <Input value={basic.tags} onChange={(event) => updateBasic("tags", event.target.value)} placeholder="AI, video, business, creator" />
                </label>
              </div>
            </StudioPanel>
          ) : null}

          {step === 1 ? (
            <StudioPanel>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <LayoutList className="size-5 text-[hsl(var(--primary))]" />
                  <h2 className="text-xl font-black">Curriculum</h2>
                </div>
                <Button type="button" onClick={addSection}>
                  <Plus className="size-4" />
                  Add Section
                </Button>
              </div>
              <div className="space-y-4">
                {sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="rounded-md border border-[hsl(var(--border))] p-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                      <label className="grid gap-2">
                        <FieldLabel required>Section title</FieldLabel>
                        <Input value={section.title} onChange={(event) => updateSection(sectionIndex, { title: event.target.value })} />
                      </label>
                      <label className="grid gap-2">
                        <FieldLabel>Section description</FieldLabel>
                        <Input value={section.description} onChange={(event) => updateSection(sectionIndex, { description: event.target.value })} />
                      </label>
                      <div className="flex items-end">
                        <Button type="button" variant="outline" onClick={() => addLesson(sectionIndex)}>
                          <Plus className="size-4" />
                          Lesson
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {section.lessons.map((lesson, lessonIndex) => (
                        <div key={lessonIndex} className="grid gap-3 rounded-md bg-[hsl(var(--muted))]/45 p-3 lg:grid-cols-[1.1fr_1.35fr_7rem_8rem_auto]">
                          <label className="grid gap-2">
                            <FieldLabel required>Lesson title</FieldLabel>
                            <Input value={lesson.title} onChange={(event) => updateLesson(sectionIndex, lessonIndex, { title: event.target.value })} />
                          </label>
                          <label className="grid gap-2">
                            <FieldLabel required>Google Drive video link</FieldLabel>
                            <Input value={lesson.videoUrl} onChange={(event) => updateLesson(sectionIndex, lessonIndex, { videoUrl: event.target.value })} placeholder="https://drive.google.com/file/d/..." />
                            {lesson.videoUrl && !isDriveLink(lesson.videoUrl) ? (
                              <span className="text-xs font-semibold text-amber-500">Paste a Google Drive file link for video lessons.</span>
                            ) : null}
                          </label>
                          <label className="grid gap-2">
                            <FieldLabel required>Minutes</FieldLabel>
                            <Input value={lesson.durationMinutes} onChange={(event) => updateLesson(sectionIndex, lessonIndex, { durationMinutes: event.target.value })} inputMode="numeric" />
                          </label>
                          <label className="flex items-center gap-2 pt-6 text-sm font-semibold">
                            <input type="checkbox" checked={lesson.freePreview} onChange={(event) => updateLesson(sectionIndex, lessonIndex, { freePreview: event.target.checked })} />
                            Preview
                          </label>
                          <div className="flex items-end">
                            <Button type="button" variant="outline" size="icon" aria-label="Remove lesson" onClick={() => removeLesson(sectionIndex, lessonIndex)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </StudioPanel>
          ) : null}

          {step === 2 ? (
            <StudioPanel>
              <div className="mb-5 flex items-center gap-3">
                <PlayCircle className="size-5 text-[hsl(var(--primary))]" />
                <h2 className="text-xl font-black">Preview Settings</h2>
              </div>
              <div className="grid gap-4">
                {[
                  ["smart", "Smart Lesson Preview", "Recommended. Student watches part of a real lesson before the paywall."],
                  ["custom", "Custom Preview Video", "Use a trailer or overview video from Google Drive."],
                  ["none", "No Preview", "Course details only until enrollment."]
                ].map(([value, label, body]) => (
                  <label key={value} className={cn("flex cursor-pointer items-start gap-3 rounded-md border border-[hsl(var(--border))] p-4", preview.type === value && "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10")}>
                    <input type="radio" name="previewType" checked={preview.type === value} onChange={() => setPreview((current) => ({ ...current, type: value }))} />
                    <span>
                      <span className="block font-black">{label}</span>
                      <span className="mt-1 block text-sm text-[hsl(var(--muted-foreground))]">{body}</span>
                    </span>
                  </label>
                ))}
                {preview.type === "custom" ? (
                  <label className="grid gap-2">
                    <FieldLabel required>Custom Google Drive preview link</FieldLabel>
                    <Input value={preview.customPreviewUrl} onChange={(event) => setPreview((current) => ({ ...current, customPreviewUrl: event.target.value }))} placeholder="https://drive.google.com/file/d/..." />
                  </label>
                ) : null}
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="grid gap-2">
                    <FieldLabel>Default duration</FieldLabel>
                    <select value={preview.duration} onChange={(event) => setPreview((current) => ({ ...current, duration: event.target.value }))} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                      {[
                        ["30", "30 seconds"],
                        ["60", "60 seconds"],
                        ["90", "90 seconds"],
                        ["120", "2 minutes"],
                        ["300", "5 minutes"]
                      ].map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 md:col-span-2">
                    <FieldLabel>Apply preview to</FieldLabel>
                    <select value={preview.applyTo} onChange={(event) => setPreview((current) => ({ ...current, applyTo: event.target.value }))} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                      <option value="first">First lesson only</option>
                      <option value="selected">Selected preview lessons</option>
                      <option value="all">All lessons</option>
                    </select>
                  </label>
                </div>
                <label className="grid gap-2">
                  <FieldLabel>Paywall message</FieldLabel>
                  <Input value={preview.paywallMessage} onChange={(event) => setPreview((current) => ({ ...current, paywallMessage: event.target.value }))} />
                </label>
              </div>
            </StudioPanel>
          ) : null}

          {step === 3 ? (
            <StudioPanel>
              <div className="mb-5 flex items-center gap-3">
                <CircleDollarSign className="size-5 text-[hsl(var(--primary))]" />
                <h2 className="text-xl font-black">Pricing</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["paid", "Paid", "One-time payment"],
                  ["free", "Free", "Enroll without payment"],
                  ["subscription", "Subscription", "Active plan required"]
                ].map(([value, label, body]) => (
                  <label key={value} className={cn("cursor-pointer rounded-md border border-[hsl(var(--border))] p-4", pricing.type === value && "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10")}>
                    <input className="mr-2" type="radio" name="pricingType" checked={pricing.type === value} onChange={() => setPricing((current) => ({ ...current, type: value }))} />
                    <span className="font-black">{label}</span>
                    <span className="mt-2 block text-sm text-[hsl(var(--muted-foreground))]">{body}</span>
                  </label>
                ))}
                <label className="grid gap-2">
                  <FieldLabel>Price</FieldLabel>
                  <Input value={pricing.price} disabled={pricing.type === "free"} onChange={(event) => setPricing((current) => ({ ...current, price: event.target.value }))} inputMode="decimal" />
                </label>
                <label className="grid gap-2">
                  <FieldLabel>Compare price</FieldLabel>
                  <Input value={pricing.compareAtPrice} disabled={pricing.type === "free"} onChange={(event) => setPricing((current) => ({ ...current, compareAtPrice: event.target.value }))} inputMode="decimal" />
                </label>
                <label className="grid gap-2">
                  <FieldLabel>Currency</FieldLabel>
                  <select value={pricing.currency} onChange={(event) => setPricing((current) => ({ ...current, currency: event.target.value }))} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                    <option>USD</option>
                    <option>FRW</option>
                  </select>
                </label>
              </div>
            </StudioPanel>
          ) : null}

          {step === 4 ? (
            <StudioPanel>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FileArchive className="size-5 text-[hsl(var(--primary))]" />
                  <h2 className="text-xl font-black">Resources</h2>
                </div>
                <Button type="button" onClick={addResource}>
                  <Plus className="size-4" />
                  Add Resource
                </Button>
              </div>
              <label className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={resourcesEnabled} onChange={(event) => setResourcesEnabled(event.target.checked)} />
                Enable downloadable course resources
              </label>
              {resourcesEnabled ? (
                <div className="space-y-3">
                  {resources.map((resource, index) => (
                    <div key={index} className="grid gap-3 rounded-md border border-[hsl(var(--border))] p-3 lg:grid-cols-[1fr_8rem_1fr_9rem_9rem_10rem_auto]">
                      <Input value={resource.title} onChange={(event) => setResources((current) => current.map((item, innerIndex) => (innerIndex === index ? { ...item, title: event.target.value } : item)))} placeholder="Resource title" />
                      <select value={resource.type} onChange={(event) => setResources((current) => current.map((item, innerIndex) => (innerIndex === index ? { ...item, type: event.target.value } : item)))} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                        {["PDF", "ZIP", "RAR", "Template", "Project File", "Other"].map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                      <Input value={resource.url} onChange={(event) => setResources((current) => current.map((item, innerIndex) => (innerIndex === index ? { ...item, url: event.target.value } : item)))} placeholder="Resource link" />
                      <select value={resource.accessRule} onChange={(event) => setResources((current) => current.map((item, innerIndex) => (innerIndex === index ? { ...item, accessRule: event.target.value as ResourceDraft["accessRule"] } : item)))} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                        <option value="enrolled">Enrolled</option>
                        <option value="free">Free</option>
                      </select>
                      <select value={resource.attachLevel} onChange={(event) => setResources((current) => current.map((item, innerIndex) => (innerIndex === index ? { ...item, attachLevel: event.target.value as ResourceDraft["attachLevel"] } : item)))} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                        <option value="course">Course</option>
                        <option value="lesson">Lesson</option>
                      </select>
                      <label className="flex h-10 items-center gap-2 rounded-md border border-[hsl(var(--border))] px-3 text-sm font-semibold">
                        <input type="checkbox" checked={resource.downloadable} onChange={(event) => setResources((current) => current.map((item, innerIndex) => (innerIndex === index ? { ...item, downloadable: event.target.checked } : item)))} />
                        Download
                      </label>
                      <Button type="button" variant="outline" size="icon" onClick={() => setResources((current) => current.filter((_, innerIndex) => innerIndex !== index))} aria-label="Remove resource">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-[hsl(var(--border))] p-6 text-sm text-[hsl(var(--muted-foreground))]">
                  Resources are optional. Continue to review when the course has no files.
                </div>
              )}
            </StudioPanel>
          ) : null}

          {step === 5 ? (
            <StudioPanel>
              <div className="mb-5 flex items-center gap-3">
                <ListChecks className="size-5 text-[hsl(var(--primary))]" />
                <h2 className="text-xl font-black">Review</h2>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-3">
                  <CheckRow label="Course title ready" ok={checks.basicComplete} />
                  <CheckRow label="At least one lesson title" ok={checks.curriculumComplete} />
                  <CheckRow label="Preview configured" ok={checks.previewComplete} />
                  <CheckRow label="Pricing configured" ok={checks.pricingComplete} />
                  <CheckRow label="Resources checked" ok={checks.resourcesComplete} />
                </div>
                <div className="rounded-md border border-[hsl(var(--border))] p-4">
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-[hsl(var(--primary))]">Course summary</p>
                  <h3 className="mt-3 text-xl font-black">{basic.title || "Untitled course"}</h3>
                  <div className="mt-4 grid gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                    <span>{sections.length} sections</span>
                    <span>{allLessons.length} lessons</span>
                    <span>{driveLessonCount} Google Drive video links</span>
                    <span>{minutesToDuration(totalMinutes)} total duration</span>
                    <span>{pricing.type === "free" ? "Free" : `${pricing.currency} ${pricing.price || 0}`}</span>
                  </div>
                </div>
              </div>
            </StudioPanel>
          ) : null}
        </div>

        <aside className="space-y-5">
          <StudioPanel>
            <div className="flex items-center gap-2">
              <ImageIcon className="size-5 text-[hsl(var(--primary))]" />
              <p className="font-black">Live Summary</p>
            </div>
            <div className="mt-4 overflow-hidden rounded-md border border-[hsl(var(--border))]">
              <img src={basic.thumbnail || defaultThumbnail} alt="" className="aspect-video w-full object-cover" />
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <CheckRow label={basic.title || "Course title"} ok={Boolean(basic.title)} />
              <CheckRow label={`${allLessons.length} lessons`} ok={allLessons.length > 0} />
              <CheckRow label={`${driveLessonCount}/${allLessons.length || 1} Drive links`} ok={checks.curriculumComplete} />
              <CheckRow label={`${pricing.type} access`} ok={checks.pricingComplete} />
            </div>
          </StudioPanel>

          <StudioPanel>
            <div className="flex items-center gap-2">
              <Video className="size-5 text-[hsl(var(--primary))]" />
              <p className="font-black">Video Preview</p>
            </div>
            {previewSource.embedUrl ? (
              <div className="mt-4 aspect-video overflow-hidden rounded-md border border-[hsl(var(--border))] bg-black">
                <iframe src={previewSource.embedUrl} title="Course video preview" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen className="h-full w-full border-0" />
              </div>
            ) : (
              <div className="mt-4 grid aspect-video place-items-center rounded-md border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/45 p-5 text-center text-sm text-[hsl(var(--muted-foreground))]">
                <div>
                  <Link2 className="mx-auto mb-2 size-6 text-[hsl(var(--primary))]" />
                  Paste a Google Drive lesson link to preview it here.
                </div>
              </div>
            )}
          </StudioPanel>

          <StudioPanel>
            <div className="space-y-2">
              <p className="font-black">Admin review flow</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Draft to Submitted to Approved to Published.</p>
            </div>
            <div className="mt-4 grid gap-2">
              {["Draft", "Submitted", "Approved", "Published"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 text-sm">
                  <span className="grid size-7 place-items-center rounded-full bg-[hsl(var(--primary))]/10 text-xs font-black text-[hsl(var(--primary))]">{index + 1}</span>
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </StudioPanel>
        </aside>
      </section>

      <div className="sticky bottom-0 z-10 flex flex-wrap justify-between gap-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 py-3 backdrop-blur">
        <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>
          <ArrowLeft className="size-4" />
          Previous
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void saveCourse("draft")}>
            <Save className="size-4" />
            Save
          </Button>
          {step < steps.length - 1 ? (
            <Button type="button" onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}>
              Next
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button type="button" disabled={!checks.reviewReady} onClick={() => void saveCourse("submitted")}>
              Submit for Review
              <Sparkles className="size-4" />
            </Button>
          )}
          {step === steps.length - 1 ? (
            <Button type="button" disabled={!checks.reviewReady} onClick={() => void saveCourse("published")}>
              Publish
              <Send className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
