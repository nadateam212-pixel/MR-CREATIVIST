"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Layers3,
  Lock,
  Pause,
  Play,
  QrCode,
  RotateCcw,
  Send,
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
  url: string;
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
  image?: string;
  outcomes: string[];
  tools: string[];
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
  senderId: string;
  senderName: string;
  senderRole?: string;
  content: string;
  isInstructor?: boolean;
  createdAt?: string;
};

function embeddedVideoClass(provider: string) {
  if (provider === "youtube") {
    return "absolute inset-x-0 -top-[14%] h-[128%] w-full border-0";
  }
  if (provider === "vimeo") {
    return "absolute inset-x-0 -top-[10%] h-[120%] w-full border-0";
  }
  if (provider === "google-drive") {
    return "absolute inset-x-0 -top-12 h-[calc(100%+6rem)] w-full border-0";
  }

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
  learnerName
}: {
  course: CourseStructure;
  initialProgress: LearningProgressSnapshot;
  learnerName: string;
}) {
  const firstLessonKey = course.flatLessons[0]?.key ?? "";
  const [completedLessonKeys, setCompletedLessonKeys] = useState(initialProgress.completedLessonKeys ?? []);
  const [activeKey, setActiveKey] = useState(initialProgress.currentLessonKey || firstLessonKey);
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
  const [activeStudySeconds, setActiveStudySeconds] = useState(0);
  const [communityMessages, setCommunityMessages] = useState<CommunityMessage[]>([]);
  const [communityDraft, setCommunityDraft] = useState("");
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const vimeoRef = useRef<HTMLIFrameElement | null>(null);
  const youtubeRef = useRef<HTMLIFrameElement | null>(null);
  const studyDeltaRef = useRef(0);
  const [mediaPlaying, setMediaPlaying] = useState(false);
  const [mediaSeconds, setMediaSeconds] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [vimeoNonce, setVimeoNonce] = useState(0);

  const completedSet = useMemo(() => new Set(completedLessonKeys), [completedLessonKeys]);
  const completedPercent = course.totalLessons
    ? Math.round((course.flatLessons.filter((lesson) => completedSet.has(lesson.key)).length / course.totalLessons) * 100)
    : 0;
  const progressPercent = Math.min(100, Math.max(serverProgressPercent, completedPercent));
  const activeLesson = course.flatLessons.find((lesson) => lesson.key === activeKey) ?? course.flatLessons[0];
  const activeIndex = course.flatLessons.findIndex((lesson) => lesson.key === activeLesson?.key);
  const previousLesson = activeIndex > 0 ? course.flatLessons[activeIndex - 1] : null;
  const nextLesson = course.flatLessons.find((lesson) => !completedSet.has(lesson.key) && lesson.key !== activeLesson?.key);
  const allComplete =
    progressPercent >= 100 &&
    course.modules.every((module) => {
      const lessonsComplete = module.lessons.every((lesson) => completedSet.has(lesson.key));
      const requiredSeconds = module.lessons.reduce((total, lesson) => total + Number(lesson.durationMinutes ?? 0), 0) * 60;
      const studiedSeconds = module.lessons.reduce(
        (total, lesson) => total + Number(effectiveStudySecondsByLesson[lesson.key] ?? 0),
        0
      );

      return lessonsComplete && studiedSeconds >= requiredSeconds;
    });
  const effectiveStudySecondsByLesson = {
    ...studySecondsByLesson,
    ...(activeLesson
      ? {
          [activeLesson.key]: (studySecondsByLesson[activeLesson.key] ?? 0) + activeStudySeconds
        }
      : {})
  };
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

  function moduleStudyReady(moduleKey: string, lessonSeconds = effectiveStudySecondsByLesson) {
    return moduleStudySeconds(moduleKey, lessonSeconds) >= moduleRequiredSeconds(moduleKey);
  }

  function moduleUnlocked(moduleIndex: number, completed = completedSet) {
    if (moduleIndex <= 0) return true;

    return course.modules.slice(0, moduleIndex).every((module) => moduleComplete(module.key, completed) && moduleStudyReady(module.key));
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
    setActiveKey(key);
    setMediaPlaying(false);
    setMediaSeconds(0);
    setPlaybackRate(1);
    setActiveStudySeconds(0);
    studyDeltaRef.current = 0;
    setQuizResult(null);
  }

  useEffect(() => {
    if (!activeLesson) return undefined;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      if (activeLesson.type === "video" && !mediaPlaying) return;

      setActiveStudySeconds((current) => current + 1);
      studyDeltaRef.current += 1;
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeLesson, mediaPlaying]);

  async function persistLesson(
    lesson: FlatLesson,
    action: LearningProgressSnapshot["events"][number]["action"],
    options: { seconds?: number; score?: number; complete?: boolean } = {}
  ) {
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
      if (options.complete === false) {
        setActiveKey(data.progress.currentLessonKey || optimisticNextKey);
      } else {
        activateLesson(data.progress.currentLessonKey || optimisticNextKey);
      }
      setMessage(options.complete === false ? "Activity saved." : "Lesson completed and saved.");
      if (options.complete !== false) {
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
      setMessage(nextMessage);
      if (shouldComplete) {
        toast.success("Lesson completed locally.");
      } else if (error instanceof Error) {
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
    if (!lessonUnlocked(lesson.key)) return;

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

  async function completeActive(action: LearningProgressSnapshot["events"][number]["action"], score?: number) {
    if (!activeLesson) return;

    if (activeLesson.type === "quiz" && action !== "quiz_passed") {
      const nextMessage = "Submit the quiz and score at least 75% to complete this lesson.";
      setMessage(nextMessage);
      toast.error(nextMessage);
      return;
    }

    const seconds = Math.max(studyDeltaRef.current, activeStudySeconds, Math.floor(mediaSeconds));
    const progress = await persistLesson(activeLesson, action, { seconds, score });

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

        if (Number.isFinite(seconds)) setMediaSeconds(seconds);
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

  function replayMedia() {
    if (!activeVideoSource.canUseToolbar) return;

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      void videoRef.current.play();
      setMediaPlaying(true);
      return;
    }

    setMediaSeconds(0);
    if (activeVideoSource.provider === "youtube") {
      sendYouTubeCommand("seekTo", [0, true]);
      sendYouTubeCommand("playVideo");
    } else if (activeVideoSource.provider === "vimeo") {
      sendVimeoCommand("setCurrentTime", 0);
      sendVimeoCommand("play");
      setVimeoNonce((current) => current + 1);
    }
    setMediaPlaying(true);
  }

  function skipMedia(seconds: number) {
    if (!activeVideoSource.canUseToolbar) return;

    if (videoRef.current) {
      const next = Math.max(0, Math.min(videoRef.current.duration || Number.MAX_SAFE_INTEGER, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = next;
      setMediaSeconds(next);
      return;
    }

    setMediaSeconds((current) => {
      const next = Math.max(0, current + seconds);
      if (activeVideoSource.provider === "youtube") {
        sendYouTubeCommand("seekTo", [next, true]);
      } else if (activeVideoSource.provider === "vimeo") {
        sendVimeoCommand("setCurrentTime", next);
      }
      return next;
    });
  }

  function changePlaybackRate(value: number) {
    setPlaybackRate(value);
    if (!activeVideoSource.canUseToolbar) return;

    if (videoRef.current) {
      videoRef.current.playbackRate = value;
      return;
    }

    if (activeVideoSource.provider === "youtube") {
      sendYouTubeCommand("setPlaybackRate", [value]);
    } else if (activeVideoSource.provider === "vimeo") {
      sendVimeoCommand("setPlaybackRate", value);
    }
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

  async function loadCommunity() {
    setCommunityLoading(true);
    setCommunityError("");

    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(course.slug)}/community`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || data.error) throw new Error(data.error ?? "Community could not load.");
      setCommunityMessages(data.items ?? []);
    } catch (error) {
      setCommunityError(error instanceof Error ? error.message : "Community could not load.");
    } finally {
      setCommunityLoading(false);
    }
  }

  async function sendCommunityMessage() {
    if (!communityDraft.trim()) return;

    setCommunityLoading(true);
    setCommunityError("");

    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(course.slug)}/community`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: communityDraft.trim() })
      });
      const data = await response.json();

      if (!response.ok || data.error) throw new Error(data.error ?? "Message could not be sent.");

      setCommunityMessages((current) => [...current, data]);
      setCommunityDraft("");
      toast.success("Community message sent.");
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Message could not be sent.";
      setCommunityError(nextMessage);
      toast.error(nextMessage);
    } finally {
      setCommunityLoading(false);
    }
  }

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadCommunity();
    }, 0);
    const timer = window.setInterval(() => {
      void loadCommunity();
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
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <div className="grid min-h-72 gap-0 md:grid-cols-[0.85fr_1.15fr]">
            <div className="relative min-h-56 bg-[hsl(var(--muted))]">
              {course.image ? (
                <SafeImage
                  src={course.image}
                  fallbackSrc={courseImageForCategory(course.category)}
                  alt={course.title}
                  fill
                  sizes="420px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                <Badge>{course.level}</Badge>
                <Badge>{course.category}</Badge>
                <Badge>{course.certificate}</Badge>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight">{course.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">{course.shortDescription}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Lessons", value: course.totalLessons, icon: Layers3 },
                  { label: "Duration", value: formatMinutes(course.totalMinutes), icon: Timer },
                  { label: "Instructor", value: course.instructor, icon: GraduationCap }
                ].map((metric) => (
                  <div key={metric.label} className="rounded-md border border-[hsl(var(--border))] p-3">
                    <metric.icon className="mb-2 size-4 text-[hsl(var(--primary))]" />
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{metric.label}</p>
                    <p className="mt-1 text-sm font-semibold">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Learning record</CardTitle>
              <p className="text-3xl font-semibold text-[hsl(var(--primary))]">{progressPercent}%</p>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercent} />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-[hsl(var(--border))] p-3">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Completed lessons</p>
                <p className="mt-1 text-2xl font-semibold">
                  {course.flatLessons.filter((lesson) => completedSet.has(lesson.key)).length}/{course.totalLessons}
                </p>
              </div>
              <div className="rounded-md border border-[hsl(var(--border))] p-3">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Study time saved</p>
                <p className="mt-1 text-2xl font-semibold">
                  {formatStudyTime(Object.values(effectiveStudySecondsByLesson).reduce((total, seconds) => total + Number(seconds ?? 0), 0))}
                </p>
              </div>
              <div className="rounded-md border border-[hsl(var(--border))] p-3">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Certificate status</p>
                <p className="mt-1 text-sm font-semibold">
                  {certificate ? "Issued and verified" : allComplete ? "Generating automatically" : "Locked until completion"}
                </p>
              </div>
            </div>
            <Button className="mt-5 w-full" onClick={() => void generateCertificate({ openPdf: true })} disabled={!allComplete || savingKey === "certificate"}>
              <QrCode className="size-4" />
              {savingKey === "certificate" ? "Generating..." : certificate ? "Open verified certificate" : "Generate verified certificate"}
            </Button>
            {certificate ? (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Button asChild variant="outline">
                  <Link href={certificatePdfUrl(certificate, course, learnerName)} target="_blank">
                    <Award className="size-4" />
                    View PDF
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={certificatePdfUrl(certificate, course, learnerName, true)}>
                    <Download className="size-4" />
                    Download PDF
                  </Link>
                </Button>
              </div>
            ) : null}
            {message ? <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">{message}</p> : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[22rem_1fr_20rem]">
        <Card>
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
            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-5">
              {activeLesson.type === "video" ? (
                <div className="space-y-4">
                  {activeVideoSource.provider === "direct" ? (
                    <video
                      ref={videoRef}
                      src={activeVideoSource.playbackUrl}
                      controls
                      controlsList="nodownload noremoteplayback"
                      disablePictureInPicture
                      className="aspect-video w-full rounded-md bg-black"
                      onPlay={() => void persistLesson(activeLesson, "played", { complete: false })}
                      onPause={() => setMediaPlaying(false)}
                      onTimeUpdate={(event) => setMediaSeconds(event.currentTarget.currentTime)}
                      onEnded={() => void completeActive("watched")}
                    />
                  ) : activeVideoSource.isIframe ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-md border border-[hsl(var(--border))] bg-black">
                      <iframe
                        key={activeVideoSource.embedUrl}
                        ref={
                          activeVideoSource.provider === "vimeo"
                            ? vimeoRef
                            : activeVideoSource.provider === "youtube"
                              ? youtubeRef
                              : undefined
                        }
                        src={activeVideoSource.embedUrl}
                        title="Course video player"
                        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        className={embeddedVideoClass(activeVideoSource.provider)}
                      />
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
                  <div className="grid gap-2 rounded-md border border-[hsl(var(--border))] p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => previousLesson && void openLesson(previousLesson)} disabled={!previousLesson}>
                        <SkipBack className="size-4" />
                        Prev
                      </Button>
                      <Button size="sm" onClick={() => void togglePlayback()} disabled={!activeVideoSource.canUseToolbar}>
                        {mediaPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                        {mediaPlaying ? "Pause" : "Play"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => replayMedia()} disabled={!activeVideoSource.canUseToolbar}>
                        <RotateCcw className="size-4" />
                        Replay
                      </Button>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => skipMedia(-10)} disabled={!activeVideoSource.canUseToolbar}>
                        -10s
                      </Button>
                      <span className="flex h-9 items-center rounded-md border border-[hsl(var(--border))] px-3 text-xs text-[hsl(var(--muted-foreground))]">
                        {formatClock(mediaSeconds)}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => skipMedia(30)} disabled={!activeVideoSource.canUseToolbar}>
                        +30s
                      </Button>
                      <select
                        value={playbackRate}
                        onChange={(event) => changePlaybackRate(Number(event.target.value))}
                        disabled={!activeVideoSource.canUseToolbar}
                        className="h-9 rounded-md border border-[hsl(var(--border))] bg-transparent px-2 text-sm"
                        aria-label="Playback speed"
                      >
                        {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
                          <option key={speed} value={speed}>
                            {speed}x
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (nextLesson) void openLesson(nextLesson);
                        }}
                        disabled={!nextLesson || !lessonUnlocked(nextLesson.key)}
                      >
                        <SkipForward className="size-4" />
                        Next
                      </Button>
                    </div>
                  </div>
                  <Button onClick={() => void completeActive("watched")} disabled={savingKey === activeLesson.key}>
                    <CheckCircle2 className="size-4" />
                    Mark video watched
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
                      Build a small proof of work for this chapter. Include the decisions you made, the result, and the next improvement you would make.
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(activeLesson.resources.length
                      ? activeLesson.resources
                      : [{ label: `${activeLesson.title} workbook`, url: "#" }, { label: "Practice checklist", url: "#" }]
                    ).map((resource) => (
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
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {completedSet.has(activeLesson.key) ? "Completed" : "In progress"} - {activeLesson.moduleTitle} -{" "}
                {formatStudyTime(effectiveStudySecondsByLesson[activeLesson.key] ?? 0)} saved
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => void saveStudyTime()} disabled={savingKey === activeLesson.key || activeStudySeconds <= 0}>
                  <Timer className="size-4" />
                  Save study time
                </Button>
                <Button variant="outline" onClick={() => void completeActive("completed")} disabled={savingKey === activeLesson.key || activeLesson.type === "quiz"}>
                  <CheckCircle2 className="size-4" />
                  Complete lesson
                </Button>
                <Button
                  onClick={() => {
                    if (nextLesson) void openLesson(nextLesson);
                  }}
                  disabled={!nextLesson || !lessonUnlocked(nextLesson.key)}
                >
                  <Play className="size-4" />
                  Continue next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Instructor plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(course.outcomes.length ? course.outcomes : ["Finish every lesson", "Complete practical checkpoints", "Earn a verified certificate"]).map(
                (outcome, index) => (
                  <div key={outcome} className="rounded-md border border-[hsl(var(--border))] p-3">
                    <Badge>Outcome {index + 1}</Badge>
                    <p className="mt-2 text-sm font-medium">{outcome}</p>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {initialProgress.events.length ? (
                initialProgress.events.slice(0, 5).map((event, index) => (
                  <div key={`${event.lessonKey}-${event.createdAt}-${index}`} className="rounded-md border border-[hsl(var(--border))] p-3">
                    <p className="text-sm font-semibold">{event.lessonTitle ?? "Course activity"}</p>
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{event.action.replace(/_/g, " ")}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Your saved lesson activity will appear here.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="size-5 text-[hsl(var(--primary))]" />
                <CardTitle>Community</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-[hsl(var(--border))] p-3">
                {communityLoading && communityMessages.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading community...</p>
                ) : null}
                {communityMessages.map((item) => (
                  <div key={item.id} className="rounded-md border border-[hsl(var(--border))] p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{item.senderName}</p>
                      {item.isInstructor ? <Badge>Instructor</Badge> : null}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap leading-6 text-[hsl(var(--muted-foreground))]">{item.content}</p>
                  </div>
                ))}
                {!communityLoading && communityMessages.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Students in this course can meet here. The instructor can guide the group.
                  </p>
                ) : null}
              </div>
              <textarea
                value={communityDraft}
                onChange={(event) => setCommunityDraft(event.target.value)}
                placeholder="Ask the course community..."
                className="min-h-20 w-full rounded-md border border-[hsl(var(--border))] bg-transparent p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              />
              <Button className="w-full" onClick={() => void sendCommunityMessage()} disabled={communityLoading || !communityDraft.trim()}>
                <Send className="size-4" />
                Send to community
              </Button>
              {communityError ? <p className="text-sm text-[hsl(var(--destructive))]">{communityError}</p> : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
