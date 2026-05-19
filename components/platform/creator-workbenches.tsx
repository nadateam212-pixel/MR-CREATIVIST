"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Archive,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  Copy,
  Edit3,
  Eye,
  ExternalLink,
  FileImage,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  Package,
  PlayCircle,
  Plus,
  Save,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  Upload,
  Users,
  Video
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PriceDisplay } from "@/components/ui/price-display";
import {
  type CourseLessonType,
  type PlatformProductDraft,
  type PublishingStatus,
  usePlatformStore
} from "@/hooks/use-platform-store";
import { DEFAULT_PREVIEW_VIDEO } from "@/lib/course-media";
import { normalizedExternalVideoUrl } from "@/lib/video-sources";

const courseImage =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=85";
const productImage =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85";

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function price(value: string) {
  const normalized = value.trim().replace(/^\$/, "");
  return `$${normalized || "0"}`;
}

function safeImage(value: string, fallback: string) {
  const clean = value.trim();
  if (clean.startsWith("data:image/")) return clean;
  if (clean.startsWith("https://images.unsplash.com") || clean.startsWith("https://res.cloudinary.com")) return clean;

  return fallback;
}

function readFileAsDataUrl(file: File, onLoad: (value: string) => void) {
  const reader = new FileReader();
  reader.onload = () => onLoad(String(reader.result ?? ""));
  reader.readAsDataURL(file);
}

function StatusBadge({ status }: { status: PublishingStatus | "base" }) {
  return (
    <Badge
      className={
        status === "published"
          ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
          : ""
      }
    >
      {status === "base" ? "Database" : status}
    </Badge>
  );
}

type ProductCatalogRow = {
  name: string;
  slug: string;
  category: string;
  price: string;
  status?: string;
};

type CourseCatalogRow = {
  title: string;
  slug: string;
  category: string;
  price: string;
  status?: string;
};

