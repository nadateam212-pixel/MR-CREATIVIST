"use client";

import { type SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  CornerDownRight,
  CreditCard,
  Download,
  FileText,
  GraduationCap,
  Heart,
  Image as ImageIcon,
  Lock,
  MessageCircle,
  Pause,
  Play,
  QrCode,
  Send,
  Share2,
  Sparkles,
  SkipBack,
  SkipForward,
  Timer,
  Unlock,
  Users,
  Video
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SafeImage } from "@/components/ui/safe-image";
import { courseImageForCategory } from "@/lib/course-media";
import { videoSourceForUrl } from "@/lib/video-sources";

type CourseResource = {
  label: string;
  title?: string;
  type?: string;
  url: string;
  downloadable?: boolean;
};

type CourseLesson = {
  key: string;
  title: string;
  type: "video" | "article" | "image" | "quiz" | "assignment" | "download" | string;
  durationMinutes: number;
  videoUrl?: string;
  imageUrl?: string;
  quizQuestions?: {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
  }[];
  resources: CourseResource[];
  isPreview: boolean;
  summary: string;
};

type CourseModule = {
  key: string;
  title: string;
  description: string;
  lessons: CourseLesson[];
};

type FlatLesson = CourseLesson & {
  moduleKey: string;
  moduleTitle: string;
  moduleIndex: number;
  lessonIndex: number;
};

type CourseStructure = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  instructor: string;
  level: string;
  category: string;
  certificate: string;
  pricingType?: string;
  accessType?: string;
  likes?: number;
  shareCount?: number;
  commentCount?: number;
  replyCount?: number;
  image?: string;
  outcomes: string[];
  tools: string[];
  resources?: CourseResource[];
  modules: CourseModule[];
  flatLessons: FlatLesson[];
  totalLessons: number;
  totalMinutes: number;
};

type LearningProgressSnapshot = {
  completedLessonKeys: string[];
  currentLessonKey: string;
  progressPercent: number;
  status: string;
  certificateIssuedAt?: string | null;
  events: {
    lessonKey?: string;
    lessonTitle?: string;
    moduleTitle?: string;
    action: string;
    seconds?: number;
    score?: number;
    createdAt?: string;
  }[];
  studySecondsByLesson?: Record<string, number>;
  lessonPositions?: Record<string, number>;
  watchedSecondsByLesson?: Record<string, number>;
  studySecondsByModule?: Record<string, number>;
  moduleRequiredSeconds?: Record<string, number>;
  totalStudySeconds?: number;
  quizAttempts?: Record<string, { score: number; passed: boolean; at?: string }>;
};

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
};

type CertificateResult = {
  courseSlug: string;
  courseTitle: string;
  verificationCode: string;
  issuedAt: string;
  template: string;
};

type QuizResult = {
  score: number;
  correct: number;
  total: number;
  passingScore: number;
  passed: boolean;
  corrections: {
    id: string;
    selectedIndex: number | null;
    correctIndex: number;
    correctAnswer: string;
    explanation?: string;
  }[];
};

type CommunityMessage = {
  id: string;
  parentId?: string | null;
  senderId: string;
  senderName: string;
  senderRole?: string;
  content: string;
  likes?: number;
  liked?: boolean;
  replies?: CommunityMessage[];
  replyCount?: number;
  isInstructor?: boolean;
  createdAt?: string;
};

type CourseEngagement = {
  likes: number;
  liked: boolean;
  shareCount: number;
  comments: number;
  replies: number;
  commentCount: number;
};

function embeddedVideoClass() {
  return "absolute inset-0 h-full w-full border-0";
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function formatClock(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;

  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function formatStudyTime(seconds: number) {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours > 0) return rest ? `${hours}h ${rest}m` : `${hours}h`;
  return `${minutes}m`;
}

function compactCount(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Math.max(0, value));
}

function communityTotal(items: CommunityMessage[]) {
  return items.reduce((total, item) => total + 1 + (item.replies?.length ?? 0), 0);
}

function updateCommunityLike(items: CommunityMessage[], messageId: string, liked: boolean, likes: number): CommunityMessage[] {
  return items.map((item) => {
    if (item.id === messageId) return { ...item, liked, likes };

    return {
      ...item,
      replies: item.replies?.length ? updateCommunityLike(item.replies, messageId, liked, likes) : item.replies
    };
  });
}

function findCommunityMessage(items: CommunityMessage[], messageId: string): CommunityMessage | null {
  for (const item of items) {
    if (item.id === messageId) return item;
    const reply = item.replies?.find((replyItem) => replyItem.id === messageId);
    if (reply) return reply;
  }

  return null;
}

function optimisticCommunityLike(items: CommunityMessage[], messageId: string) {
  const target = findCommunityMessage(items, messageId);
  if (!target) return items;

  const liked = !Boolean(target.liked);
  const likes = Math.max(0, Number(target.likes ?? 0) + (liked ? 1 : -1));

  return updateCommunityLike(items, messageId, liked, likes);
}

function lessonIcon(type: string) {
  if (type === "video") return Video;
  if (type === "image") return ImageIcon;
  if (type === "article") return FileText;
  if (type === "quiz") return ClipboardCheck;
  if (type === "assignment") return GraduationCap;
  if (type === "download") return Download;

  return BookOpen;
}

function certificatePdfUrl(certificate: CertificateResult, course: CourseStructure, learnerName: string, download = false) {
  const params = new URLSearchParams({
    student: learnerName,
    course: course.title,
    code: certificate.verificationCode,
    instructor: course.instructor,
    template: certificate.template ?? "Professional",
    hours: `${Math.max(1, Math.round(course.totalMinutes / 60))} hours`,
    score: "100%"
  });
  if (download) params.set("download", "1");

  return `/api/certificates/pdf?${params.toString()}`;
}

function fallbackQuizQuestions(course: CourseStructure, lesson?: FlatLesson): QuizQuestion[] {
  if (lesson?.quizQuestions?.length) {
    return lesson.quizQuestions.map((question, index) => ({
      id: question.id || `lesson-question-${index}`,
      question: question.question,
      options: question.options,
      correctIndex: question.correctIndex
    }));
  }

  const seeds = course.outcomes.length ? course.outcomes : ["Apply the lesson", "Complete the practice", "Verify your result"];

  return seeds.slice(0, 4).map((outcome, index) => ({
    id: `fallback-${index}`,
    question: `Which action best proves "${outcome}"?`,
    options: [`Apply ${outcome.toLowerCase()} in a project`, "Skip practice", "Memorize only the title"],
    correctIndex: 0
  }));
}

function parsePlayerMessage(data: unknown) {
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  return typeof data === "object" && data !== null ? (data as Record<string, unknown>) : null;
}