export function ProductBuilder({
  sellerName = "MR Creativist Seller"
}: {
  sellerName?: string;
}) {
  const createProduct = usePlatformStore((state) => state.createProduct);
  const [lastSlug, setLastSlug] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "Digital Creator Product",
    type: "Digital",
    category: "Templates",
    price: "49",
    compareAt: "89",
    stock: "250",
    delivery: "Instant download",
    image: productImage,
    tools: "Download file\nLicense key\nBuyer instructions\nSupport notes"
  });

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function uploadProductImage(file?: File) {
    if (!file) return;
    readFileAsDataUrl(file, (value) => update("image", value));
  }

  function submit(status: PublishingStatus) {
    const slug = createProduct({
      name: form.name,
      type: form.type,
      category: form.category,
      price: price(form.price),
      compareAt: price(form.compareAt),
      seller: sellerName,
      stock: Number(form.stock) || 0,
      delivery: form.delivery,
      image: safeImage(form.image, productImage),
      tools: splitLines(form.tools),
      status
    });

    setLastSlug(slug);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Package className="size-5 text-[hsl(var(--primary))]" />
              <CardTitle>Create product</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Product name
              <Input
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Category
              <Input
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Type
              <select
                value={form.type}
                onChange={(event) => update("type", event.target.value)}
                className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3"
              >
                {[
                  "Digital",
                  "Physical",
                  "Service",
                  "Software",
                  "Creator assets"
                ].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Delivery
              <Input
                value={form.delivery}
                onChange={(event) => update("delivery", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Price
              <Input
                value={form.price}
                onChange={(event) => update("price", event.target.value)}
                inputMode="decimal"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Compare price
              <Input
                value={form.compareAt}
                onChange={(event) => update("compareAt", event.target.value)}
                inputMode="decimal"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Stock
              <Input
                value={form.stock}
                onChange={(event) => update("stock", event.target.value)}
                inputMode="numeric"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Image URL
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  value={form.image}
                  onChange={(event) => update("image", event.target.value)}
                />
                <Button asChild type="button" variant="outline">
                  <label className="cursor-pointer">
                    <Upload className="size-4" />
                    Upload
                    <input type="file" accept="image/*" className="sr-only" onChange={(event) => uploadProductImage(event.target.files?.[0])} />
                  </label>
                </Button>
              </div>
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Included tools
              <textarea
                value={form.tools}
                onChange={(event) => update("tools", event.target.value)}
                className="min-h-32 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publish controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-[hsl(var(--border))] p-4">
              <div className="mb-4 overflow-hidden rounded-md border border-[hsl(var(--border))]">
                <img src={safeImage(form.image, productImage)} alt={form.name} className="aspect-[4/3] w-full object-cover" />
              </div>
              <Badge>{form.type}</Badge>
              <h2 className="mt-3 text-xl font-semibold">{form.name}</h2>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                {price(form.price)} - {form.delivery} - {form.stock || 0} in
                stock
              </p>
            </div>
            <div className="grid gap-2">
              <Button onClick={() => submit("published")}>
                <Send className="size-4" />
                Publish to marketplace
              </Button>
              <Button variant="outline" onClick={() => submit("draft")}>
                <Save className="size-4" />
                Save draft
              </Button>
            </div>
            {lastSlug ? (
              <div className="rounded-md border border-[hsl(var(--border))] p-3 text-sm">
                <p className="flex items-center gap-2 font-medium text-[hsl(var(--primary))]">
                  <CheckCircle2 className="size-4" />
                  Product saved
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/seller/products">Manage</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/marketplace">
                      <Eye className="size-4" />
                      Public page
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export function CourseBuilder({
  instructorName = "MR Creativist Instructor"
}: {
  instructorName?: string;
}) {
  const createCourse = usePlatformStore((state) => state.createCourse);
  const [lastSlug, setLastSlug] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "Professional Digital Course",
    category: "Business",
    level: "Beginner",
    price: "79",
    compareAt: "149",
    duration: "24 hours",
    lessons: "20",
    certificate: "Professional certificate",
    image: courseImage,
    trailerUrl: "",
    outcomes:
      "Launch a practical skill\nComplete quizzes and tests\nEarn a verified certificate",
    chapters: "Orientation\nCore lessons\nPractical project\nFinal assessment",
    tools: "Video lessons\nBook upload\nAuto quiz\nAssignments\nCertificate"
  });

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function uploadCourseImage(file?: File) {
    if (!file) return;
    readFileAsDataUrl(file, (value) => update("image", value));
  }

  function generateOutline() {
    setForm((current) => ({
      ...current,
      outcomes: `Understand ${current.category.toLowerCase()} fundamentals\nBuild a practical ${current.title.toLowerCase()} project\nPass the final assessment and earn a certificate`,
      chapters:
        "Foundation\nTools and uploads\nPractice lab\nQuiz and assignment\nCertificate review",
      tools:
        "AI course outline\nVideo uploads\nBook uploads\nImage uploads\nAuto quiz generation\nTests and assignments\nCertificate designer"
    }));
  }

  function submit(status: PublishingStatus) {
    const slug = createCourse({
      title: form.title,
      level: form.level,
      category: form.category,
      price: price(form.price),
      compareAt: price(form.compareAt),
      duration: form.duration,
      lessons: Number(form.lessons) || 0,
      instructor: instructorName,
      certificate: form.certificate,
      image: safeImage(form.image, courseImage),
      trailerUrl: form.trailerUrl.trim(),
      outcomes: splitLines(form.outcomes),
      chapters: splitLines(form.chapters),
      tools: splitLines(form.tools),
      status
    });

    setLastSlug(slug);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <GraduationCap className="size-5 text-[hsl(var(--primary))]" />
              <CardTitle>Create course</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Course title
              <Input
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Category
              <Input
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Level
              <select
                value={form.level}
                onChange={(event) => update("level", event.target.value)}
                className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3"
              >
                {[
                  "Beginner",
                  "Intermediate",
                  "Advanced",
                  "Expert",
                  "All levels"
                ].map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Certificate
              <Input
                value={form.certificate}
                onChange={(event) => update("certificate", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Price
              <Input
                value={form.price}
                onChange={(event) => update("price", event.target.value)}
                inputMode="decimal"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Compare price
              <Input
                value={form.compareAt}
                onChange={(event) => update("compareAt", event.target.value)}
                inputMode="decimal"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Duration
              <Input
                value={form.duration}
                onChange={(event) => update("duration", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Lessons
              <Input
                value={form.lessons}
                onChange={(event) => update("lessons", event.target.value)}
                inputMode="numeric"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Image URL
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  value={form.image}
                  onChange={(event) => update("image", event.target.value)}
                />
                <Button asChild type="button" variant="outline">
                  <label className="cursor-pointer">
                    <FileImage className="size-4" />
                    Upload
                    <input type="file" accept="image/*" className="sr-only" onChange={(event) => uploadCourseImage(event.target.files?.[0])} />
                  </label>
                </Button>
              </div>
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Preview video URL
              <Input
                value={form.trailerUrl}
                onChange={(event) => update("trailerUrl", event.target.value)}
                placeholder="YouTube, Vimeo, Google Drive, or hosted MP4"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Outcomes
              <textarea
                value={form.outcomes}
                onChange={(event) => update("outcomes", event.target.value)}
                className="min-h-32 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Chapters
              <textarea
                value={form.chapters}
                onChange={(event) => update("chapters", event.target.value)}
                className="min-h-32 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Tools
              <textarea
                value={form.tools}
                onChange={(event) => update("tools", event.target.value)}
                className="min-h-28 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publish controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-[hsl(var(--border))] p-4">
              <Badge>{form.level}</Badge>
              <h2 className="mt-3 text-xl font-semibold">{form.title}</h2>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                {price(form.price)} - {form.duration} - {form.lessons || 0}{" "}
                lessons
              </p>
            </div>
            <div className="grid gap-2">
              <Button variant="outline" onClick={generateOutline}>
                <Sparkles className="size-4" />
                Generate outline and quiz plan
              </Button>
              <Button onClick={() => submit("published")}>
                <Send className="size-4" />
                Publish to courses
              </Button>
              <Button variant="outline" onClick={() => submit("draft")}>
                <Save className="size-4" />
                Save draft
              </Button>
            </div>
            {lastSlug ? (
              <div className="rounded-md border border-[hsl(var(--border))] p-3 text-sm">
                <p className="flex items-center gap-2 font-medium text-[hsl(var(--primary))]">
                  <CheckCircle2 className="size-4" />
                  Course saved
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/instructor/courses">Manage</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/courses">
                      <Eye className="size-4" />
                      Public page
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export function InstructorCourseStudio({
  instructorName = "MR Creativist Instructor"
}: {
  instructorName?: string;
}) {
  const createCourse = usePlatformStore((state) => state.createCourse);
  const updateCourse = usePlatformStore((state) => state.updateCourse);
  const createdCourses = usePlatformStore((state) => state.createdCourses);
  const courseChapters = usePlatformStore((state) => state.courseChapters);
  const courseLessons = usePlatformStore((state) => state.courseLessons);
  const courseAssets = usePlatformStore((state) => state.courseAssets);
  const courseQuizzes = usePlatformStore((state) => state.courseQuizzes);
  const studentCourseRecords = usePlatformStore(
    (state) => state.studentCourseRecords
  );
  const addCourseChapter = usePlatformStore((state) => state.addCourseChapter);
  const updateCourseChapter = usePlatformStore(
    (state) => state.updateCourseChapter
  );
  const deleteCourseChapter = usePlatformStore(
    (state) => state.deleteCourseChapter
  );
  const toggleCourseChapterLock = usePlatformStore(
    (state) => state.toggleCourseChapterLock
  );
  const addCourseLesson = usePlatformStore((state) => state.addCourseLesson);
  const updateCourseLesson = usePlatformStore(
    (state) => state.updateCourseLesson
  );
  const deleteCourseLesson = usePlatformStore(
    (state) => state.deleteCourseLesson
  );
  const attachAssetToLesson = usePlatformStore(
    (state) => state.attachAssetToLesson
  );
  const addCourseAsset = usePlatformStore((state) => state.addCourseAsset);
  const deleteCourseAsset = usePlatformStore(
    (state) => state.deleteCourseAsset
  );
  const generateCourseQuiz = usePlatformStore(
    (state) => state.generateCourseQuiz
  );
  const addCourseQuiz = usePlatformStore((state) => state.addCourseQuiz);
  const updateCourseQuiz = usePlatformStore((state) => state.updateCourseQuiz);
  const addCourseQuizQuestion = usePlatformStore(
    (state) => state.addCourseQuizQuestion
  );
  const updateCourseQuizQuestion = usePlatformStore(
    (state) => state.updateCourseQuizQuestion
  );
  const deleteCourseQuizQuestion = usePlatformStore(
    (state) => state.deleteCourseQuizQuestion
  );
  const replaceCourseQuizQuestions = usePlatformStore(
    (state) => state.replaceCourseQuizQuestions
  );
  const deleteCourseQuiz = usePlatformStore((state) => state.deleteCourseQuiz);
  const updateStudentRecord = usePlatformStore(
    (state) => state.updateStudentRecord
  );
  const updateCourseStatus = usePlatformStore(
    (state) => state.updateCourseStatus
  );
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    createdCourses[0]?.slug ?? null
  );
  const [studioView, setStudioView] = useState("setup");
  const [form, setForm] = useState({
    title: "Professional Digital Course",
    category: "Business",
    level: "Beginner",
    price: "79",
    compareAt: "149",
    duration: "24 hours",
    lessons: "20",
    certificate: "Professional certificate",
    image: courseImage,
    trailerUrl: "",
    outcomes:
      "Launch a practical skill\nComplete quizzes and tests\nEarn a verified certificate",
    chapters: "Orientation\nCore lessons\nPractical project\nFinal assessment",
    tools:
      "Video lessons\nBook upload\nImage upload\nAuto quiz\nAssignments\nCertificate"
  });
  const [chapterForm, setChapterForm] = useState({
    title: "New chapter",
    description: "Lessons, resources, quiz, and completion gate.",
    estimatedMinutes: "45",
    requiredScore: "70",
    isLocked: true
  });
  const [lessonForm, setLessonForm] = useState({
    chapterId: "",
    type: "video" as CourseLessonType,
    title: "New lesson",
    durationMinutes: "20",
    summary: "What learners should understand after this lesson.",
    content: "Add instructor notes, step-by-step guidance, examples, and learner instructions.",
    videoUrl: "",
    imageUrl: "",
    assetId: ""
  });
  const [assetForm, setAssetForm] = useState({
    type: "video" as "image" | "video" | "book" | "document",
    title: "Lesson asset",
    url: DEFAULT_PREVIEW_VIDEO,
    fileName: "preview-video.mp4",
    chapterId: ""
  });
  const [quizForm, setQuizForm] = useState({
    title: "Chapter quiz",
    kind: "quiz" as "quiz" | "test",
    chapterId: "",
    passingScore: "80",
    maxAttempts: "3",
    count: "5"
  });
  const [questionForm, setQuestionForm] = useState({
    quizId: "",
    question: "What should the learner do first?",
    optionA: "Apply the lesson in a practical task",
    optionB: "Skip the lesson",
    optionC: "Memorize only the title",
    optionD: "Disable progress tracking",
    correctIndex: "0",
    explanation: "The learner should prove understanding through practical application."
  });
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [aiQuizLoading, setAiQuizLoading] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState("");
  const [assetUploadMessage, setAssetUploadMessage] = useState("");

  const selectedCourse = selectedSlug
    ? createdCourses.find((course) => course.slug === selectedSlug)
    : null;
  const selectedChapters = selectedSlug
    ? (courseChapters[selectedSlug] ?? [])
    : [];
  const selectedLessons = selectedSlug
    ? (courseLessons[selectedSlug] ?? [])
    : [];
  const selectedAssets = selectedSlug
    ? courseAssets.filter((asset) => asset.courseSlug === selectedSlug)
    : [];
  const selectedQuizzes = selectedSlug
    ? courseQuizzes.filter((quiz) => quiz.courseSlug === selectedSlug)
    : [];
  const selectedStudents = selectedSlug
    ? (studentCourseRecords[selectedSlug] ?? [])
    : [];
  const publishReady =
    Boolean(selectedCourse) &&
    selectedChapters.length >= 2 &&
    selectedAssets.some((asset) => asset.type === "video") &&
    selectedQuizzes.some((quiz) => quiz.kind === "quiz") &&
    selectedQuizzes.some((quiz) => quiz.kind === "test");

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function uploadStudioCourseImage(file?: File) {
    if (!file) return;
    readFileAsDataUrl(file, (value) => update("image", value));
  }

  async function generateOutline() {
    setOutlineLoading(true);
    setAssetUploadMessage("");

    try {
      const response = await fetch("/api/ai-tools/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: `${form.title}. Category: ${form.category}. Build chapters, lessons, outcomes, quiz checkpoints, and document resources.`,
          level: form.level.toLowerCase().includes("advanced") ? "advanced" : form.level.toLowerCase().includes("intermediate") ? "intermediate" : "beginner"
        })
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error ?? "MrCreativist.AI outline failed.");
      }

      const modules = Array.isArray(result.modules) ? result.modules : [];
      setForm((current) => ({
        ...current,
        title: result.title || current.title,
        duration: result.duration || current.duration,
        level: result.level || current.level,
        outcomes: (result.learningOutcomes ?? []).join("\n") || current.outcomes,
        chapters: modules.map((module: { title?: string }) => module.title).filter(Boolean).join("\n") || current.chapters,
        lessons: String(modules.reduce((total: number, module: { lessons?: string[] }) => total + (module.lessons?.length ?? 0), 0) || current.lessons),
        tools: "MrCreativist.AI outline\nChapter documents\nVideo uploads\nImage uploads\nAuto quiz generation\nFinal tests\nAssignments\nCertificate"
      }));
      setAssetUploadMessage("MrCreativist.AI generated the course chapters, outcomes, lesson count, and tool plan.");
    } catch (error) {
      setForm((current) => ({
        ...current,
        outcomes: `Understand ${current.category.toLowerCase()} fundamentals\nBuild a practical ${current.title.toLowerCase()} project\nPass quizzes, tests, and final review\nEarn a verified certificate`,
        chapters:
          "Orientation and goals\nVideo lessons and book resources\nPractice lab and assignment\nAI quiz checkpoint\nFinal test and certificate review",
        tools:
          "Image upload\nVideo upload\nBook upload\nChapter locks\nAI quiz generation\nFinal tests\nStudent score tracking\nCertificate designer"
      }));
      setAssetUploadMessage(error instanceof Error ? `${error.message} Local outline applied.` : "Local outline applied.");
    } finally {
      setOutlineLoading(false);
    }
  }

  function saveCourse(status: PublishingStatus) {
    const slug = createCourse({
      title: form.title,
      level: form.level,
      category: form.category,
      price: price(form.price),
      compareAt: price(form.compareAt),
      duration: form.duration,
      lessons: Number(form.lessons) || splitLines(form.chapters).length,
      instructor: instructorName,
      certificate: form.certificate,
      image: safeImage(form.image, courseImage),
      trailerUrl: form.trailerUrl.trim(),
      outcomes: splitLines(form.outcomes),
      chapters: splitLines(form.chapters),
      tools: splitLines(form.tools),
      status
    });

    setSelectedSlug(slug);
    setStudioView("chapters");
  }

  function addChapter() {
    if (!selectedSlug) return;

    addCourseChapter(selectedSlug, {
      title: chapterForm.title,
      description: chapterForm.description,
      estimatedMinutes: Number(chapterForm.estimatedMinutes) || 45,
      requiredScore: Number(chapterForm.requiredScore) || 0,
      isLocked: chapterForm.isLocked
    });
    setChapterForm((current) => ({
      ...current,
      title: `Chapter ${selectedChapters.length + 2}`,
      requiredScore: String(Math.min(90, Number(current.requiredScore) + 5))
    }));
  }

  function assetPrimaryUrl(asset: (typeof selectedAssets)[number]) {
    return asset.embedUrl || asset.playbackUrl || asset.url;
  }

  function lessonsForChapter(chapterId: string) {
    return selectedLessons
      .filter((lesson) => lesson.chapterId === chapterId)
      .slice()
      .sort((left, right) => left.order - right.order);
  }

  function addLesson() {
    if (!selectedSlug) return;

    const chapterId = lessonForm.chapterId || selectedChapters[0]?.id;
    if (!chapterId) {
      setAssetUploadMessage("Add a chapter before adding lessons.");
      return;
    }

    const asset = selectedAssets.find((item) => item.id === lessonForm.assetId);
    const assetUrl = asset ? assetPrimaryUrl(asset) : "";
    const lessonType =
      asset?.type === "video"
        ? "video"
        : asset?.type === "image"
          ? "image"
          : lessonForm.type;
    const resources =
      asset && asset.type !== "video"
        ? [{ label: asset.title, url: asset.url }]
        : [];

    const lessonId = addCourseLesson(selectedSlug, {
      chapterId,
      title: lessonForm.title || asset?.title || "Untitled lesson",
      type: lessonType,
      durationMinutes: Number(lessonForm.durationMinutes) || 20,
      summary: lessonForm.summary,
      content: lessonForm.content,
      videoUrl: lessonType === "video" ? lessonForm.videoUrl || assetUrl : "",
      imageUrl: lessonType === "image" ? lessonForm.imageUrl || asset?.url || "" : "",
      assetIds: asset ? [asset.id] : [],
      resources,
      isPreview: selectedLessons.length === 0
    });

    if (asset) {
      attachAssetToLesson(selectedSlug, lessonId, asset.id);
    }

    setLessonForm((current) => ({
      ...current,
      title: "New lesson",
      videoUrl: "",
      imageUrl: "",
      assetId: "",
      summary: "What learners should understand after this lesson.",
      content: "Add instructor notes, step-by-step guidance, examples, and learner instructions."
    }));
  }

  function addLessonFromAsset(assetId: string, type: "image" | "video" | "book" | "document", title: string, url: string, chapterOverride?: string) {
    if (!selectedSlug) return;

    const chapterId = chapterOverride || assetForm.chapterId || selectedChapters[0]?.id;
    if (!chapterId) return;

    const lessonType: CourseLessonType =
      type === "video" ? "video" : type === "image" ? "image" : "download";
    const lessonId = addCourseLesson(selectedSlug, {
      chapterId,
      title: type === "video" ? `Watch: ${title}` : type === "image" ? `View: ${title}` : `Download: ${title}`,
      type: lessonType,
      durationMinutes: type === "video" ? 20 : 10,
      summary:
        type === "video"
          ? `Instructor video for ${selectedCourse?.title ?? "this course"}.`
          : `Course asset for ${selectedCourse?.title ?? "this course"}.`,
      content:
        type === "video"
          ? "Watch this instructor video inside the course player."
          : "Use this instructor-provided resource to complete the lesson.",
      videoUrl: type === "video" ? url : "",
      imageUrl: type === "image" ? url : "",
      assetIds: [assetId],
      resources: type === "video" ? [] : [{ label: title, url }],
      isPreview: selectedLessons.length === 0
    });

    attachAssetToLesson(selectedSlug, lessonId, assetId);
  }

  function addManualQuiz() {
    if (!selectedSlug || !selectedCourse) return;

    const title =
      quizForm.title.trim() ||
      `${selectedCourse.title} ${quizForm.kind === "test" ? "final test" : "chapter quiz"}`;
    const quizId = addCourseQuiz(selectedSlug, {
      chapterId: quizForm.chapterId || selectedChapters[0]?.id,
      title,
      kind: quizForm.kind,
      passingScore: Number(quizForm.passingScore) || 80,
      maxAttempts: Number(quizForm.maxAttempts) || 3,
      questions: []
    });

    setQuestionForm((current) => ({ ...current, quizId }));
  }

  function addManualQuestion() {
    const quizId = questionForm.quizId || selectedQuizzes[0]?.id;
    if (!quizId) return;

    addCourseQuizQuestion(quizId, {
      question: questionForm.question,
      options: [questionForm.optionA, questionForm.optionB, questionForm.optionC, questionForm.optionD],
      correctIndex: Number(questionForm.correctIndex) || 0,
      explanation: questionForm.explanation
    });
  }

  async function generateAIQuiz() {
    if (!selectedSlug || !selectedCourse) return;

    setAiQuizLoading(true);
    setAssetUploadMessage("");

    try {
      const chapter = selectedChapters.find((item) => item.id === quizForm.chapterId) ?? selectedChapters[0];
      const lessonTitles = selectedLessons
        .filter((lesson) => !chapter || lesson.chapterId === chapter.id)
        .map((lesson) => lesson.title);
      const response = await fetch("/api/ai/course-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseTitle: selectedCourse.title,
          chapterTitle: chapter?.title,
          outcomes: selectedCourse.outcomes,
          lessons: lessonTitles,
          kind: quizForm.kind,
          count: Number(quizForm.count) || 5,
          language: "English"
        })
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error ?? "AI quiz generation failed.");
      }

      addCourseQuiz(selectedSlug, {
        chapterId: chapter?.id,
        title: result.title ?? quizForm.title,
        kind: quizForm.kind,
        passingScore: Number(quizForm.passingScore) || 80,
        maxAttempts: Number(quizForm.maxAttempts) || 3,
        questions: (result.questions ?? []).map(
          (question: { question: string; options: string[]; correctIndex: number; explanation?: string }) => ({
            question: question.question,
            options: question.options.slice(0, 4),
            correctIndex: question.correctIndex,
            explanation: question.explanation ?? "AI-generated explanation."
          })
        )
      });
      setAssetUploadMessage(
        result.provider === "gemini"
          ? "MrCreativist.AI generated a multiple-choice quiz."
          : "Fallback quiz generated. Add the AI provider key to enable MrCreativist.AI."
      );
    } catch (error) {
      const quizId = generateCourseQuiz(selectedSlug, quizForm.kind);
      setQuestionForm((current) => ({ ...current, quizId }));
      setAssetUploadMessage(error instanceof Error ? `${error.message} Fallback quiz created.` : "Fallback quiz created.");
    } finally {
      setAiQuizLoading(false);
    }
  }

  async function addAssetFromFile(
    type: "image" | "video" | "book" | "document",
    file?: File
  ) {
    if (!selectedSlug || !file) return;

    setUploadingAsset(`${type}:${file.name}`);
    setAssetUploadMessage("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("kind", type === "book" ? "document" : type);
      formData.set("ownerType", "course");
      formData.set("ownerId", selectedSlug);
      formData.set("fileName", file.name);
      formData.set(
        "metadata",
        JSON.stringify({
          courseSlug: selectedSlug,
          courseTitle: selectedCourse?.title,
          assetType: type,
          chapterId: assetForm.chapterId || selectedChapters[0]?.id
        })
      );

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error ?? "Upload failed.");
      }

      const asset = result.asset;
      const hostedVideoUrl = asset.embedUrl || asset.playbackUrl || asset.secureUrl || asset.url;
      const assetId = addCourseAsset({
        courseSlug: selectedSlug,
        chapterId: assetForm.chapterId || selectedChapters[0]?.id,
        type,
        title: file.name.replace(/\.[^.]+$/, ""),
        fileName: file.name,
        url: hostedVideoUrl,
        provider: asset.provider,
        thumbnailUrl: asset.thumbnailUrl,
        embedUrl: asset.embedUrl,
        playbackUrl: asset.playbackUrl,
        providerAssetId: asset.providerAssetId,
        status: asset.status,
        sizeBytes: asset.sizeBytes,
        durationSeconds: asset.durationSeconds
      });
      addLessonFromAsset(assetId, type, file.name.replace(/\.[^.]+$/, ""), hostedVideoUrl, assetForm.chapterId);
      if (type === "video" && hostedVideoUrl) {
        updateCourse(selectedSlug, { trailerUrl: hostedVideoUrl });
      }
      setAssetUploadMessage(
        result.warning
          ? `${asset.provider ?? "Hosted"} upload attached. ${result.warning}`
          : `${asset.provider ?? "Hosted"} upload saved to the media library.`
      );
    } catch (error) {
      setAssetUploadMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploadingAsset("");
    }
  }

  async function addManualAsset() {
    if (!selectedSlug) return;

    setUploadingAsset("manual");
    setAssetUploadMessage("");

    try {
      const normalizedVideo =
        assetForm.type === "video" ? normalizedExternalVideoUrl(assetForm.url) : null;
      const assetUrl = normalizedVideo?.url ?? assetForm.url;
      const assetFileName =
        assetForm.type === "video" && assetForm.fileName === "course-resource.pdf"
          ? `${normalizedVideo?.providerLabel ?? "external"} video`
          : assetForm.fileName;
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: assetFileName,
          url: assetUrl,
          kind: assetForm.type === "book" ? "document" : assetForm.type,
          provider: "external",
          embedUrl: normalizedVideo?.embedUrl,
          playbackUrl: normalizedVideo?.playbackUrl,
          ownerType: "course",
          ownerId: selectedSlug,
          metadata: {
            courseSlug: selectedSlug,
            courseTitle: selectedCourse?.title,
            assetType: assetForm.type,
            title: assetForm.title,
            chapterId: assetForm.chapterId || selectedChapters[0]?.id
          }
        })
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error ?? "Asset could not be attached.");
      }

      const asset = result.asset;
      const assetId = addCourseAsset({
        courseSlug: selectedSlug,
        chapterId: assetForm.chapterId || selectedChapters[0]?.id,
        type: assetForm.type,
        title: assetForm.title,
        fileName: asset.fileName ?? assetFileName,
        url: asset.url,
        provider: asset.provider,
        thumbnailUrl: asset.thumbnailUrl,
        embedUrl: asset.embedUrl,
        playbackUrl: asset.playbackUrl,
        providerAssetId: asset.providerAssetId,
        status: asset.status,
        sizeBytes: asset.sizeBytes,
        durationSeconds: asset.durationSeconds
      });
      addLessonFromAsset(
        assetId,
        assetForm.type,
        assetForm.title,
        asset.embedUrl || asset.playbackUrl || asset.url,
        assetForm.chapterId
      );
      if (assetForm.type === "video") {
        updateCourse(selectedSlug, {
          trailerUrl: asset.embedUrl || asset.playbackUrl || asset.url
        });
      }
      setAssetUploadMessage(
        assetForm.type === "video"
          ? `${normalizedVideo?.providerLabel ?? "External"} video attached to the course player.`
          : "External media link recorded in the library."
      );
    } catch (error) {
      setAssetUploadMessage(error instanceof Error ? error.message : "Asset could not be attached.");
    } finally {
      setUploadingAsset("");
    }
  }

  function checklistItem(label: string, complete: boolean) {
    return (
      <div className="flex items-center justify-between rounded-md border border-[hsl(var(--border))] p-3 text-sm">
        <span>{label}</span>
        <Badge
          className={
            complete
              ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
              : ""
          }
        >
          {complete ? "Ready" : "Needed"}
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[hsl(var(--primary))]">
            Instructor course studio
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Build, gate, test, and publish courses
          </h1>
          <p className="mt-3 max-w-3xl leading-7 text-[hsl(var(--muted-foreground))]">
            Create the course, upload images/videos/books, manage locked
            chapters, generate quizzes and tests, and track student readiness
            before publishing.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/courses">
            <Eye className="size-4" />
            Public catalog
          </Link>
        </Button>
      </section>

      <section className="grid gap-4 xl:grid-cols-[18rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              variant={!selectedSlug ? "default" : "outline"}
              onClick={() => setSelectedSlug(null)}
            >
              <Plus className="size-4" />
              New course
            </Button>
            {createdCourses.map((course) => (
              <button
                key={course.slug}
                type="button"
                onClick={() => setSelectedSlug(course.slug)}
                className={`w-full rounded-md border p-3 text-left text-sm transition-colors ${
                  selectedSlug === course.slug
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--muted))]"
                    : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/65"
                }`}
              >
                <span className="font-medium">{course.title}</span>
                <div className="mt-2 flex items-center justify-between">
                  <StatusBadge status={course.status} />
                  <PriceDisplay price={course.price} className="text-sm text-[hsl(var(--muted-foreground))]" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              ["setup", "Setup", GraduationCap],
              ["chapters", "Chapters", BookOpen],
              ["uploads", "Uploads", Upload],
              ["ai", "AI quizzes", Brain],
              ["students", "Students", Users],
              ["publish", "Publish", Send]
            ].map(([key, label, Icon]) => (
              <Button
                key={String(key)}
                type="button"
                variant={studioView === key ? "default" : "outline"}
                onClick={() => setStudioView(String(key))}
                className="shrink-0"
              >
                <Icon className="size-4" />
                {String(label)}
              </Button>
            ))}
          </div>

          {studioView === "setup" ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedCourse ? "Course summary" : "Course setup"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {selectedCourse ? (
                  <>
                    <div className="rounded-lg border border-[hsl(var(--border))] p-4 md:col-span-2">
                      <Badge>{selectedCourse.level}</Badge>
                      <h2 className="mt-3 text-2xl font-semibold">
                        {selectedCourse.title}
                      </h2>
                      <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                        {selectedCourse.category} - {selectedCourse.duration} -{" "}
                        {selectedCourse.lessons} lessons
                      </p>
                    </div>
                    <label className="grid gap-2 text-sm font-medium md:col-span-2">
                      Preview video URL
                      <Input
                        value={selectedCourse.trailerUrl ?? ""}
                        onChange={(event) =>
                          updateCourse(selectedCourse.slug, {
                            trailerUrl: event.target.value.trim()
                          })
                        }
                        placeholder="YouTube, Vimeo, Google Drive, or hosted MP4"
                      />
                    </label>
                    {selectedCourse.outcomes.map((outcome) => (
                      <div
                        key={outcome}
                        className="rounded-md border border-[hsl(var(--border))] p-3 text-sm"
                      >
                        <ShieldCheck className="mb-2 size-4 text-[hsl(var(--primary))]" />
                        {outcome}
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <label className="grid gap-2 text-sm font-medium">
                      Course title
                      <Input
                        value={form.title}
                        onChange={(event) =>
                          update("title", event.target.value)
                        }
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Category
                      <Input
                        value={form.category}
                        onChange={(event) =>
                          update("category", event.target.value)
                        }
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Level
                      <select
                        value={form.level}
                        onChange={(event) =>
                          update("level", event.target.value)
                        }
                        className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3"
                      >
                        {[
                          "Beginner",
                          "Intermediate",
                          "Advanced",
                          "Expert",
                          "All levels"
                        ].map((level) => (
                          <option key={level}>{level}</option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Certificate
                      <Input
                        value={form.certificate}
                        onChange={(event) =>
                          update("certificate", event.target.value)
                        }
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Price
                      <Input
                        value={form.price}
                        onChange={(event) =>
                          update("price", event.target.value)
                        }
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Duration
                      <Input
                        value={form.duration}
                        onChange={(event) =>
                          update("duration", event.target.value)
                        }
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium md:col-span-2">
                      Cover image URL
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <Input
                          value={form.image}
                          onChange={(event) =>
                            update("image", event.target.value)
                          }
                        />
                        <Button asChild type="button" variant="outline">
                          <label className="cursor-pointer">
                            <FileImage className="size-4" />
                            Upload
                            <input type="file" accept="image/*" className="sr-only" onChange={(event) => uploadStudioCourseImage(event.target.files?.[0])} />
                          </label>
                        </Button>
                      </div>
                    </label>
                    <label className="grid gap-2 text-sm font-medium md:col-span-2">
                      Preview video URL
                      <Input
                        value={form.trailerUrl}
                        onChange={(event) =>
                          update("trailerUrl", event.target.value)
                        }
                        placeholder="YouTube, Vimeo, Google Drive, or hosted MP4"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Outcomes
                      <textarea
                        value={form.outcomes}
                        onChange={(event) =>
                          update("outcomes", event.target.value)
                        }
                        className="min-h-32 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Chapters
                      <textarea
                        value={form.chapters}
                        onChange={(event) =>
                          update("chapters", event.target.value)
                        }
                        className="min-h-32 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2 md:col-span-2">
                      <Button variant="outline" onClick={() => void generateOutline()} disabled={outlineLoading}>
                        {outlineLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                        MrCreativist.AI outline
                      </Button>
                      <Button onClick={() => saveCourse("draft")}>
                        <Save className="size-4" />
                        Save draft
                      </Button>
                      <Button onClick={() => saveCourse("published")}>
                        <Send className="size-4" />
                        Fast publish
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}

          {studioView === "chapters" ? (
            <Card>
              <CardHeader>
                <CardTitle>Chapter manager</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedCourse ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Create or select a course first.
                  </p>
                ) : null}
                {selectedChapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="grid gap-3 rounded-lg border border-[hsl(var(--border))] p-4 lg:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>Chapter {chapter.order}</Badge>
                        <Badge>{chapter.requiredScore}% required</Badge>
                        <Badge>{chapter.estimatedMinutes} min</Badge>
                      </div>
                      <Input
                        value={chapter.title}
                        onChange={(event) =>
                          updateCourseChapter(chapter.courseSlug, chapter.id, {
                            title: event.target.value
                          })
                        }
                        className="mt-3 font-semibold"
                      />
                      <Input
                        value={chapter.description}
                        onChange={(event) =>
                          updateCourseChapter(chapter.courseSlug, chapter.id, {
                            description: event.target.value
                          })
                        }
                        className="mt-2"
                      />
                    </div>
                    <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toggleCourseChapterLock(
                            chapter.courseSlug,
                            chapter.id
                          )
                        }
                      >
                        {chapter.isLocked ? (
                          <Lock className="size-4" />
                        ) : (
                          <Unlock className="size-4" />
                        )}
                        {chapter.isLocked ? "Locked" : "Open"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          deleteCourseChapter(chapter.courseSlug, chapter.id)
                        }
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </div>
                    <div className="space-y-3 border-t border-[hsl(var(--border))] pt-3 lg:col-span-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">Chapter lessons and materials</p>
                        <Badge>{lessonsForChapter(chapter.id).length} lessons</Badge>
                      </div>
                      {lessonsForChapter(chapter.id).map((lesson) => (
                        <div
                          key={lesson.id}
                          className="grid gap-3 rounded-md border border-[hsl(var(--border))] p-3 md:grid-cols-[9rem_1fr_7rem_auto]"
                        >
                          <select
                            value={lesson.type}
                            onChange={(event) =>
                              updateCourseLesson(chapter.courseSlug, lesson.id, {
                                type: event.target.value as CourseLessonType
                              })
                            }
                            className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
                          >
                            {["video", "article", "image", "download", "assignment", "quiz"].map((type) => (
                              <option key={type}>{type}</option>
                            ))}
                          </select>
                          <Input
                            value={lesson.title}
                            onChange={(event) =>
                              updateCourseLesson(chapter.courseSlug, lesson.id, {
                                title: event.target.value
                              })
                            }
                          />
                          <Input
                            value={String(lesson.durationMinutes)}
                            inputMode="numeric"
                            onChange={(event) =>
                              updateCourseLesson(chapter.courseSlug, lesson.id, {
                                durationMinutes: Number(event.target.value) || 0
                              })
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteCourseLesson(chapter.courseSlug, lesson.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                          <Input
                            value={lesson.videoUrl ?? ""}
                            placeholder="Video URL for this lesson"
                            onChange={(event) =>
                              updateCourseLesson(chapter.courseSlug, lesson.id, {
                                videoUrl: event.target.value
                              })
                            }
                            className="md:col-span-2"
                          />
                          <Input
                            value={lesson.imageUrl ?? ""}
                            placeholder="Image URL for this lesson"
                            onChange={(event) =>
                              updateCourseLesson(chapter.courseSlug, lesson.id, {
                                imageUrl: event.target.value
                              })
                            }
                            className="md:col-span-2"
                          />
                          <textarea
                            value={lesson.content}
                            onChange={(event) =>
                              updateCourseLesson(chapter.courseSlug, lesson.id, {
                                content: event.target.value,
                                summary: event.target.value.slice(0, 220)
                              })
                            }
                            className="min-h-20 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] md:col-span-4"
                          />
                          <select
                            value=""
                            onChange={(event) => {
                              if (event.target.value) {
                                attachAssetToLesson(chapter.courseSlug, lesson.id, event.target.value);
                              }
                            }}
                            className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm md:col-span-4"
                            aria-label="Attach asset to lesson"
                          >
                            <option value="">Attach uploaded video, image, or document</option>
                            {selectedAssets.map((asset) => (
                              <option key={asset.id} value={asset.id}>
                                {asset.type} - {asset.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {selectedCourse ? (
                  <div className="grid gap-3 rounded-lg border border-dashed border-[hsl(var(--border))] p-4 md:grid-cols-5">
                    <Input
                      value={chapterForm.title}
                      onChange={(event) =>
                        setChapterForm((current) => ({
                          ...current,
                          title: event.target.value
                        }))
                      }
                    />
                    <Input
                      value={chapterForm.description}
                      onChange={(event) =>
                        setChapterForm((current) => ({
                          ...current,
                          description: event.target.value
                        }))
                      }
                      className="md:col-span-2"
                    />
                    <Input
                      value={chapterForm.requiredScore}
                      onChange={(event) =>
                        setChapterForm((current) => ({
                          ...current,
                          requiredScore: event.target.value
                        }))
                      }
                      inputMode="numeric"
                    />
                    <Button onClick={addChapter}>
                      <Plus className="size-4" />
                      Add
                    </Button>
                  </div>
                ) : null}
                {selectedCourse ? (
                  <div className="grid gap-3 rounded-lg border border-dashed border-[hsl(var(--border))] p-4 md:grid-cols-6">
                    <select
                      value={lessonForm.chapterId}
                      onChange={(event) =>
                        setLessonForm((current) => ({
                          ...current,
                          chapterId: event.target.value
                        }))
                      }
                      className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
                    >
                      <option value="">First chapter</option>
                      {selectedChapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.id}>
                          {chapter.title}
                        </option>
                      ))}
                    </select>
                    <select
                      value={lessonForm.type}
                      onChange={(event) =>
                        setLessonForm((current) => ({
                          ...current,
                          type: event.target.value as CourseLessonType
                        }))
                      }
                      className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
                    >
                      {["video", "article", "image", "download", "assignment", "quiz"].map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                    <Input
                      value={lessonForm.title}
                      placeholder="Lesson title"
                      onChange={(event) =>
                        setLessonForm((current) => ({
                          ...current,
                          title: event.target.value
                        }))
                      }
                      className="md:col-span-2"
                    />
                    <Input
                      value={lessonForm.durationMinutes}
                      placeholder="Minutes"
                      inputMode="numeric"
                      onChange={(event) =>
                        setLessonForm((current) => ({
                          ...current,
                          durationMinutes: event.target.value
                        }))
                      }
                    />
                    <Button onClick={addLesson}>
                      <Plus className="size-4" />
                      Add lesson
                    </Button>
                    <Input
                      value={lessonForm.videoUrl}
                      placeholder="Video URL: YouTube, Vimeo, Drive, Cloudinary, MP4"
                      onChange={(event) =>
                        setLessonForm((current) => ({
                          ...current,
                          videoUrl: event.target.value
                        }))
                      }
                      className="md:col-span-3"
                    />
                    <Input
                      value={lessonForm.imageUrl}
                      placeholder="Image URL"
                      onChange={(event) =>
                        setLessonForm((current) => ({
                          ...current,
                          imageUrl: event.target.value
                        }))
                      }
                      className="md:col-span-3"
                    />
                    <textarea
                      value={lessonForm.content}
                      onChange={(event) =>
                        setLessonForm((current) => ({
                          ...current,
                          content: event.target.value,
                          summary: event.target.value.slice(0, 220)
                        }))
                      }
                      className="min-h-24 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] md:col-span-4"
                    />
                    <select
                      value={lessonForm.assetId}
                      onChange={(event) =>
                        setLessonForm((current) => ({
                          ...current,
                          assetId: event.target.value
                        }))
                      }
                      className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm md:col-span-2"
                    >
                      <option value="">No uploaded asset</option>
                      {selectedAssets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.type} - {asset.title}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {studioView === "uploads" ? (
            <Card>
              <CardHeader>
                <CardTitle>Upload center</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedCourse ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Create or select a course first.
                  </p>
                ) : null}
                {selectedCourse ? (
                  <div className="grid gap-3">
                    <label className="grid gap-2 text-sm font-medium md:max-w-sm">
                      Attach uploads to chapter
                      <select
                        value={assetForm.chapterId}
                        onChange={(event) => setAssetForm((current) => ({ ...current, chapterId: event.target.value }))}
                        className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
                      >
                        <option value="">First chapter</option>
                        {selectedChapters.map((chapter) => (
                          <option key={chapter.id} value={chapter.id}>
                            {chapter.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="grid gap-3 md:grid-cols-3">
                    {[
                      {
                        label: "Image upload",
                        type: "image" as const,
                        icon: FileImage,
                        accept: "image/*"
                      },
                      {
                        label: "Video upload",
                        type: "video" as const,
                        icon: Video,
                        accept: "video/*"
                      },
                      {
                        label: "Book/PDF upload",
                        type: "book" as const,
                        icon: FileText,
                        accept: ".pdf,.doc,.docx,.epub"
                      }
                    ].map((upload) => (
                      <label
                        key={upload.label}
                        className="cursor-pointer rounded-lg border border-[hsl(var(--border))] p-4 text-sm"
                      >
                        <upload.icon className="mb-3 size-5 text-[hsl(var(--primary))]" />
                        <span className="font-medium">{upload.label}</span>
                        <input
                          type="file"
                          accept={upload.accept}
                          className="sr-only"
                          onChange={(event) =>
                            void addAssetFromFile(
                              upload.type,
                              event.target.files?.[0]
                            )
                          }
                        />
                        <p className="mt-2 text-[hsl(var(--muted-foreground))]">
                          {upload.type === "video"
                            ? "Upload to Vimeo first, with Cloudinary fallback."
                            : "Upload to Cloudinary and attach delivery metadata."}
                        </p>
                        {uploadingAsset.startsWith(`${upload.type}:`) ? (
                          <span className="mt-3 flex items-center gap-2 text-xs text-[hsl(var(--primary))]">
                            <Loader2 className="size-3 animate-spin" />
                            Uploading
                          </span>
                        ) : null}
                      </label>
                    ))}
                    </div>
                  </div>
                ) : null}
                {selectedCourse ? (
                  <div className="grid gap-3 rounded-lg border border-dashed border-[hsl(var(--border))] p-4 md:grid-cols-6">
                    <select
                      value={assetForm.chapterId}
                      onChange={(event) => setAssetForm((current) => ({ ...current, chapterId: event.target.value }))}
                      className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
                    >
                      <option value="">First chapter</option>
                      {selectedChapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.id}>
                          {chapter.title}
                        </option>
                      ))}
                    </select>
                    <select
                      value={assetForm.type}
                      onChange={(event) =>
                        setAssetForm((current) => ({
                          ...current,
                          type: event.target.value as
                            | "image"
                            | "video"
                            | "book"
                            | "document"
                        }))
                      }
                      className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
                    >
                      {["image", "video", "book", "document"].map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                    <Input
                      value={assetForm.title}
                      placeholder="Asset title"
                      onChange={(event) =>
                        setAssetForm((current) => ({
                          ...current,
                          title: event.target.value
                        }))
                      }
                    />
                    <Input
                      value={assetForm.fileName}
                      placeholder="File name"
                      onChange={(event) =>
                        setAssetForm((current) => ({
                          ...current,
                          fileName: event.target.value
                        }))
                      }
                    />
                    <Input
                      value={assetForm.url}
                      placeholder="YouTube, Vimeo, Google Drive, Cloudinary, or file URL"
                      onChange={(event) =>
                        setAssetForm((current) => ({
                          ...current,
                          url: event.target.value
                        }))
                      }
                    />
                    <Button onClick={() => void addManualAsset()} disabled={uploadingAsset === "manual"}>
                      {uploadingAsset === "manual" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                      Record
                    </Button>
                  </div>
                ) : null}
                {assetUploadMessage ? (
                  <div className="flex items-center gap-2 rounded-md border border-[hsl(var(--border))] p-3 text-sm text-[hsl(var(--muted-foreground))]">
                    <Cloud className="size-4 text-[hsl(var(--primary))]" />
                    {assetUploadMessage}
                  </div>
                ) : null}
                <div className="grid gap-3 md:grid-cols-2">
                  {selectedAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="grid gap-3 rounded-md border border-[hsl(var(--border))] p-3 text-sm"
                    >
                      <div className="flex gap-3">
                        {asset.thumbnailUrl ? (
                          <Image
                            src={asset.thumbnailUrl}
                            alt=""
                            width={96}
                            height={64}
                            className="h-16 w-24 rounded-md border border-[hsl(var(--border))] object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-24 items-center justify-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                            {asset.type === "video" ? <Video className="size-5" /> : <FileText className="size-5" />}
                          </div>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap gap-2">
                            <Badge>{asset.provider ?? "local"}</Badge>
                            <Badge>{asset.type}</Badge>
                            {asset.status ? <Badge>{asset.status}</Badge> : null}
                          </span>
                          <span className="mt-2 block truncate font-medium">{asset.title}</span>
                          <span className="mt-1 block truncate text-[hsl(var(--muted-foreground))]">
                            {asset.fileName}
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {asset.type === "video" ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                selectedCourse &&
                                updateCourse(selectedCourse.slug, {
                                  trailerUrl: asset.embedUrl || asset.playbackUrl || asset.url
                                })
                              }
                            >
                              <PlayCircle className="size-4" />
                              Set preview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addLessonFromAsset(asset.id, asset.type, asset.title, assetPrimaryUrl(asset))}
                            >
                              <Plus className="size-4" />
                              Add lesson
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addLessonFromAsset(asset.id, asset.type, asset.title, assetPrimaryUrl(asset))}
                            >
                              <Plus className="size-4" />
                              Add lesson
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link href={asset.url} target="_blank">
                                <ExternalLink className="size-4" />
                                Open
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void navigator.clipboard?.writeText(asset.url)}
                            >
                              <Copy className="size-4" />
                              Copy
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCourseAsset(asset.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {studioView === "ai" ? (
            <Card>
              <CardHeader>
                <CardTitle>AI quiz and test generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedCourse ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Create or select a course first.
                  </p>
                ) : null}
                {selectedCourse ? (
                  <div className="grid gap-3 rounded-lg border border-[hsl(var(--border))] p-4 md:grid-cols-6">
                    <Input
                      value={quizForm.title}
                      onChange={(event) => setQuizForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Quiz title"
                      className="md:col-span-2"
                    />
                    <select
                      value={quizForm.kind}
                      onChange={(event) => setQuizForm((current) => ({ ...current, kind: event.target.value as "quiz" | "test" }))}
                      className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
                    >
                      <option value="quiz">quiz</option>
                      <option value="test">test</option>
                    </select>
                    <select
                      value={quizForm.chapterId}
                      onChange={(event) => setQuizForm((current) => ({ ...current, chapterId: event.target.value }))}
                      className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
                    >
                      <option value="">First chapter</option>
                      {selectedChapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.id}>
                          {chapter.title}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={quizForm.passingScore}
                      onChange={(event) => setQuizForm((current) => ({ ...current, passingScore: event.target.value }))}
                      placeholder="Pass %"
                      inputMode="numeric"
                    />
                    <Input
                      value={quizForm.count}
                      onChange={(event) => setQuizForm((current) => ({ ...current, count: event.target.value }))}
                      placeholder="Questions"
                      inputMode="numeric"
                    />
                    <div className="flex flex-wrap gap-2 md:col-span-6">
                      <Button onClick={addManualQuiz}>
                        <ClipboardCheck className="size-4" />
                        Create empty quiz
                      </Button>
                      <Button onClick={() => void generateAIQuiz()} disabled={aiQuizLoading}>
                        {aiQuizLoading ? <Loader2 className="size-4 animate-spin" /> : <Brain className="size-4" />}
                        Generate with MrCreativist.AI
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => selectedCourse && generateCourseQuiz(selectedCourse.slug, quizForm.kind)}
                      >
                        <Sparkles className="size-4" />
                        Quick fallback
                      </Button>
                    </div>
                  </div>
                ) : null}
                {selectedCourse ? (
                  <div className="grid gap-3 rounded-lg border border-dashed border-[hsl(var(--border))] p-4 md:grid-cols-6">
                    <select
                      value={questionForm.quizId}
                      onChange={(event) => setQuestionForm((current) => ({ ...current, quizId: event.target.value }))}
                      className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm md:col-span-2"
                    >
                      <option value="">Choose quiz</option>
                      {selectedQuizzes.map((quiz) => (
                        <option key={quiz.id} value={quiz.id}>
                          {quiz.title}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={questionForm.question}
                      onChange={(event) => setQuestionForm((current) => ({ ...current, question: event.target.value }))}
                      placeholder="Question"
                      className="md:col-span-4"
                    />
                    {[["optionA", "A"], ["optionB", "B"], ["optionC", "C"], ["optionD", "D"]].map(([field, label]) => (
                      <Input
                        key={field}
                        value={questionForm[field as "optionA" | "optionB" | "optionC" | "optionD"]}
                        onChange={(event) => setQuestionForm((current) => ({ ...current, [field]: event.target.value }))}
                        placeholder={`Option ${label}`}
                        className="md:col-span-3"
                      />
                    ))}
                    <select
                      value={questionForm.correctIndex}
                      onChange={(event) => setQuestionForm((current) => ({ ...current, correctIndex: event.target.value }))}
                      className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
                    >
                      {[0, 1, 2, 3].map((index) => (
                        <option key={index} value={index}>
                          Correct {String.fromCharCode(65 + index)}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={questionForm.explanation}
                      onChange={(event) => setQuestionForm((current) => ({ ...current, explanation: event.target.value }))}
                      placeholder="Explanation"
                      className="md:col-span-4"
                    />
                    <Button onClick={addManualQuestion}>
                      <Plus className="size-4" />
                      Add question
                    </Button>
                  </div>
                ) : null}
                <div className="grid gap-4">
                  {selectedQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="rounded-lg border border-[hsl(var(--border))] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <Badge>{quiz.kind}</Badge>
                            <Badge>{quiz.passingScore}% pass</Badge>
                            <Badge>{quiz.maxAttempts} attempts</Badge>
                          </div>
                          <Input
                            value={quiz.title}
                            onChange={(event) => updateCourseQuiz(quiz.id, { title: event.target.value })}
                            className="mt-3 font-semibold"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCourseQuiz(quiz.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {quiz.questions.map((question) => (
                          <div
                            key={question.id}
                            className="rounded-md border border-[hsl(var(--border))] p-3 text-sm"
                          >
                            <Input
                              value={question.question}
                              onChange={(event) => updateCourseQuizQuestion(quiz.id, question.id, { question: event.target.value })}
                              className="font-medium"
                            />
                            <div className="mt-3 grid gap-2">
                              {question.options.map((option, index) => (
                                <label key={`${question.id}-${index}`} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct-${question.id}`}
                                    checked={question.correctIndex === index}
                                    onChange={() => updateCourseQuizQuestion(quiz.id, question.id, { correctIndex: index })}
                                  />
                                  <Input
                                    value={option}
                                    onChange={(event) => {
                                      const nextOptions = [...question.options];
                                      nextOptions[index] = event.target.value;
                                      updateCourseQuizQuestion(quiz.id, question.id, { options: nextOptions });
                                    }}
                                  />
                                </label>
                              ))}
                            </div>
                            <Input
                              value={question.explanation}
                              onChange={(event) => updateCourseQuizQuestion(quiz.id, question.id, { explanation: event.target.value })}
                              className="mt-3"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3"
                              onClick={() => deleteCourseQuizQuestion(quiz.id, question.id)}
                            >
                              <Trash2 className="size-4" />
                              Remove question
                            </Button>
                          </div>
                        ))}
                      </div>
                      {quiz.questions.length ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-4"
                          onClick={() =>
                            replaceCourseQuizQuestions(
                              quiz.id,
                              quiz.questions.map((question) => ({
                                question: question.question,
                                options: question.options,
                                correctIndex: question.correctIndex,
                                explanation: question.explanation
                              }))
                            )
                          }
                        >
                          <Save className="size-4" />
                          Save question bank
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {studioView === "students" ? (
            <Card>
              <CardHeader>
                <CardTitle>Student learning tracker</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedCourse ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Create or select a course first.
                  </p>
                ) : null}
                {selectedStudents.map((student) => {
                  const completion = selectedChapters.length
                    ? Math.round(
                        (student.completedChapterIds.length /
                          selectedChapters.length) *
                          100
                      )
                    : 0;
                  const blockedByScore = selectedChapters.some(
                    (chapter) =>
                      chapter.isLocked &&
                      student.averageScore < chapter.requiredScore
                  );

                  return (
                    <div
                      key={student.id}
                      className="grid gap-3 rounded-lg border border-[hsl(var(--border))] p-4 lg:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Badge>{completion}% complete</Badge>
                          <Badge>{student.averageScore}% average score</Badge>
                          <Badge>
                            {student.isBlocked || blockedByScore
                              ? "Blocked"
                              : "Unblocked"}
                          </Badge>
                        </div>
                        <h3 className="mt-3 font-semibold">
                          {student.studentName}
                        </h3>
                        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                          {student.completedChapterIds.length} of{" "}
                          {selectedChapters.length} chapters completed.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateStudentRecord(
                              selectedCourse?.slug ?? "",
                              student.id,
                              {
                                averageScore: Math.min(
                                  100,
                                  student.averageScore + 10
                                ),
                                isBlocked: false
                              }
                            )
                          }
                        >
                          <BarChart3 className="size-4" />
                          Grade +10
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateStudentRecord(
                              selectedCourse?.slug ?? "",
                              student.id,
                              {
                                isBlocked: !student.isBlocked
                              }
                            )
                          }
                        >
                          {student.isBlocked ? (
                            <Unlock className="size-4" />
                          ) : (
                            <Lock className="size-4" />
                          )}
                          {student.isBlocked ? "Unblock" : "Block"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : null}

          {studioView === "publish" ? (
            <Card>
              <CardHeader>
                <CardTitle>Publishing gate</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
                <div className="space-y-3">
                  {checklistItem("Course setup saved", Boolean(selectedCourse))}
                  {checklistItem(
                    "At least 2 chapters",
                    selectedChapters.length >= 2
                  )}
                  {checklistItem(
                    "Video upload attached",
                    selectedAssets.some((asset) => asset.type === "video")
                  )}
                  {checklistItem(
                    "Chapter quiz generated",
                    selectedQuizzes.some((quiz) => quiz.kind === "quiz")
                  )}
                  {checklistItem(
                    "Final test generated",
                    selectedQuizzes.some((quiz) => quiz.kind === "test")
                  )}
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] p-4">
                  <p className="font-semibold">
                    {selectedCourse?.title ?? "No course selected"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                    Publishing makes this course visible on the public course
                    catalog. Learners can enroll, progress is tracked, and
                    certificates unlock after high completion.
                  </p>
                  <div className="mt-4 grid gap-2">
                    <Button
                      disabled={!selectedCourse || !publishReady}
                      onClick={() =>
                        selectedCourse &&
                        updateCourseStatus(selectedCourse.slug, "published")
                      }
                    >
                      <Send className="size-4" />
                      Publish course
                    </Button>
                    <Button
                      disabled={!selectedCourse}
                      variant="outline"
                      onClick={() =>
                        selectedCourse &&
                        updateCourseStatus(selectedCourse.slug, "draft")
                      }
                    >
                      <Save className="size-4" />
                      Move to draft
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export function ProductManager({ initialProducts = [] }: { initialProducts?: ProductCatalogRow[] }) {
  const createdProducts = usePlatformStore((state) => state.createdProducts);
  const updateProduct = usePlatformStore((state) => state.updateProduct);
  const updateProductStatus = usePlatformStore(
    (state) => state.updateProductStatus
  );
  const deleteProduct = usePlatformStore((state) => state.deleteProduct);
  const [editingSlug, setEditingSlug] = useState("");
  const [editForm, setEditForm] = useState({ name: "", category: "", price: "", stock: "" });
  const rows = useMemo(
    () => [
      ...createdProducts,
      ...initialProducts.map((product) => ({
        ...product,
        status: "base" as const,
        createdAt: "Database"
      }))
    ],
    [createdProducts, initialProducts]
  );
  const editingProduct = createdProducts.find((product) => product.slug === editingSlug);

  function startProductEdit(product: PlatformProductDraft) {
    setEditingSlug(product.slug);
    setEditForm({
      name: product.name,
      category: product.category,
      price: product.price.replace(/^\$/, ""),
      stock: String(product.stock)
    });
  }

  function saveProductEdit() {
    if (!editingProduct) return;
    updateProduct(editingProduct.slug, {
      name: editForm.name.trim() || editingProduct.name,
      category: editForm.category.trim() || editingProduct.category,
      price: price(editForm.price),
      stock: Number(editForm.stock) || 0
    });
    setEditingSlug("");
  }

  function shareProduct(slug: string) {
    void navigator.clipboard?.writeText(`${window.location.origin}/marketplace/product/${slug}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
          <p className="mt-2 text-[hsl(var(--muted-foreground))]">
            Create, publish, unpublish, and delete seller products.
          </p>
        </div>
        <Button asChild>
          <Link href="/seller/products/create">
            <Plus className="size-4" />
            Add product
          </Link>
        </Button>
      </div>
      {editingProduct ? (
        <Card>
          <CardHeader>
            <CardTitle>Quick edit product</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_10rem_8rem_auto]">
            <Input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} />
            <Input value={editForm.category} onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))} />
            <Input value={editForm.price} onChange={(event) => setEditForm((current) => ({ ...current, price: event.target.value }))} inputMode="decimal" />
            <Input value={editForm.stock} onChange={(event) => setEditForm((current) => ({ ...current, stock: event.target.value }))} inputMode="numeric" />
            <div className="flex gap-2">
              <Button onClick={saveProductEdit}>
                <Save className="size-4" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setEditingSlug("")}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {rows.length > 0 ? rows.map((product) => (
                <tr key={product.slug}>
                  <td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4 text-[hsl(var(--muted-foreground))]">
                    {product.category}
                  </td>
                  <td className="p-4">
                    <PriceDisplay price={product.price} className="text-sm" />
                  </td>
                  <td className="p-4">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      {product.status === "base" ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href="/marketplace">Public</Link>
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startProductEdit(product as PlatformProductDraft)}
                          >
                            <Edit3 className="size-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateProductStatus(
                                product.slug,
                                product.status === "published"
                                  ? "draft"
                                  : "published"
                              )
                            }
                          >
                            {product.status === "published" ? (
                              <Archive className="size-4" />
                            ) : (
                              <Send className="size-4" />
                            )}
                            {product.status === "published"
                              ? "Unpublish"
                              : "Publish"}
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/marketplace/product/${product.slug}`}>
                              <Eye className="size-4" />
                              View
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => shareProduct(product.slug)}
                          >
                            <Share2 className="size-4" />
                            Share
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteProduct(product.slug)}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="p-6 text-center text-[hsl(var(--muted-foreground))]" colSpan={5}>
                    No products found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export function CourseManager({ initialCourses = [] }: { initialCourses?: CourseCatalogRow[] }) {
  const createdCourses = usePlatformStore((state) => state.createdCourses);
  const updateCourseStatus = usePlatformStore(
    (state) => state.updateCourseStatus
  );
  const deleteCourse = usePlatformStore((state) => state.deleteCourse);
  const rows = useMemo(
    () => [
      ...createdCourses,
      ...initialCourses.map((course) => ({
        ...course,
        status: "base" as const,
        createdAt: "Database"
      }))
    ],
    [createdCourses, initialCourses]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Courses</h1>
          <p className="mt-2 text-[hsl(var(--muted-foreground))]">
            Create, publish, unpublish, and delete instructor courses.
          </p>
        </div>
        <Button asChild>
          <Link href="/instructor/courses/create">
            <Plus className="size-4" />
            Create course
          </Link>
        </Button>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="p-4 font-medium">Course</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {rows.length > 0 ? rows.map((course) => (
                <tr key={course.slug}>
                  <td className="p-4 font-medium">
                    <span className="inline-flex items-center gap-2">
                      <BookOpen className="size-4 text-[hsl(var(--primary))]" />
                      {course.title}
                    </span>
                  </td>
                  <td className="p-4 text-[hsl(var(--muted-foreground))]">
                    {course.category}
                  </td>
                  <td className="p-4">
                    <PriceDisplay price={course.price} className="text-sm" />
                  </td>
                  <td className="p-4">
                    <StatusBadge status={course.status} />
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      {course.status === "base" ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href="/courses">Public</Link>
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateCourseStatus(
                                course.slug,
                                course.status === "published"
                                  ? "draft"
                                  : "published"
                              )
                            }
                          >
                            {course.status === "published" ? (
                              <Archive className="size-4" />
                            ) : (
                              <Send className="size-4" />
                            )}
                            {course.status === "published"
                              ? "Unpublish"
                              : "Publish"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteCourse(course.slug)}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="p-6 text-center text-[hsl(var(--muted-foreground))]" colSpan={5}>
                    No courses found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