export function CourseLearningWorkspace({
  course,
  initialProgress,
  enrolled = true,
  learnerName
}: {
  course: CourseStructure;
  initialProgress: LearningProgressSnapshot;
  enrolled?: boolean;
  learnerName: string;
}) {
  const firstLessonKey = course.flatLessons[0]?.key ?? "";
  const initialActiveKey = initialProgress.currentLessonKey || firstLessonKey;
  const initialResumeSecond = Math.max(0, Number(initialProgress.lessonPositions?.[initialActiveKey] ?? 0));
  const initialWatchedSecond = Math.max(0, Number(initialProgress.watchedSecondsByLesson?.[initialActiveKey] ?? 0));
  const [completedLessonKeys, setCompletedLessonKeys] = useState(initialProgress.completedLessonKeys ?? []);
  const [activeKey, setActiveKey] = useState(initialActiveKey);
  const [serverProgressPercent, setServerProgressPercent] = useState(initialProgress.progressPercent ?? 0);
  const [savingKey, setSavingKey] = useState("");
  const [message, setMessage] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [certificate, setCertificate] = useState<CertificateResult | null>(null);
  const [studySecondsByLesson, setStudySecondsByLesson] = useState<Record<string, number>>(
    initialProgress.studySecondsByLesson ?? {}
  );
  const [lessonPositions, setLessonPositions] = useState<Record<string, number>>(initialProgress.lessonPositions ?? {});
  const [watchedSecondsByLesson, setWatchedSecondsByLesson] = useState<Record<string, number>>(
    initialProgress.watchedSecondsByLesson ?? {}
  );
  const [activeStudySeconds, setActiveStudySeconds] = useState(0);
  const [communityMessages, setCommunityMessages] = useState<CommunityMessage[]>([]);
  const [communityDraft, setCommunityDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState("");
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState("");
  const [communityActionKey, setCommunityActionKey] = useState("");
  const [engagement, setEngagement] = useState<CourseEngagement>({
    likes: Number(course.likes ?? 0),
    liked: false,
    shareCount: Number(course.shareCount ?? 0),
    comments: Math.max(0, Number(course.commentCount ?? 0) - Number(course.replyCount ?? 0)),
    replies: Number(course.replyCount ?? 0),
    commentCount: Number(course.commentCount ?? 0)
  });
  const [engagementLoading, setEngagementLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const vimeoRef = useRef<HTMLIFrameElement | null>(null);
  const youtubeRef = useRef<HTMLIFrameElement | null>(null);
  const commentsSectionRef = useRef<HTMLDivElement | null>(null);
  const communityInputRef = useRef<HTMLTextAreaElement | null>(null);
  const studyDeltaRef = useRef(0);
  const maxWatchedSecondRef = useRef(initialWatchedSecond);
  const lastMediaSecondRef = useRef(initialResumeSecond);
  const lastSavedPositionRef = useRef(initialResumeSecond);
  const lastSavedWatchedRef = useRef(initialWatchedSecond);
  const [mediaPlaying, setMediaPlaying] = useState(false);
  const [mediaSeconds, setMediaSeconds] = useState(initialResumeSecond);
  const [mediaDuration, setMediaDuration] = useState(0);
  const vimeoNonce = 0;
  const [previewElapsedSeconds, setPreviewElapsedSeconds] = useState(0);
  const previewSecondsLimit = Math.max(30, Number(process.env.NEXT_PUBLIC_COURSE_PREVIEW_SECONDS ?? 120) || 120);
  const accessType =
    course.accessType ??
    (course.pricingType === "subscription" || course.pricingType === "manual"
      ? "premium"
      : course.pricingType === "free"
        ? "free"
        : "paid");
  const previewGateActive = !enrolled && accessType !== "free";
  const previewBlocked = previewGateActive && previewElapsedSeconds >= previewSecondsLimit;

  const completedSet = useMemo(() => new Set(completedLessonKeys), [completedLessonKeys]);
  const completedPercent = course.totalLessons
    ? Math.round((course.flatLessons.filter((lesson) => completedSet.has(lesson.key)).length / course.totalLessons) * 100)
    : 0;
  const progressPercent = Math.min(100, Math.max(serverProgressPercent, completedPercent));
  const activeLesson = course.flatLessons.find((lesson) => lesson.key === activeKey) ?? course.flatLessons[0];
  const activeIndex = course.flatLessons.findIndex((lesson) => lesson.key === activeLesson?.key);
  const previousLesson = activeIndex > 0 ? course.flatLessons[activeIndex - 1] : null;
  const nextLesson = course.flatLessons.find((lesson) => !completedSet.has(lesson.key) && lesson.key !== activeLesson?.key);
  const upcomingLessons = course.flatLessons
    .slice(Math.max(activeIndex + 1, 0))
    .concat(course.flatLessons.slice(0, Math.max(activeIndex, 0)))
    .filter((lesson) => lesson.key !== activeLesson?.key)
    .slice(0, 6);
  const effectiveStudySecondsByLesson = {
    ...studySecondsByLesson,
    ...(activeLesson
      ? {
          [activeLesson.key]: (studySecondsByLesson[activeLesson.key] ?? 0) + activeStudySeconds
        }
      : {})
  };
  const allComplete =
    progressPercent >= 100 &&
    course.modules.every((module) => {
      const lessonsComplete = module.lessons.every((lesson) => completedSet.has(lesson.key));

      return lessonsComplete;
    });
  const activeVideoSource = useMemo(
    () => {
      return videoSourceForUrl(
        activeLesson?.type === "video"
          ? activeLesson?.videoUrl
          : activeLesson?.videoUrl,
        {
          controls: false,
          nonce: vimeoNonce,
          playerId: `mrc-vimeo-${activeLesson?.key ?? "lesson"}`,
          origin: typeof window === "undefined" ? undefined : window.location.origin
        }
      );
    },
    [activeLesson?.key, activeLesson?.type, activeLesson?.videoUrl, vimeoNonce]
  );
  const videoRequiredSeconds = useCallback(
    (lesson: FlatLesson | null | undefined = activeLesson) => {
      if (!lesson || lesson.type !== "video") return 0;

      const measuredSeconds = lesson.key === activeLesson?.key ? Math.floor(mediaDuration) : 0;
      if (measuredSeconds > 0) return Math.max(1, measuredSeconds - 2);

      const lessonSeconds = Math.round(Number(lesson.durationMinutes ?? 0) * 60);
      return lessonSeconds > 0 ? Math.max(1, lessonSeconds - 2) : 1;
    },
    [activeLesson, mediaDuration]
  );
  const activeWatchedSeconds = activeLesson
    ? Math.max(
        Number(watchedSecondsByLesson[activeLesson.key] ?? 0),
        activeLesson.type === "video" ? activeStudySeconds : 0
      )
    : 0;
  const activeVideoComplete =
    !activeLesson ||
    activeLesson.type !== "video" ||
    completedSet.has(activeLesson.key) ||
    activeWatchedSeconds >= videoRequiredSeconds(activeLesson);
  const canAdvanceFromActive = Boolean(activeLesson && activeVideoComplete);
  const stopMedia = useCallback(() => {
    videoRef.current?.pause();
    if (activeVideoSource.provider === "youtube") {
      youtubeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
        "https://www.youtube-nocookie.com"
      );
    } else if (activeVideoSource.provider === "vimeo") {
      vimeoRef.current?.contentWindow?.postMessage(
        JSON.stringify({ method: "pause" }),
        "https://player.vimeo.com"
      );
    } else if (iframeRef.current && activeVideoSource.embedUrl) {
      iframeRef.current.src = activeVideoSource.embedUrl;
    }
  }, [activeVideoSource.embedUrl, activeVideoSource.provider]);

  useEffect(() => {
    if (!previewGateActive || previewBlocked) return undefined;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      setPreviewElapsedSeconds((current) => Math.min(previewSecondsLimit, current + 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [previewBlocked, previewGateActive, previewSecondsLimit]);

  useEffect(() => {
    if (!previewBlocked) return;
    stopMedia();
    const timer = window.setTimeout(() => setMediaPlaying(false), 0);
    return () => window.clearTimeout(timer);
  }, [previewBlocked, stopMedia]);

  function moduleComplete(moduleKey: string, completed = completedSet) {
    const courseModule = course.modules.find((item) => item.key === moduleKey);

    return Boolean(courseModule?.lessons.length) && Boolean(courseModule?.lessons.every((lesson) => completed.has(lesson.key)));
  }

  function moduleRequiredSeconds(moduleKey: string) {
    const courseModule = course.modules.find((item) => item.key === moduleKey);

    return Math.max(
      0,
      (courseModule?.lessons ?? []).reduce((total, lesson) => total + Number(lesson.durationMinutes ?? 0), 0) * 60
    );
  }

  function moduleStudySeconds(moduleKey: string, lessonSeconds = effectiveStudySecondsByLesson) {
    const courseModule = course.modules.find((item) => item.key === moduleKey);

    return (courseModule?.lessons ?? []).reduce((total, lesson) => total + Number(lessonSeconds[lesson.key] ?? 0), 0);
  }

  function moduleUnlocked(moduleIndex: number, completed = completedSet) {
    if (moduleIndex <= 0) return true;

    return course.modules.slice(0, moduleIndex).every((module) => moduleComplete(module.key, completed));
  }

  function lessonUnlocked(key: string, completed = completedSet) {
    const lesson = course.flatLessons.find((item) => item.key === key);

    return Boolean(lesson && (completed.has(key) || moduleUnlocked(lesson.moduleIndex, completed)));
  }

  function nextAvailableLesson(completed: Set<string>, fallbackKey = activeLesson?.key ?? firstLessonKey) {
    return (
      course.flatLessons.find((lesson) => !completed.has(lesson.key) && lessonUnlocked(lesson.key, completed))?.key ??
      fallbackKey
    );
  }

  function localCertificateResult() {
    const issuedAt = new Date().toISOString();
    const slugCode = course.slug
      .split("-")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 5) || "MRC";

    return {
      courseSlug: course.slug,
      courseTitle: course.title,
      verificationCode: `MRC-${slugCode}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      issuedAt,
      template: "Professional"
    };
  }

  function activateLesson(key: string) {
    const savedPosition = Math.max(0, Number(lessonPositions[key] ?? 0));
    setActiveKey(key);
    setMediaPlaying(false);
    setMediaSeconds(savedPosition);
    setMediaDuration(0);
    setActiveStudySeconds(0);
    maxWatchedSecondRef.current = Math.max(0, Number(watchedSecondsByLesson[key] ?? 0));
    lastMediaSecondRef.current = savedPosition;
    lastSavedPositionRef.current = savedPosition;
    lastSavedWatchedRef.current = maxWatchedSecondRef.current;
    studyDeltaRef.current = 0;
    setQuizResult(null);
  }

  useEffect(() => {
    if (!activeLesson) return undefined;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      if (activeLesson.type === "video" && activeVideoSource.canUseToolbar && !mediaPlaying) return;

      setActiveStudySeconds((current) => current + 1);
      studyDeltaRef.current += 1;
      if (activeLesson.type === "video" && !activeVideoSource.canUseToolbar) {
        setMediaSeconds((current) => current + 1);
        setLessonPositions((current) => ({
          ...current,
          [activeLesson.key]: Math.max(0, Number(current[activeLesson.key] ?? 0) + 1)
        }));
        setWatchedSecondsByLesson((current) => ({
          ...current,
          [activeLesson.key]: Math.max(Number(current[activeLesson.key] ?? 0), Number(current[activeLesson.key] ?? 0) + 1)
        }));
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeLesson, activeVideoSource.canUseToolbar, mediaPlaying]);

  async function persistLesson(
    lesson: FlatLesson,
    action: LearningProgressSnapshot["events"][number]["action"],
    options: { seconds?: number; score?: number; complete?: boolean; position?: number; watchedSeconds?: number; duration?: number; silent?: boolean } = {}
  ) {
    if (previewGateActive) {
      if (previewBlocked || options.complete !== false) {
        setPreviewElapsedSeconds(previewSecondsLimit);
        setMessage("Enroll or pay for this course to continue learning and save progress.");
        toast.message("Enroll to unlock the full course.");
      }

      return {
        completedLessonKeys,
        currentLessonKey: lesson.key,
        progressPercent,
        status: "preview",
        events: []
      };
    }

    setSavingKey(lesson.key);
    setMessage("");
    const shouldComplete = options.complete !== false;
    const optimisticCompleted = new Set(completedLessonKeys);
    if (shouldComplete) optimisticCompleted.add(lesson.key);
    const optimisticNextKey = shouldComplete ? nextAvailableLesson(optimisticCompleted, lesson.key) : lesson.key;

    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(course.slug)}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonKey: lesson.key,
          currentLessonKey: optimisticNextKey,
          action,
          seconds: options.seconds,
          position: options.position,
          watchedSeconds: options.watchedSeconds,
          duration: options.duration,
          score: options.score
        })
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Progress could not be saved.");
      }

      setCompletedLessonKeys(data.progress.completedLessonKeys ?? []);
      setServerProgressPercent(data.progress.progressPercent ?? 0);
      setStudySecondsByLesson(data.progress.studySecondsByLesson ?? studySecondsByLesson);
      setLessonPositions(data.progress.lessonPositions ?? lessonPositions);
      setWatchedSecondsByLesson(data.progress.watchedSecondsByLesson ?? watchedSecondsByLesson);
      if (options.complete === false) {
        setActiveKey(data.progress.currentLessonKey || optimisticNextKey);
      } else {
        activateLesson(data.progress.currentLessonKey || optimisticNextKey);
      }
      if (!options.silent) setMessage(options.complete === false ? "Activity saved." : "Lesson completed and saved.");
      if (options.complete !== false && !options.silent) {
        toast.success("Lesson completed and saved.");
      }

      return data.progress as LearningProgressSnapshot;
    } catch (error) {
      const nextCompletedKeys = Array.from(optimisticCompleted);
      const nextPercent = course.totalLessons ? Math.round((nextCompletedKeys.length / course.totalLessons) * 100) : 0;

      setCompletedLessonKeys(nextCompletedKeys);
      setStudySecondsByLesson((current) => ({
        ...current,
        [lesson.key]: (current[lesson.key] ?? 0) + Number(options.seconds ?? 0)
      }));
      if (typeof options.position === "number") {
        setLessonPositions((current) => ({ ...current, [lesson.key]: Math.max(0, Math.floor(options.position ?? 0)) }));
      }
      if (typeof options.watchedSeconds === "number") {
        setWatchedSecondsByLesson((current) => ({
          ...current,
          [lesson.key]: Math.max(Number(current[lesson.key] ?? 0), Math.floor(options.watchedSeconds ?? 0))
        }));
      }
      setServerProgressPercent(nextPercent);
      if (shouldComplete) {
        activateLesson(optimisticNextKey);
      }
      const nextMessage =
        shouldComplete
          ? "Lesson completed locally. The course will sync when the database record is available."
          : error instanceof Error
            ? error.message
            : "Activity could not be saved.";
      if (!options.silent) setMessage(nextMessage);
      if (shouldComplete && !options.silent) {
        toast.success("Lesson completed locally.");
      } else if (error instanceof Error && !options.silent) {
        toast.error(error.message);
      }
      return {
        completedLessonKeys: nextCompletedKeys,
        currentLessonKey: optimisticNextKey,
        progressPercent: nextPercent,
        status: nextPercent >= 100 ? "completed" : "active",
        events: []
      };
    } finally {
      setSavingKey("");
    }
  }

  async function openLesson(lesson: FlatLesson) {
    if (previewBlocked) {
      setMessage("Enroll or pay for this course to continue after the preview.");
      return;
    }

    if (!lessonUnlocked(lesson.key)) return;

    if (activeLesson?.type === "video") {
      await savePlaybackPosition({ force: true });
    }
    activateLesson(lesson.key);
    if (!completedSet.has(lesson.key)) {
      await persistLesson(lesson, "viewed", { complete: false });
    }
  }

  async function saveStudyTime() {
    if (!activeLesson) return;

    const seconds = Math.max(studyDeltaRef.current, activeStudySeconds);
    if (seconds <= 0) {
      setMessage("Spend a little time in this lesson before saving study time.");
      return;
    }

    const progress = await persistLesson(activeLesson, "studied", { seconds, complete: false });

    studyDeltaRef.current = 0;
    setActiveStudySeconds(0);
    setStudySecondsByLesson(progress.studySecondsByLesson ?? {});
    toast.success("Study time saved.");
  }

  function currentPlaybackSnapshot() {
    const position = Math.max(0, Math.floor(videoRef.current?.currentTime ?? mediaSeconds));
    const duration = Math.max(0, Math.floor(videoRef.current?.duration || mediaDuration || 0));
    const watchedSeconds = activeLesson
      ? Math.max(
          Number(watchedSecondsByLesson[activeLesson.key] ?? 0),
          Math.floor(maxWatchedSecondRef.current),
          activeLesson.type === "video" ? activeStudySeconds : 0
        )
      : 0;

    return { position, duration, watchedSeconds };
  }

  async function savePlaybackPosition(options: { force?: boolean } = {}) {
    if (!activeLesson || activeLesson.type !== "video" || previewGateActive) return;

    const snapshot = currentPlaybackSnapshot();
    const positionDelta = Math.abs(snapshot.position - lastSavedPositionRef.current);
    const watchedDelta = Math.abs(snapshot.watchedSeconds - lastSavedWatchedRef.current);
    if (!options.force && positionDelta < 8 && watchedDelta < 8) return;
    if (!snapshot.position && !snapshot.watchedSeconds) return;

    lastSavedPositionRef.current = snapshot.position;
    lastSavedWatchedRef.current = snapshot.watchedSeconds;
    await persistLesson(activeLesson, "position", {
      complete: false,
      position: snapshot.position,
      watchedSeconds: snapshot.watchedSeconds,
      duration: snapshot.duration,
      silent: true
    });
  }

  useEffect(() => {
    if (!activeLesson || activeLesson.type !== "video" || previewGateActive) return undefined;

    const timer = window.setInterval(() => {
      void savePlaybackPosition();
    }, 12000);

    function flushPlaybackPosition() {
      void savePlaybackPosition({ force: true });
    }

    function flushWhenHidden() {
      if (document.visibilityState === "hidden") flushPlaybackPosition();
    }

    window.addEventListener("pagehide", flushPlaybackPosition);
    document.addEventListener("visibilitychange", flushWhenHidden);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pagehide", flushPlaybackPosition);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      flushPlaybackPosition();
    };
    // Save loop follows the active lesson and current playback refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLesson?.key, previewGateActive]);

  async function completeActive(action: LearningProgressSnapshot["events"][number]["action"], score?: number) {
    if (!activeLesson) return;
    if (previewGateActive) {
      setPreviewElapsedSeconds(previewSecondsLimit);
      setMessage("Enroll or pay for this course to complete lessons and save progress.");
      toast.message("Enroll to unlock progress tracking.");
      return;
    }

    if (activeLesson.type === "quiz" && action !== "quiz_passed") {
      const nextMessage = "Submit the quiz and score at least 75% to complete this lesson.";
      setMessage(nextMessage);
      toast.error(nextMessage);
      return;
    }

    const playback = currentPlaybackSnapshot();
    const requiredSeconds = videoRequiredSeconds(activeLesson);
    if (activeLesson.type === "video" && playback.watchedSeconds < requiredSeconds) {
      const nextMessage = `Watch the full video to unlock completion. ${formatClock(playback.watchedSeconds)} / ${formatClock(requiredSeconds)} watched.`;
      setMessage(nextMessage);
      toast.error("Watch the full video before marking it complete.");
      return;
    }

    const seconds = Math.max(studyDeltaRef.current, activeStudySeconds, Math.floor(mediaSeconds), playback.watchedSeconds);
    const progress = await persistLesson(activeLesson, action, {
      seconds,
      score,
      position: playback.position,
      watchedSeconds: playback.watchedSeconds,
      duration: playback.duration
    });

    studyDeltaRef.current = 0;
    setActiveStudySeconds(0);
    setStudySecondsByLesson(progress.studySecondsByLesson ?? {});
  }

  function sendVimeoCommand(method: string, value?: number | string) {
    vimeoRef.current?.contentWindow?.postMessage(
      JSON.stringify({ method, ...(typeof value !== "undefined" ? { value } : {}) }),
      "https://player.vimeo.com"
    );
  }

  function sendYouTubeCommand(func: string, args: unknown[] = []) {
    youtubeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "https://www.youtube-nocookie.com"
    );
  }

  useEffect(() => {
    if (!activeLesson || !activeVideoSource.isIframe || !activeVideoSource.canUseToolbar) return undefined;

    const registerTimer = window.setTimeout(() => {
      if (activeVideoSource.provider === "vimeo") {
        ["play", "pause", "timeupdate", "finish", "ended"].forEach((eventName) => {
          sendVimeoCommand("addEventListener", eventName);
        });
      } else if (activeVideoSource.provider === "youtube") {
        sendYouTubeCommand("addEventListener", ["onStateChange"]);
      }
    }, 500);

    function handlePlayerMessage(event: MessageEvent) {
      if (!["https://player.vimeo.com", "https://www.youtube.com", "https://www.youtube-nocookie.com"].includes(event.origin)) {
        return;
      }

      const payload = parsePlayerMessage(event.data);
      if (!payload) return;

      if (event.origin === "https://player.vimeo.com") {
        const eventName = String(payload.event ?? "");
        const data = typeof payload.data === "object" && payload.data !== null ? (payload.data as Record<string, unknown>) : {};
        const seconds = Number(data.seconds);
        const duration = Number(data.duration);

        if (Number.isFinite(seconds)) setMediaSeconds(seconds);
        if (Number.isFinite(duration) && duration > 0) setMediaDuration(Math.floor(duration));
        if (eventName === "play") setMediaPlaying(true);
        if (eventName === "pause") setMediaPlaying(false);
        if ((eventName === "finish" || eventName === "ended") && activeLesson && !completedSet.has(activeLesson.key)) {
          void completeActive("watched");
        }
        return;
      }

      const info = typeof payload.info === "object" && payload.info !== null ? (payload.info as Record<string, unknown>) : {};
      const currentTime = Number(info.currentTime);
      const playerState = Number(info.playerState ?? payload.info);

      if (Number.isFinite(currentTime)) setMediaSeconds(currentTime);
      if (playerState === 1) setMediaPlaying(true);
      if (playerState === 2) setMediaPlaying(false);
      if (playerState === 0 && activeLesson && !completedSet.has(activeLesson.key)) {
        setMediaPlaying(false);
        void completeActive("watched");
      }
    }

    window.addEventListener("message", handlePlayerMessage);

    return () => {
      window.clearTimeout(registerTimer);
      window.removeEventListener("message", handlePlayerMessage);
    };
    // The handler intentionally follows the currently active iframe lesson.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLesson?.key, activeVideoSource.embedUrl, activeVideoSource.isIframe, activeVideoSource.canUseToolbar, activeVideoSource.provider, completedSet]);

  async function togglePlayback() {
    if (!activeVideoSource.canUseToolbar) return;

    if (videoRef.current) {
      if (videoRef.current.paused) {
        await videoRef.current.play();
        setMediaPlaying(true);
      } else {
        videoRef.current.pause();
        setMediaPlaying(false);
      }
      return;
    }

    if (activeVideoSource.provider === "youtube") {
      sendYouTubeCommand(mediaPlaying ? "pauseVideo" : "playVideo");
    } else if (activeVideoSource.provider === "vimeo") {
      sendVimeoCommand(mediaPlaying ? "pause" : "play");
    }

    if (!mediaPlaying && activeLesson) {
      void persistLesson(activeLesson, "played", { complete: false });
    }
    setMediaPlaying((current) => !current);
  }

  function handleDirectLoadedMetadata(event: SyntheticEvent<HTMLVideoElement>) {
    if (!activeLesson) return;

    const node = event.currentTarget;
    const duration = Math.max(0, Math.floor(node.duration || 0));
    const savedPosition = Math.max(0, Number(lessonPositions[activeLesson.key] ?? 0));
    const savedWatched = Math.max(0, Number(watchedSecondsByLesson[activeLesson.key] ?? 0));
    const resumeAt = completedSet.has(activeLesson.key)
      ? 0
      : Math.min(savedPosition, Math.max(0, duration - 1), Math.max(savedWatched + 1, 0));

    setMediaDuration(duration);
    maxWatchedSecondRef.current = savedWatched;
    lastMediaSecondRef.current = resumeAt;
    setMediaSeconds(resumeAt);
    if (resumeAt > 0) node.currentTime = resumeAt;
  }

  function handleDirectSeeking(event: SyntheticEvent<HTMLVideoElement>) {
    const node = event.currentTarget;
    const allowedSecond = Math.max(0, maxWatchedSecondRef.current + 1.25);

    if (node.currentTime > allowedSecond) {
      node.currentTime = Math.max(0, maxWatchedSecondRef.current);
      setMediaSeconds(node.currentTime);
    }
  }

  function handleDirectTimeUpdate(event: SyntheticEvent<HTMLVideoElement>) {
    if (!activeLesson) return;

    const node = event.currentTarget;
    const currentSecond = Math.max(0, node.currentTime);
    const duration = Math.max(0, Math.floor(node.duration || mediaDuration || 0));
    const maxAllowedForward = Math.max(maxWatchedSecondRef.current + 2.25, lastMediaSecondRef.current + 4);

    if (!completedSet.has(activeLesson.key) && currentSecond > maxAllowedForward) {
      node.currentTime = Math.max(0, maxWatchedSecondRef.current);
      setMediaSeconds(node.currentTime);
      return;
    }

    lastMediaSecondRef.current = currentSecond;
    maxWatchedSecondRef.current = Math.max(maxWatchedSecondRef.current, Math.floor(currentSecond));
    setMediaSeconds(currentSecond);
    if (duration > 0) setMediaDuration(duration);
    setWatchedSecondsByLesson((current) => ({
      ...current,
      [activeLesson.key]: Math.max(Number(current[activeLesson.key] ?? 0), Math.floor(maxWatchedSecondRef.current))
    }));
    setLessonPositions((current) => ({
      ...current,
      [activeLesson.key]: Math.max(0, Math.floor(currentSecond))
    }));
    void savePlaybackPosition();
  }

  function handleDirectEnded(event: SyntheticEvent<HTMLVideoElement>) {
    if (!activeLesson) return;

    const node = event.currentTarget;
    const duration = Math.max(1, Math.floor(node.duration || mediaDuration || mediaSeconds || 1));

    setMediaPlaying(false);
    setMediaSeconds(duration);
    setMediaDuration(duration);
    maxWatchedSecondRef.current = duration;
    setWatchedSecondsByLesson((current) => ({ ...current, [activeLesson.key]: Math.max(Number(current[activeLesson.key] ?? 0), duration) }));
    setLessonPositions((current) => ({ ...current, [activeLesson.key]: duration }));
    void completeActive("watched");
  }

  async function loadQuiz() {
    setQuizLoading(true);
    setMessage("");
    setQuizAnswers({});
    setQuizResult(null);

    try {
      const params = new URLSearchParams();
      if (activeLesson?.key) params.set("lessonKey", activeLesson.key);
      const response = await fetch(`/api/courses/${encodeURIComponent(course.slug)}/quiz?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || data.error) throw new Error(data.error ?? "Quiz could not be generated.");
      setQuizQuestions(data.questions ?? []);
      toast.success("Quiz ready.");
    } catch (error) {
      const fallback = fallbackQuizQuestions(course, activeLesson);

      setQuizQuestions(fallback);
      const nextMessage =
        error instanceof Error
          ? `${error.message} A local chapter quiz is ready.`
          : "A local chapter quiz is ready.";
      setMessage(nextMessage);
      toast.message("Local quiz ready.");
    } finally {
      setQuizLoading(false);
    }
  }

  async function submitQuiz() {
    const questions = quizQuestions.length ? quizQuestions : fallbackQuizQuestions(course, activeLesson);
    if (!quizQuestions.length) setQuizQuestions(questions);
    const missingAnswer = questions.find((question) => typeof quizAnswers[question.id] !== "number");

    if (missingAnswer) {
      const nextMessage = "Answer every quiz question before submitting.";
      setMessage(nextMessage);
      toast.error(nextMessage);
      return;
    }

    setQuizLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(course.slug)}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonKey: activeLesson.key, answers: quizAnswers })
      });
      const data = await response.json();

      if (!response.ok || data.error) throw new Error(data.error ?? "Quiz could not be submitted.");
      setQuizResult(data);
      if (!data.passed) {
        await persistLesson(activeLesson, "quiz_failed", { seconds: Math.max(activeStudySeconds, 60), score: data.score, complete: false });
        const nextMessage = `Quiz score ${data.score}%. You need ${data.passingScore ?? 75}% or higher. Review the correct answers and try again.`;
        setMessage(nextMessage);
        toast.error(nextMessage);
        return;
      }
      await completeActive("quiz_passed", data.score);
      toast.success(`Quiz passed with ${data.score}%. Next chapter can unlock when study time is complete.`);
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : "Quiz could not be submitted.";
      setMessage(nextMessage);
      toast.error(nextMessage);
    } finally {
      setQuizLoading(false);
    }
  }

  async function generateCertificate(options: { auto?: boolean; openPdf?: boolean } = {}) {
    setMessage("");

    if (!allComplete) {
      setMessage("Complete every lesson before generating the certificate.");
      toast.error("Complete every lesson before generating the certificate.");
      return;
    }

    setSavingKey("certificate");

    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(course.slug)}/certificate`, { method: "POST" });
      const data = await response.json();

      if (!response.ok || data.error) throw new Error(data.error ?? "Certificate could not be generated.");

      setCertificate(data.certificate);
      setMessage("Verified certificate generated.");
      toast.success("Verified certificate generated.");
      if (options.openPdf) {
        window.open(certificatePdfUrl(data.certificate, course, learnerName), "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      const localCertificate = localCertificateResult();

      setCertificate(localCertificate);
      setMessage(
        error instanceof Error && !options.auto
          ? `${error.message} A local verified PDF is ready for download.`
          : "Certificate generated locally and ready for download."
      );
      if (options.openPdf) {
        window.open(certificatePdfUrl(localCertificate, course, learnerName), "_blank", "noopener,noreferrer");
      }
      if (!options.auto) {
        toast.message("Local certificate PDF is ready.");
      }
    } finally {
      setSavingKey("");
    }
  }

  useEffect(() => {
    if (allComplete && !certificate && savingKey !== "certificate") {
      const timer = window.setTimeout(() => {
        void generateCertificate({ auto: true });
      }, 0);

      return () => window.clearTimeout(timer);
    }
    return undefined;
    // generateCertificate intentionally stays outside deps; this effect only reacts to completion state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allComplete, certificate, savingKey]);

  async function loadEngagement() {
    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(course.slug)}/engagement`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || data.error) throw new Error(data.error ?? "Course engagement could not load.");
      setEngagement(data);
    } catch {
      setEngagement((current) => ({
        ...current,
        likes: Number(course.likes ?? current.likes),
        shareCount: Number(course.shareCount ?? current.shareCount)
      }));
    }
  }

  async function loadCommunity(options: { silent?: boolean } = {}) {
    if (!options.silent) setCommunityLoading(true);
    setCommunityError("");

    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(course.slug)}/community`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || data.error) throw new Error(data.error ?? "Community could not load.");
      setCommunityMessages(data.items ?? []);
    } catch (error) {
      setCommunityError(error instanceof Error ? error.message : "Community could not load.");
    } finally {
      if (!options.silent) setCommunityLoading(false);
    }
  }

  function focusCommunityComposer() {
    commentsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => communityInputRef.current?.focus(), 300);
  }

  async function toggleCourseLike() {
    let previous: CourseEngagement | null = null;
    setEngagementLoading(true);
    setEngagement((current) => {
      previous = current;
      const liked = !current.liked;
      const likes = Math.max(0, Number(current.likes ?? 0) + (liked ? 1 : -1));

      return { ...current, liked, likes };
    });

    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(course.slug)}/engagement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_like" })
      });
      const data = await response.json();

      if (!response.ok || data.error) throw new Error(data.error ?? "Like could not be saved.");
      setEngagement(data);
    } catch {
      if (previous) setEngagement(previous);
    } finally {
      setEngagementLoading(false);
    }
  }

  async function shareCourse() {
    const href =
      typeof window === "undefined"
        ? `/courses/${course.slug}`
        : `${window.location.origin}/courses/${course.slug}`;
    const nav: (Navigator & { share?: (data: ShareData) => Promise<void> }) | null =
      typeof window === "undefined" ? null : window.navigator;

    try {
      if (nav?.share) {
        await nav.share({ title: course.title, text: course.shortDescription, url: href });
      } else if (nav?.clipboard) {
        await nav.clipboard.writeText(href);
        toast.success("Course link copied.");
      }

      const response = await fetch(`/api/courses/${encodeURIComponent(course.slug)}/engagement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "share" })
      });
      const data = await response.json();
      if (response.ok && !data.error) setEngagement(data);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Share could not be completed.");
    }
  }

  async function sendCommunityMessage(parentId?: string) {
    const content = parentId ? replyDrafts[parentId]?.trim() : communityDraft.trim();
    if (!content) return;

    setCommunityActionKey(parentId ? `reply:${parentId}` : "comment");
    setCommunityLoading(true);
    setCommunityError("");

    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(course.slug)}/community`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId })
      });
      const data = await response.json();

      if (!response.ok || data.error) throw new Error(data.error ?? "Message could not be sent.");

      if (parentId) {
        setReplyDrafts((current) => {
          const next = { ...current };
          delete next[parentId];
          return next;
        });
        setReplyingTo("");
        toast.success("Reply posted.");
      } else {
        setCommunityDraft("");
        toast.success("Comment posted.");
      }
      await Promise.all([loadCommunity({ silent: true }), loadEngagement()]);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Message could not be sent.";
      setCommunityError(nextMessage);
      toast.error(nextMessage);
    } finally {
      setCommunityLoading(false);
      setCommunityActionKey("");
    }
  }

  async function toggleCommunityLike(messageId: string) {
    let previous: CommunityMessage[] | null = null;
    setCommunityActionKey(`like:${messageId}`);
    setCommunityMessages((current) => {
      previous = current;
      return optimisticCommunityLike(current, messageId);
    });

    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(course.slug)}/community`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_like", messageId })
      });
      const data = await response.json();

      if (!response.ok || data.error) throw new Error(data.error ?? "Comment like could not be saved.");
      setCommunityMessages((current) => updateCommunityLike(current, data.id, data.liked, data.likes));
    } catch {
      if (previous) setCommunityMessages(previous);
    } finally {
      setCommunityActionKey("");
    }
  }

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadCommunity();
      void loadEngagement();
    }, 0);
    const timer = window.setInterval(() => {
      void loadCommunity({ silent: true });
      void loadEngagement();
    }, 30000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
    // Community polling follows the current course only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.slug]);

  if (!activeLesson) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BookOpen className="mx-auto mb-4 size-8 text-[hsl(var(--primary))]" />
          <h1 className="text-2xl font-semibold">This course has no lessons yet</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[hsl(var(--muted-foreground))]">
            Ask the instructor to publish chapters, videos, readings, assignments, and quizzes for this course.
          </p>
          <Button asChild className="mt-5">
            <Link href="/dashboard/my-courses">Back to courses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {previewBlocked ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="mb-3 grid size-12 place-items-center rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                <Lock className="size-6" />
              </div>
              <CardTitle>{accessType === "premium" ? "Premium access required" : "Enrollment required"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                The preview window has ended. Unlock the full course to continue watching lessons, save progress, use resources, take quizzes, and earn the certificate.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button asChild>
                  <Link href={`/courses/${course.slug}/enroll`}>
                    <CreditCard className="size-4" />
                    Enroll or pay
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/courses/${course.slug}`}>Course details</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
      <section className="hidden">
        <div className="w-full max-w-xs">
          <div className="hidden">
            <div className="flex flex-wrap gap-2">
              <Badge>{course.category}</Badge>
              <Badge>{course.level}</Badge>
              <Badge>{course.totalLessons} lessons</Badge>
              <Badge>{formatMinutes(course.totalMinutes)}</Badge>
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{course.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">{course.shortDescription}</p>
            <p className="mt-3 text-sm font-semibold">
              {course.instructor} · {certificate ? "Certificate issued" : allComplete ? "Ready for certificate" : "Certificate unlocks after completion"}
            </p>
          </div>
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">Progress</span>
              <span className="text-2xl font-black text-[hsl(var(--primary))]">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="mt-3" />
            <Button className="mt-3 w-full" onClick={() => void generateCertificate({ openPdf: true })} disabled={!allComplete || savingKey === "certificate"}>
              <QrCode className="size-4" />
              {savingKey === "certificate" ? "Generating..." : certificate ? "Open certificate" : "Generate certificate"}
            </Button>
          </div>
        </div>
        {certificate ? (
          <div className="hidden">
            <Button asChild variant="outline" size="sm">
              <Link href={certificatePdfUrl(certificate, course, learnerName)} target="_blank">
                <Award className="size-4" />
                View PDF
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={certificatePdfUrl(certificate, course, learnerName, true)}>
                <Download className="size-4" />
                Download PDF
              </Link>
            </Button>
          </div>
        ) : null}
        {message ? <p className="max-w-xs text-sm text-[hsl(var(--muted-foreground))]">{message}</p> : null}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem] 2xl:grid-cols-[18rem_minmax(0,1fr)_18rem]">
        <Card className="hidden 2xl:block">
          <CardHeader>
            <CardTitle>Chapters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {course.modules.map((module, moduleIndex) => {
              const completedInModule = module.lessons.filter((lesson) => completedSet.has(lesson.key)).length;
              const modulePercent = Math.round((completedInModule / module.lessons.length) * 100);
              const requiredSeconds = moduleRequiredSeconds(module.key);
              const studiedSeconds = moduleStudySeconds(module.key);
              const timeReady = studiedSeconds >= requiredSeconds;

              return (
                <div key={module.key} className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
                        Chapter {moduleIndex + 1}
                      </p>
                      <h2 className="text-sm font-semibold">{module.title}</h2>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge>{modulePercent}%</Badge>
                      <Badge className={timeReady ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]" : ""}>
                        {formatStudyTime(studiedSeconds)} / {formatStudyTime(requiredSeconds)}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={modulePercent} />
                  <div className="space-y-2">
                    {module.lessons.map((lesson) => {
                      const flatLesson = course.flatLessons.find((item) => item.key === lesson.key);
                      if (!flatLesson) return null;

                      const Icon = lessonIcon(lesson.type);
                      const done = completedSet.has(lesson.key);
                      const unlocked = lessonUnlocked(lesson.key);
                      const active = lesson.key === activeLesson.key;

                      return (
                        <button
                          key={lesson.key}
                          type="button"
                          disabled={!unlocked}
                          onClick={() => void openLesson(flatLesson)}
                          className={`w-full rounded-md border p-3 text-left text-sm transition ${
                            active
                              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)]"
                              : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
                          } disabled:cursor-not-allowed disabled:opacity-55`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-2">
                              <Icon className="size-4 shrink-0 text-[hsl(var(--primary))]" />
                              <span className="truncate font-medium">{lesson.title}</span>
                            </span>
                            {done ? (
                              <CheckCircle2 className="size-4 shrink-0 text-[hsl(var(--primary))]" />
                            ) : unlocked ? (
                              <Unlock className="size-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
                            ) : (
                              <Lock className="size-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
                            )}
                          </span>
                          <span className="mt-2 block text-xs text-[hsl(var(--muted-foreground))]">
                            {lesson.type} - {formatMinutes(lesson.durationMinutes)}
                            {!unlocked && moduleIndex > 0 ? " - locked until previous chapter is complete" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
                  Lesson {activeIndex + 1} of {course.totalLessons}
                </p>
                <CardTitle className="mt-2 leading-tight">{activeLesson.title}</CardTitle>
              </div>
              <Badge>{activeLesson.type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 sm:p-4">
              {activeLesson.type === "video" ? (
                <div className="space-y-4">
                  {activeVideoSource.provider === "direct" ? (
                    <video
                      ref={videoRef}
                      src={activeVideoSource.playbackUrl}
                      playsInline
                      controls={false}
                      controlsList="nodownload noplaybackrate noremoteplayback"
                      disablePictureInPicture
                      className="aspect-video w-full rounded-md bg-black object-contain"
                      onLoadedMetadata={handleDirectLoadedMetadata}
                      onPlay={() => {
                        setMediaPlaying(true);
                        void persistLesson(activeLesson, "played", { complete: false, silent: true });
                      }}
                      onPause={() => {
                        setMediaPlaying(false);
                        void savePlaybackPosition({ force: true });
                      }}
                      onSeeking={handleDirectSeeking}
                      onTimeUpdate={handleDirectTimeUpdate}
                      onEnded={handleDirectEnded}
                    />
                  ) : activeVideoSource.isIframe ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-md border border-[hsl(var(--border))] bg-black">
                      <iframe
                        key={activeVideoSource.embedUrl}
                        ref={(node) => {
                          iframeRef.current = node;
                          if (activeVideoSource.provider === "vimeo") vimeoRef.current = node;
                          if (activeVideoSource.provider === "youtube") youtubeRef.current = node;
                        }}
                        src={activeVideoSource.embedUrl}
                        title="Course video player"
                        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        className={embeddedVideoClass()}
                      />
                      {activeVideoSource.provider === "google-drive" ? (
                        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-14 items-start justify-between bg-gradient-to-b from-black/90 via-black/55 to-transparent p-2">
                          <span className="inline-flex items-center gap-2 rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white shadow">
                            <span className="relative size-5 overflow-hidden rounded">
                              <SafeImage src="/icons/logo.png" alt="" fill sizes="20px" className="object-contain" />
                            </span>
                            <span className="hidden sm:inline">MR Creativist</span>
                          </span>
                          <span className="grid size-10 place-items-center rounded-md bg-white/95 text-[hsl(var(--primary))] shadow-lg ring-1 ring-black/10">
                            <Download className="size-5" />
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex aspect-video flex-col items-center justify-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-6 text-center">
                      <Play className="mb-4 size-10 text-[hsl(var(--primary))]" />
                      <h2 className="text-lg font-semibold">Video lesson</h2>
                      <p className="mt-2 max-w-lg text-sm text-[hsl(var(--muted-foreground))]">
                        Add a YouTube, Vimeo, Google Drive, or hosted MP4 video in the instructor upload center.
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={engagement.liked ? "default" : "outline"}
                        onClick={() => void toggleCourseLike()}
                        disabled={engagementLoading}
                      >
                        <Heart className={`size-4 ${engagement.liked ? "fill-current" : ""}`} />
                        {compactCount(engagement.likes)}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={focusCommunityComposer}>
                        <MessageCircle className="size-4" />
                        <span>{compactCount(communityTotal(communityMessages) || engagement.commentCount || engagement.comments + engagement.replies)}</span>
                        <span className="hidden sm:inline">comments</span>
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => void shareCourse()}>
                        <Share2 className="size-4" />
                        <span className="hidden sm:inline">Share</span>
                        {engagement.shareCount ? <span>{compactCount(engagement.shareCount)}</span> : null}
                      </Button>
                    </div>
                    <p className="hidden text-xs text-[hsl(var(--muted-foreground))] sm:block">Like, share, or ask below the lesson.</p>
                  </div>
                  <div className="grid gap-2 rounded-md border border-[hsl(var(--border))] p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => previousLesson && void openLesson(previousLesson)} disabled={!previousLesson}>
                        <SkipBack className="size-4" />
                        <span className="hidden sm:inline">Prev</span>
                      </Button>
                      <Button size="sm" onClick={() => void togglePlayback()} disabled={!activeVideoSource.canUseToolbar}>
                        {mediaPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                        <span className="hidden sm:inline">{mediaPlaying ? "Pause" : "Play"}</span>
                      </Button>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      <span className="flex h-9 items-center rounded-md border border-[hsl(var(--border))] px-3 text-xs text-[hsl(var(--muted-foreground))]">
                        {formatClock(mediaSeconds)}{mediaDuration ? ` / ${formatClock(mediaDuration)}` : ""}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (nextLesson) void openLesson(nextLesson);
                        }}
                        disabled={!nextLesson || !lessonUnlocked(nextLesson.key) || !canAdvanceFromActive}
                      >
                        <SkipForward className="size-4" />
                        <span className="hidden sm:inline">Next</span>
                      </Button>
                    </div>
                  </div>
                  <Button onClick={() => void completeActive("watched")} disabled={savingKey === activeLesson.key || !activeVideoComplete}>
                    <CheckCircle2 className="size-4" />
                    <span className="hidden sm:inline">
                      {activeVideoComplete ? "Mark video watched" : `Watch ${formatClock(Math.max(0, videoRequiredSeconds(activeLesson) - activeWatchedSeconds))} more`}
                    </span>
                    <span className="sm:hidden">Watched</span>
                  </Button>
                </div>
              ) : null}

              {activeLesson.type === "article" ? (
                <div className="space-y-4">
                  <div className="rounded-md border border-[hsl(var(--border))] p-4">
                    <p className="text-sm leading-7 text-[hsl(var(--muted-foreground))]">
                      {activeLesson.summary} {course.description}
                    </p>
                  </div>
                  <Button onClick={() => void completeActive("read")} disabled={savingKey === activeLesson.key}>
                    <CheckCircle2 className="size-4" />
                    Mark reading complete
                  </Button>
                </div>
              ) : null}

              {activeLesson.type === "image" ? (
                <div className="space-y-4">
                  <div className="relative aspect-video overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                    <SafeImage
                      src={activeLesson.imageUrl || activeLesson.resources[0]?.url || course.image || courseImageForCategory(course.category)}
                      fallbackSrc={courseImageForCategory(course.category)}
                      alt={activeLesson.title}
                      fill
                      sizes="(min-width: 1024px) 46vw, 100vw"
                      className="object-contain"
                    />
                  </div>
                  <div className="rounded-md border border-[hsl(var(--border))] p-4">
                    <p className="text-sm leading-7 text-[hsl(var(--muted-foreground))]">
                      {activeLesson.summary}
                    </p>
                  </div>
                  <Button onClick={() => void completeActive("viewed")} disabled={savingKey === activeLesson.key}>
                    <CheckCircle2 className="size-4" />
                    Mark image viewed
                  </Button>
                </div>
              ) : null}

              {activeLesson.type === "quiz" ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={loadQuiz} disabled={quizLoading}>
                      <Sparkles className="size-4" />
                      {quizLoading ? "Generating..." : "Generate quiz"}
                    </Button>
                    <Button onClick={submitQuiz} disabled={quizLoading || savingKey === activeLesson.key}>
                      <ClipboardCheck className="size-4" />
                      Submit quiz
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {(quizQuestions.length ? quizQuestions : fallbackQuizQuestions(course, activeLesson)).map((question, index) => (
                      <div key={question.id} className="rounded-md border border-[hsl(var(--border))] p-3">
                        <p className="text-sm font-semibold">Question {index + 1}</p>
                        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{question.question}</p>
                        <div className="mt-3 grid gap-2">
                          {question.options.map((option, optionIndex) => {
                            const correction = quizResult?.corrections.find((item) => item.id === question.id);
                            const isCorrect = correction?.correctIndex === optionIndex;
                            const selectedWrong =
                              correction?.selectedIndex === optionIndex && correction.selectedIndex !== correction.correctIndex;

                            return (
                              <label
                                key={`${question.id}-${option}`}
                                className={`flex cursor-pointer items-start gap-2 rounded-md border border-[hsl(var(--border))] p-3 text-sm ${
                                  isCorrect && quizResult
                                    ? "border-[hsl(var(--primary))]/50 bg-[hsl(var(--primary))]/10"
                                    : selectedWrong
                                      ? "border-[hsl(var(--destructive))]/50 bg-[hsl(var(--destructive))]/10"
                                      : "hover:bg-[hsl(var(--muted))]/45"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={question.id}
                                  checked={quizAnswers[question.id] === optionIndex}
                                  onChange={() => setQuizAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                                  className="mt-1"
                                />
                                <span>{option}</span>
                              </label>
                            );
                          })}
                        </div>
                        {quizResult ? (
                          <p className="mt-2 text-xs text-[hsl(var(--primary))]">
                            Correct answer: {question.options[question.correctIndex]}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {quizResult ? (
                    <div className="rounded-md border border-[hsl(var(--border))] p-4 text-sm">
                      <p className="font-semibold">
                        Score: {quizResult.score}% ({quizResult.correct}/{quizResult.total})
                      </p>
                      <p className="mt-1 text-[hsl(var(--muted-foreground))]">
                        {quizResult.passed
                          ? "Passed. This quiz can unlock progress."
                          : `Not passed. You need ${quizResult.passingScore}% or higher, then submit the quiz again.`}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeLesson.type === "assignment" ? (
                <div className="space-y-4">
                  <div className="rounded-md border border-[hsl(var(--border))] p-4">
                    <h2 className="font-semibold">Practical assignment</h2>
                    <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                      {activeLesson.summary || "Follow the instructor's assignment instructions for this lesson."}
                    </p>
                  </div>
                  <Button onClick={() => void completeActive("assignment_submitted", 100)} disabled={savingKey === activeLesson.key}>
                    <GraduationCap className="size-4" />
                    Submit assignment
                  </Button>
                </div>
              ) : null}

              {activeLesson.type === "download" ? (
                <div className="space-y-4">
                  {activeLesson.resources.length ? (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {activeLesson.resources.map((resource) => (
                          <Link
                            key={resource.label}
                            href={resource.url}
                            target="_blank"
                            className="rounded-md border border-[hsl(var(--border))] p-3 text-sm font-medium hover:bg-[hsl(var(--muted))]"
                          >
                            <Download className="mb-3 size-4 text-[hsl(var(--primary))]" />
                            {resource.label}
                          </Link>
                        ))}
                      </div>
                      <Button onClick={() => void completeActive("downloaded")} disabled={savingKey === activeLesson.key}>
                        <CheckCircle2 className="size-4" />
                        Mark resources downloaded
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-md border border-dashed border-[hsl(var(--border))] p-4 text-sm text-[hsl(var(--muted-foreground))]">
                      No downloadable resources are attached to this lesson yet.
                    </div>
                  )}
                </div>
              ) : null}

              {activeLesson.type !== "download" && activeLesson.resources.length ? (
                <div className="mt-5 rounded-md border border-[hsl(var(--border))] p-4">
                  <h2 className="text-sm font-semibold">Lesson resources</h2>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {activeLesson.resources.map((resource) => (
                      <Link
                        key={`${resource.label}-${resource.url}`}
                        href={resource.url}
                        target="_blank"
                        className="rounded-md border border-[hsl(var(--border))] p-3 text-sm font-medium hover:bg-[hsl(var(--muted))]"
                      >
                        <Download className="mb-3 size-4 text-[hsl(var(--primary))]" />
                        {resource.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {course.resources?.length ? (
                <div className="mt-5 rounded-md border border-[hsl(var(--border))] p-4">
                  <h2 className="text-sm font-semibold">Course downloads</h2>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {course.resources.map((resource) => (
                      <a
                        key={`${resource.label}-${resource.url}`}
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        download={resource.downloadable ? "" : undefined}
                        className="rounded-md border border-[hsl(var(--border))] p-3 text-sm font-medium hover:bg-[hsl(var(--muted))]"
                      >
                        <Download className="mb-3 size-4 text-[hsl(var(--primary))]" />
                        {resource.label}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div
              id="comments"
              ref={commentsSectionRef}
              className="scroll-mt-24 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                    <Users className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold">Course discussion</h2>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                      Ask questions, reply to learners, and keep notes connected to this course.
                    </p>
                  </div>
                </div>
                <Badge>{compactCount(communityTotal(communityMessages) || engagement.commentCount || engagement.comments + engagement.replies)} comments</Badge>
              </div>

              <div className="mt-4 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3">
                <textarea
                  ref={communityInputRef}
                  value={communityDraft}
                  onChange={(event) => setCommunityDraft(event.target.value)}
                  placeholder="Ask a question or share what you learned..."
                  className="min-h-24 w-full resize-y rounded-md border border-[hsl(var(--border))] bg-transparent p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Be clear, helpful, and respectful to the course community.</p>
                  <Button
                    onClick={() => void sendCommunityMessage()}
                    disabled={communityLoading || !communityDraft.trim() || communityActionKey === "comment"}
                  >
                    <Send className="size-4" />
                    {communityActionKey === "comment" ? "Posting..." : "Post comment"}
                  </Button>
                </div>
              </div>

              {communityError ? <p className="mt-3 text-sm text-[hsl(var(--destructive))]">{communityError}</p> : null}

              <div className="mt-4 space-y-3">
                {communityLoading && communityMessages.length === 0 ? (
                  <p className="rounded-md border border-[hsl(var(--border))] p-4 text-sm text-[hsl(var(--muted-foreground))]">
                    Loading discussion...
                  </p>
                ) : null}
                {communityMessages.map((item) => (
                  <div key={item.id} className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.senderName}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Just now"}
                        </p>
                      </div>
                      {item.isInstructor ? <Badge>Instructor</Badge> : null}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[hsl(var(--muted-foreground))]">{item.content}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={item.liked ? "default" : "outline"}
                        onClick={() => void toggleCommunityLike(item.id)}
                        disabled={communityActionKey === `like:${item.id}`}
                      >
                        <Heart className={`size-4 ${item.liked ? "fill-current" : ""}`} />
                        {compactCount(item.likes ?? 0)}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setReplyingTo((current) => (current === item.id ? "" : item.id))}
                      >
                        <CornerDownRight className="size-4" />
                        Reply
                      </Button>
                    </div>

                    {replyingTo === item.id ? (
                      <div className="mt-3 rounded-md border border-[hsl(var(--border))] p-3">
                        <textarea
                          value={replyDrafts[item.id] ?? ""}
                          onChange={(event) => setReplyDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                          placeholder={`Reply to ${item.senderName}...`}
                          className="min-h-20 w-full resize-y rounded-md border border-[hsl(var(--border))] bg-transparent p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                        />
                        <div className="mt-3 flex justify-end gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => setReplyingTo("")}>
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void sendCommunityMessage(item.id)}
                            disabled={communityLoading || !replyDrafts[item.id]?.trim() || communityActionKey === `reply:${item.id}`}
                          >
                            <Send className="size-4" />
                            {communityActionKey === `reply:${item.id}` ? "Replying..." : "Reply"}
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {item.replies?.length ? (
                      <div className="mt-4 space-y-2 border-l border-[hsl(var(--border))] pl-3">
                        {item.replies.map((reply) => (
                          <div key={reply.id} className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold">{reply.senderName}</p>
                              {reply.isInstructor ? <Badge>Instructor</Badge> : null}
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[hsl(var(--muted-foreground))]">{reply.content}</p>
                            <Button
                              type="button"
                              size="sm"
                              variant={reply.liked ? "default" : "outline"}
                              className="mt-2"
                              onClick={() => void toggleCommunityLike(reply.id)}
                              disabled={communityActionKey === `like:${reply.id}`}
                            >
                              <Heart className={`size-4 ${reply.liked ? "fill-current" : ""}`} />
                              {compactCount(reply.likes ?? 0)}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                {!communityLoading && communityMessages.length === 0 ? (
                  <p className="rounded-md border border-dashed border-[hsl(var(--border))] p-4 text-sm text-[hsl(var(--muted-foreground))]">
                    No comments yet. Start the discussion with a question, note, or useful lesson takeaway.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {completedSet.has(activeLesson.key) ? "Completed" : "In progress"} - {activeLesson.moduleTitle} -{" "}
                {formatStudyTime(effectiveStudySecondsByLesson[activeLesson.key] ?? 0)} saved
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => void saveStudyTime()} disabled={savingKey === activeLesson.key || activeStudySeconds <= 0}>
                  <Timer className="size-4" />
                  <span className="hidden sm:inline">Save study time</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void completeActive("completed")}
                  disabled={savingKey === activeLesson.key || activeLesson.type === "quiz" || !canAdvanceFromActive}
                >
                  <CheckCircle2 className="size-4" />
                  <span className="hidden sm:inline">Complete lesson</span>
                </Button>
                <Button
                  onClick={() => {
                    if (nextLesson) void openLesson(nextLesson);
                  }}
                  disabled={!nextLesson || !lessonUnlocked(nextLesson.key) || !canAdvanceFromActive}
                >
                  <Play className="size-4" />
                  <span className="hidden sm:inline">Continue next</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Progress</CardTitle>
                <span className="text-2xl font-black text-[hsl(var(--primary))]">{progressPercent}%</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={progressPercent} />
              <Button
                className="w-full"
                onClick={() => void generateCertificate({ openPdf: true })}
                disabled={!allComplete || savingKey === "certificate"}
              >
                <QrCode className="size-4" />
                {savingKey === "certificate" ? "Generating..." : certificate ? "Open certificate" : "Generate certificate"}
              </Button>
              {certificate ? (
                <div className="grid gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={certificatePdfUrl(certificate, course, learnerName)} target="_blank">
                      <Award className="size-4" />
                      View PDF
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={certificatePdfUrl(certificate, course, learnerName, true)}>
                      <Download className="size-4" />
                      Download PDF
                    </Link>
                  </Button>
                </div>
              ) : null}
              {message ? <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">{message}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Up next</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingLessons.length ? (
                upcomingLessons.map((lesson) => {
                  const Icon = lessonIcon(lesson.type);
                  const unlocked = lessonUnlocked(lesson.key);

                  return (
                    <button
                      key={lesson.key}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => void openLesson(lesson)}
                      className="flex w-full gap-3 rounded-md border border-[hsl(var(--border))] p-2 text-left transition hover:bg-[hsl(var(--muted))]/55 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 text-sm font-semibold">{lesson.title}</span>
                        <span className="mt-1 block text-xs text-[hsl(var(--muted-foreground))]">
                          {formatMinutes(lesson.durationMinutes)} · {lesson.moduleTitle}
                        </span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">You are on the final lesson in this path.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {[...(activeLesson.resources ?? []), ...(course.resources ?? [])].slice(0, 5).map((resource) => (
                <a
                  key={`${resource.label}-${resource.url}`}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  download={resource.downloadable ? "" : undefined}
                  className="rounded-md border border-[hsl(var(--border))] p-3 text-sm font-medium hover:bg-[hsl(var(--muted))]/55"
                >
                  <Download className="mb-2 size-4 text-[hsl(var(--primary))]" />
                  {resource.label}
                </a>
              ))}
              {!(activeLesson.resources?.length || course.resources?.length) ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">No downloads are attached to this lesson yet.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
