"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PublishingStatus = "draft" | "submitted" | "changes_requested" | "approved" | "published" | "archived";

export type PlatformCourseDraft = {
  title: string;
  slug: string;
  level: string;
  category: string;
  price: string;
  compareAt: string;
  currency?: "USD" | "FRW";
  rating: number;
  learners: number;
  duration: string;
  lessons: number;
  progress: number;
  instructor: string;
  certificate: string;
  image: string;
  trailerUrl?: string;
  outcomes: string[];
  chapters: string[];
  tools: string[];
  status: PublishingStatus;
  createdAt: string;
  updatedAt: string;
};

export type PlatformProductDraft = {
  name: string;
  slug: string;
  type: string;
  price: string;
  compareAt: string;
  currency?: "USD" | "FRW";
  seller: string;
  stock: number;
  rating: number;
  downloads: number;
  category: string;
  delivery: string;
  image: string;
  images?: string[];
  tools: string[];
  status: PublishingStatus;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PlatformGigDraft = {
  title: string;
  slug: string;
  category: string;
  packageName: string;
  description: string;
  price: string;
  deliveryDays: number;
  revisions: number;
  freelancer: string;
  ownerId?: string;
  ownerName?: string;
  ownerAddress?: string;
  ownerCity?: string;
  ownerCountry?: string;
  image: string;
  tags: string[];
  deliverables: string[];
  rating: number;
  orders: number;
  status: PublishingStatus;
  createdAt: string;
  updatedAt: string;
};

export type CourseChapterDraft = {
  id: string;
  courseSlug: string;
  title: string;
  description: string;
  order: number;
  estimatedMinutes: number;
  requiredScore: number;
  isLocked: boolean;
};

export type CourseAssetDraft = {
  id: string;
  courseSlug: string;
  chapterId?: string;
  lessonId?: string;
  type: "image" | "video" | "book" | "document";
  title: string;
  fileName: string;
  url: string;
  provider?: "local" | "cloudinary" | "vimeo" | "external";
  thumbnailUrl?: string;
  embedUrl?: string;
  playbackUrl?: string;
  providerAssetId?: string;
  status?: string;
  sizeBytes?: number;
  durationSeconds?: number;
  createdAt: string;
};

export type CourseLessonType = "video" | "article" | "image" | "download" | "assignment" | "quiz";

export type CourseLessonResource = {
  label: string;
  url: string;
};

export type CourseLessonDraft = {
  id: string;
  courseSlug: string;
  chapterId: string;
  title: string;
  type: CourseLessonType;
  durationMinutes: number;
  summary: string;
  content: string;
  videoUrl?: string;
  imageUrl?: string;
  assetIds: string[];
  resources: CourseLessonResource[];
  isPreview: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type CourseQuestionDraft = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type CourseQuizDraft = {
  id: string;
  courseSlug: string;
  chapterId?: string;
  title: string;
  kind: "quiz" | "test";
  passingScore: number;
  maxAttempts: number;
  questions: CourseQuestionDraft[];
  createdAt: string;
};

export type StudentCourseRecord = {
  id: string;
  studentName: string;
  courseSlug: string;
  completedChapterIds: string[];
  averageScore: number;
  isBlocked: boolean;
  updatedAt: string;
};

export type WalletTransactionDraft = {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER" | "PURCHASE" | "REFERRAL_EARNING" | "COURSE_EARNING" | "PRODUCT_EARNING";
  amount: number;
  description: string;
  status: "completed" | "pending" | "failed";
  createdAt: string;
};

export type CertificateDraft = {
  courseSlug: string;
  courseTitle: string;
  verificationCode: string;
  issuedAt: string;
  template: string;
};

type PlatformState = {
  sidebarOpen: boolean;
  cartCount: number;
  cartItems: Record<string, number>;
  enrolledCourseSlugs: string[];
  courseProgress: Record<string, number>;
  certificates: CertificateDraft[];
  walletBalance: number;
  pendingBalance: number;
  walletTransactions: WalletTransactionDraft[];
  createdCourses: PlatformCourseDraft[];
  createdProducts: PlatformProductDraft[];
  createdGigs: PlatformGigDraft[];
  courseChapters: Record<string, CourseChapterDraft[]>;
  courseLessons: Record<string, CourseLessonDraft[]>;
  courseAssets: CourseAssetDraft[];
  courseQuizzes: CourseQuizDraft[];
  studentCourseRecords: Record<string, StudentCourseRecord[]>;
  completedChapters: Record<string, string[]>;
  courseScores: Record<string, number>;
  setSidebarOpen: (open: boolean) => void;
  setCartCount: (count: number) => void;
  createCourse: (course: Omit<PlatformCourseDraft, "slug" | "rating" | "learners" | "progress" | "createdAt" | "updatedAt">) => string;
  updateCourse: (slug: string, patch: Partial<Omit<PlatformCourseDraft, "slug" | "createdAt" | "updatedAt">>) => void;
  updateCourseStatus: (slug: string, status: PublishingStatus) => void;
  deleteCourse: (slug: string) => void;
  addCourseChapter: (courseSlug: string, chapter: Omit<CourseChapterDraft, "id" | "courseSlug" | "order">) => void;
  updateCourseChapter: (courseSlug: string, chapterId: string, patch: Partial<Omit<CourseChapterDraft, "id" | "courseSlug">>) => void;
  deleteCourseChapter: (courseSlug: string, chapterId: string) => void;
  toggleCourseChapterLock: (courseSlug: string, chapterId: string) => void;
  addCourseLesson: (courseSlug: string, lesson: Omit<CourseLessonDraft, "id" | "courseSlug" | "order" | "createdAt" | "updatedAt">) => string;
  updateCourseLesson: (courseSlug: string, lessonId: string, patch: Partial<Omit<CourseLessonDraft, "id" | "courseSlug" | "createdAt" | "updatedAt">>) => void;
  deleteCourseLesson: (courseSlug: string, lessonId: string) => void;
  attachAssetToLesson: (courseSlug: string, lessonId: string, assetId: string) => void;
  addCourseAsset: (asset: Omit<CourseAssetDraft, "id" | "createdAt">) => string;
  deleteCourseAsset: (assetId: string) => void;
  generateCourseQuiz: (courseSlug: string, kind: "quiz" | "test") => string;
  addCourseQuiz: (courseSlug: string, quiz: Omit<CourseQuizDraft, "id" | "courseSlug" | "createdAt">) => string;
  updateCourseQuiz: (quizId: string, patch: Partial<Omit<CourseQuizDraft, "id" | "courseSlug" | "createdAt" | "questions">>) => void;
  addCourseQuizQuestion: (quizId: string, question: Omit<CourseQuestionDraft, "id">) => void;
  updateCourseQuizQuestion: (quizId: string, questionId: string, patch: Partial<Omit<CourseQuestionDraft, "id">>) => void;
  deleteCourseQuizQuestion: (quizId: string, questionId: string) => void;
  replaceCourseQuizQuestions: (quizId: string, questions: Omit<CourseQuestionDraft, "id">[]) => void;
  deleteCourseQuiz: (quizId: string) => void;
  completeChapter: (courseSlug: string, chapterId: string) => void;
  recordCourseScore: (courseSlug: string, score: number) => void;
  updateStudentRecord: (courseSlug: string, studentId: string, patch: Partial<Omit<StudentCourseRecord, "id" | "courseSlug">>) => void;
  createProduct: (product: Omit<PlatformProductDraft, "slug" | "rating" | "downloads" | "createdAt" | "updatedAt">) => string;
  updateProduct: (slug: string, patch: Partial<Omit<PlatformProductDraft, "slug" | "createdAt" | "updatedAt">>) => void;
  updateProductStatus: (slug: string, status: PublishingStatus) => void;
  deleteProduct: (slug: string) => void;
  createGig: (gig: Omit<PlatformGigDraft, "slug" | "rating" | "orders" | "createdAt" | "updatedAt">) => string;
  updateGig: (slug: string, patch: Partial<Omit<PlatformGigDraft, "slug" | "createdAt" | "updatedAt">>) => void;
  updateGigStatus: (slug: string, status: PublishingStatus) => void;
  deleteGig: (slug: string) => void;
  addToCart: (slug: string) => void;
  updateCartQuantity: (slug: string, quantity: number) => void;
  clearCart: () => void;
  enrollCourse: (slug: string) => void;
  advanceCourse: (slug: string, amount?: number) => void;
  issueCertificate: (certificate: Omit<CertificateDraft, "verificationCode" | "issuedAt">) => void;
  deposit: (amount: number, description?: string) => void;
  withdraw: (amount: number, description?: string) => void;
  transfer: (amount: number, recipient: string) => void;
  purchase: (amount: number, description?: string) => void;
};

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 72);
}

function uniqueSlug(base: string, existingSlugs: string[]) {
  const normalized = slugify(base) || "untitled";

  if (!existingSlugs.includes(normalized)) {
    return normalized;
  }

  let index = 2;
  while (existingSlugs.includes(`${normalized}-${index}`)) {
    index += 1;
  }

  return `${normalized}-${index}`;
}

function createChapter(courseSlug: string, title: string, order: number): CourseChapterDraft {
  return {
    id: createId("chapter"),
    courseSlug,
    title,
    description: `${title} lessons, resources, quiz checks, and completion tracking.`,
    order,
    estimatedMinutes: 35 + order * 10,
    requiredScore: Math.min(85, Math.max(0, (order - 1) * 20)),
    isLocked: order > 1
  };
}

function createQuestions(courseTitle: string, seeds: string[], kind: "quiz" | "test"): CourseQuestionDraft[] {
  const source = seeds.length > 0 ? seeds : ["Core concept", "Practical workflow", "Final outcome"];

  return source.slice(0, kind === "test" ? 6 : 4).map((seed, index) => ({
    id: createId("question"),
    question: `${kind === "test" ? "Final test" : "Quiz"} ${index + 1}: What best demonstrates "${seed}" in ${courseTitle}?`,
    options: [
      `Apply ${seed.toLowerCase()} in a practical project`,
      "Skip the lesson and request a certificate",
      "Memorize the title only",
      "Disable progress tracking"
    ],
    correctIndex: 0,
    explanation: `The correct answer proves the learner can apply ${seed.toLowerCase()} in context.`
  }));
}

function createTransaction(
  type: WalletTransactionDraft["type"],
  amount: number,
  description: string,
  status: WalletTransactionDraft["status"] = "completed"
): WalletTransactionDraft {
  return {
    id: createId("txn"),
    type,
    amount,
    description,
    status,
    createdAt: nowIso()
  };
}

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set, get) => ({
  sidebarOpen: false,
  cartCount: 0,
  cartItems: {},
  enrolledCourseSlugs: [],
  courseProgress: {},
  certificates: [],
  walletBalance: 0,
  pendingBalance: 0,
  walletTransactions: [],
  createdCourses: [],
  createdProducts: [],
  createdGigs: [],
  courseChapters: {},
  courseLessons: {},
  courseAssets: [],
  courseQuizzes: [],
  studentCourseRecords: {},
  completedChapters: {},
  courseScores: {},
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setCartCount: (cartCount) => set({ cartCount }),
  createCourse: (course) => {
    const timestamp = nowIso();
    const slug = uniqueSlug(
      course.title,
      get().createdCourses.map((item) => item.slug)
    );
    const chapters = course.chapters.map((chapter, index) => createChapter(slug, chapter, index + 1));

    set((state) => ({
      createdCourses: [
        {
          ...course,
          slug,
          rating: 5,
          learners: 0,
          progress: 0,
          createdAt: timestamp,
          updatedAt: timestamp
        },
        ...state.createdCourses
      ],
      courseChapters: {
        ...state.courseChapters,
        [slug]: chapters
      },
      courseLessons: {
        ...state.courseLessons,
        [slug]: []
      },
      studentCourseRecords: {
        ...state.studentCourseRecords,
        [slug]: []
      }
    }));

    return slug;
  },
  updateCourse: (slug, patch) =>
    set((state) => ({
      createdCourses: state.createdCourses.map((course) =>
        course.slug === slug ? { ...course, ...patch, updatedAt: nowIso() } : course
      )
    })),
  updateCourseStatus: (slug, status) =>
    set((state) => ({
      createdCourses: state.createdCourses.map((course) =>
        course.slug === slug ? { ...course, status, updatedAt: nowIso() } : course
      )
    })),
  deleteCourse: (slug) =>
    set((state) => ({
      createdCourses: state.createdCourses.filter((course) => course.slug !== slug),
      enrolledCourseSlugs: state.enrolledCourseSlugs.filter((courseSlug) => courseSlug !== slug),
      courseAssets: state.courseAssets.filter((asset) => asset.courseSlug !== slug),
      courseQuizzes: state.courseQuizzes.filter((quiz) => quiz.courseSlug !== slug),
      courseChapters: Object.fromEntries(Object.entries(state.courseChapters).filter(([courseSlug]) => courseSlug !== slug)),
      courseLessons: Object.fromEntries(Object.entries(state.courseLessons).filter(([courseSlug]) => courseSlug !== slug)),
      studentCourseRecords: Object.fromEntries(
        Object.entries(state.studentCourseRecords).filter(([courseSlug]) => courseSlug !== slug)
      )
    })),
  addCourseChapter: (courseSlug, chapter) =>
    set((state) => {
      const existing = state.courseChapters[courseSlug] ?? [];
      const nextChapter = {
        ...chapter,
        id: createId("chapter"),
        courseSlug,
        order: existing.length + 1
      };

      return {
        courseChapters: {
          ...state.courseChapters,
          [courseSlug]: [...existing, nextChapter]
        },
        courseLessons: {
          ...state.courseLessons,
          [courseSlug]: state.courseLessons[courseSlug] ?? []
        },
        createdCourses: state.createdCourses.map((course) =>
          course.slug === courseSlug
            ? {
                ...course,
                chapters: [...course.chapters, chapter.title],
                updatedAt: nowIso()
              }
            : course
        )
      };
    }),
  updateCourseChapter: (courseSlug, chapterId, patch) =>
    set((state) => {
      const nextChapters = (state.courseChapters[courseSlug] ?? []).map((chapter) =>
        chapter.id === chapterId ? { ...chapter, ...patch } : chapter
      );

      return {
        courseChapters: {
          ...state.courseChapters,
          [courseSlug]: nextChapters
        },
        createdCourses: state.createdCourses.map((course) =>
          course.slug === courseSlug
            ? {
                ...course,
                chapters: nextChapters.map((chapter) => chapter.title),
                updatedAt: nowIso()
              }
            : course
        )
      };
    }),
  deleteCourseChapter: (courseSlug, chapterId) =>
    set((state) => {
      const nextChapters = (state.courseChapters[courseSlug] ?? [])
        .filter((chapter) => chapter.id !== chapterId)
        .map((chapter, index) => ({ ...chapter, order: index + 1 }));

      return {
        courseChapters: {
          ...state.courseChapters,
          [courseSlug]: nextChapters
        },
        createdCourses: state.createdCourses.map((course) =>
          course.slug === courseSlug
            ? {
                ...course,
                chapters: nextChapters.map((chapter) => chapter.title),
                lessons: nextChapters.length,
                updatedAt: nowIso()
              }
            : course
        ),
        completedChapters: {
          ...state.completedChapters,
          [courseSlug]: (state.completedChapters[courseSlug] ?? []).filter((completedId) => completedId !== chapterId)
        }
      };
    }),
  toggleCourseChapterLock: (courseSlug, chapterId) =>
    set((state) => ({
      courseChapters: {
        ...state.courseChapters,
        [courseSlug]: (state.courseChapters[courseSlug] ?? []).map((chapter) =>
          chapter.id === chapterId ? { ...chapter, isLocked: !chapter.isLocked } : chapter
        )
      }
    })),
  addCourseLesson: (courseSlug, lesson) => {
    const timestamp = nowIso();
    const lessonId = createId("lesson");

    set((state) => {
      const existing = state.courseLessons[courseSlug] ?? [];
      const chapterLessons = existing.filter((item) => item.chapterId === lesson.chapterId);
      const nextLesson: CourseLessonDraft = {
        ...lesson,
        id: lessonId,
        courseSlug,
        order: chapterLessons.length + 1,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      return {
        courseLessons: {
          ...state.courseLessons,
          [courseSlug]: [...existing, nextLesson]
        },
        createdCourses: state.createdCourses.map((course) =>
          course.slug === courseSlug
            ? {
                ...course,
                lessons: existing.length + 1,
                updatedAt: timestamp
              }
            : course
        )
      };
    });

    return lessonId;
  },
  updateCourseLesson: (courseSlug, lessonId, patch) =>
    set((state) => ({
      courseLessons: {
        ...state.courseLessons,
        [courseSlug]: (state.courseLessons[courseSlug] ?? []).map((lesson) =>
          lesson.id === lessonId ? { ...lesson, ...patch, updatedAt: nowIso() } : lesson
        )
      },
      createdCourses: state.createdCourses.map((course) =>
        course.slug === courseSlug ? { ...course, updatedAt: nowIso() } : course
      )
    })),
  deleteCourseLesson: (courseSlug, lessonId) =>
    set((state) => {
      const remaining = (state.courseLessons[courseSlug] ?? []).filter((lesson) => lesson.id !== lessonId);
      const reordered = remaining.map((lesson) => ({
        ...lesson,
        order: remaining.filter((item) => item.chapterId === lesson.chapterId && item.order <= lesson.order).length
      }));

      return {
        courseLessons: {
          ...state.courseLessons,
          [courseSlug]: reordered
        },
        courseAssets: state.courseAssets.map((asset) =>
          asset.lessonId === lessonId ? { ...asset, lessonId: undefined } : asset
        ),
        createdCourses: state.createdCourses.map((course) =>
          course.slug === courseSlug ? { ...course, lessons: reordered.length, updatedAt: nowIso() } : course
        )
      };
    }),
  attachAssetToLesson: (courseSlug, lessonId, assetId) =>
    set((state) => {
      const asset = state.courseAssets.find((item) => item.id === assetId);
      const lesson = (state.courseLessons[courseSlug] ?? []).find((item) => item.id === lessonId);

      if (!asset || !lesson) return state;

      const assetUrl = asset.embedUrl || asset.playbackUrl || asset.url;
      const nextResources =
        asset.type === "video"
          ? lesson.resources
          : lesson.resources.some((resource) => resource.url === asset.url)
            ? lesson.resources
            : [...lesson.resources, { label: asset.title, url: asset.url }];

      return {
        courseLessons: {
          ...state.courseLessons,
          [courseSlug]: (state.courseLessons[courseSlug] ?? []).map((item) =>
            item.id === lessonId
              ? {
                  ...item,
                  type: asset.type === "video" ? "video" : asset.type === "image" ? "image" : item.type,
                  videoUrl: asset.type === "video" ? assetUrl : item.videoUrl,
                  imageUrl: asset.type === "image" ? asset.url : item.imageUrl,
                  assetIds: item.assetIds.includes(assetId) ? item.assetIds : [...item.assetIds, assetId],
                  resources: nextResources,
                  updatedAt: nowIso()
                }
              : item
          )
        },
        courseAssets: state.courseAssets.map((item) =>
          item.id === assetId ? { ...item, chapterId: lesson.chapterId, lessonId } : item
        )
      };
    }),
  addCourseAsset: (asset) => {
    const id = createId("asset");

    set((state) => ({
      courseAssets: [
        {
          ...asset,
          id,
          createdAt: nowIso()
        },
        ...state.courseAssets
      ]
    }));

    return id;
  },
  deleteCourseAsset: (assetId) =>
    set((state) => ({
      courseAssets: state.courseAssets.filter((asset) => asset.id !== assetId),
      courseLessons: Object.fromEntries(
        Object.entries(state.courseLessons).map(([courseSlug, lessons]) => [
          courseSlug,
          lessons.map((lesson) => ({
            ...lesson,
            assetIds: lesson.assetIds.filter((id) => id !== assetId),
            resources: lesson.resources.filter((resource) => !state.courseAssets.some((asset) => asset.id === assetId && asset.url === resource.url))
          }))
        ])
      )
    })),
  generateCourseQuiz: (courseSlug, kind) => {
    const course = get().createdCourses.find((item) => item.slug === courseSlug);
    const chapters = get().courseChapters[courseSlug] ?? [];
    const quizId = createId(kind);

    set((state) => ({
      courseQuizzes: [
        {
          id: quizId,
          courseSlug,
          chapterId: kind === "quiz" ? chapters[0]?.id : undefined,
          title: `${course?.title ?? "Course"} ${kind === "test" ? "final test" : "chapter quiz"}`,
          kind,
          passingScore: kind === "test" ? 80 : 70,
          maxAttempts: kind === "test" ? 2 : 3,
          questions: createQuestions(course?.title ?? "Course", [...(course?.outcomes ?? []), ...chapters.map((chapter) => chapter.title)], kind),
          createdAt: nowIso()
        },
        ...state.courseQuizzes
      ]
    }));

    return quizId;
  },
  addCourseQuiz: (courseSlug, quiz) => {
    const quizId = createId(quiz.kind);

    set((state) => ({
      courseQuizzes: [
        {
          ...quiz,
          id: quizId,
          courseSlug,
          questions: quiz.questions.map((question) => ({
            ...question,
            id: createId("question")
          })),
          createdAt: nowIso()
        },
        ...state.courseQuizzes
      ]
    }));

    return quizId;
  },
  updateCourseQuiz: (quizId, patch) =>
    set((state) => ({
      courseQuizzes: state.courseQuizzes.map((quiz) =>
        quiz.id === quizId ? { ...quiz, ...patch } : quiz
      )
    })),
  addCourseQuizQuestion: (quizId, question) =>
    set((state) => ({
      courseQuizzes: state.courseQuizzes.map((quiz) =>
        quiz.id === quizId
          ? {
              ...quiz,
              questions: [
                ...quiz.questions,
                {
                  ...question,
                  id: createId("question")
                }
              ]
            }
          : quiz
      )
    })),
  updateCourseQuizQuestion: (quizId, questionId, patch) =>
    set((state) => ({
      courseQuizzes: state.courseQuizzes.map((quiz) =>
        quiz.id === quizId
          ? {
              ...quiz,
              questions: quiz.questions.map((question) =>
                question.id === questionId ? { ...question, ...patch } : question
              )
            }
          : quiz
      )
    })),
  deleteCourseQuizQuestion: (quizId, questionId) =>
    set((state) => ({
      courseQuizzes: state.courseQuizzes.map((quiz) =>
        quiz.id === quizId
          ? {
              ...quiz,
              questions: quiz.questions.filter((question) => question.id !== questionId)
            }
          : quiz
      )
    })),
  replaceCourseQuizQuestions: (quizId, questions) =>
    set((state) => ({
      courseQuizzes: state.courseQuizzes.map((quiz) =>
        quiz.id === quizId
          ? {
              ...quiz,
              questions: questions.map((question) => ({
                ...question,
                id: createId("question")
              }))
            }
          : quiz
      )
    })),
  deleteCourseQuiz: (quizId) =>
    set((state) => ({
      courseQuizzes: state.courseQuizzes.filter((quiz) => quiz.id !== quizId)
    })),
  completeChapter: (courseSlug, chapterId) =>
    set((state) => {
      const existing = state.completedChapters[courseSlug] ?? [];
      const chapters = state.courseChapters[courseSlug] ?? [];
      const nextCompleted = existing.includes(chapterId) ? existing : [...existing, chapterId];

      return {
        completedChapters: {
          ...state.completedChapters,
          [courseSlug]: nextCompleted
        },
        courseProgress: {
          ...state.courseProgress,
          [courseSlug]: chapters.length > 0 ? Math.round((nextCompleted.length / chapters.length) * 100) : state.courseProgress[courseSlug] ?? 0
        }
      };
    }),
  recordCourseScore: (courseSlug, score) =>
    set((state) => ({
      courseScores: {
        ...state.courseScores,
        [courseSlug]: Math.min(100, Math.max(0, score))
      }
    })),
  updateStudentRecord: (courseSlug, studentId, patch) =>
    set((state) => ({
      studentCourseRecords: {
        ...state.studentCourseRecords,
        [courseSlug]: (state.studentCourseRecords[courseSlug] ?? []).map((student) =>
          student.id === studentId ? { ...student, ...patch, updatedAt: nowIso() } : student
        )
      }
    })),
  createProduct: (product) => {
    const timestamp = nowIso();
    const slug = uniqueSlug(
      product.name,
      get().createdProducts.map((item) => item.slug)
    );

    set((state) => ({
      createdProducts: [
        {
          ...product,
          slug,
          rating: 5,
          downloads: 0,
          createdAt: timestamp,
          updatedAt: timestamp
        },
        ...state.createdProducts
      ]
    }));

    return slug;
  },
  updateProduct: (slug, patch) =>
    set((state) => ({
      createdProducts: state.createdProducts.map((product) =>
        product.slug === slug ? { ...product, ...patch, updatedAt: nowIso() } : product
      )
    })),
  updateProductStatus: (slug, status) =>
    set((state) => ({
      createdProducts: state.createdProducts.map((product) =>
        product.slug === slug ? { ...product, status, updatedAt: nowIso() } : product
      )
    })),
  deleteProduct: (slug) =>
    set((state) => {
      const nextCart = { ...state.cartItems };
      delete nextCart[slug];

      return {
        createdProducts: state.createdProducts.filter((product) => product.slug !== slug),
        cartItems: nextCart,
        cartCount: Object.values(nextCart).reduce((total, quantity) => total + quantity, 0)
      };
    }),
  createGig: (gig) => {
    const timestamp = nowIso();
    const slug = uniqueSlug(
      gig.title,
      get().createdGigs.map((item) => item.slug)
    );

    set((state) => ({
      createdGigs: [
        {
          ...gig,
          slug,
          rating: 5,
          orders: 0,
          createdAt: timestamp,
          updatedAt: timestamp
        },
        ...state.createdGigs
      ]
    }));

    return slug;
  },
  updateGig: (slug, patch) =>
    set((state) => ({
      createdGigs: state.createdGigs.map((gig) =>
        gig.slug === slug ? { ...gig, ...patch, updatedAt: nowIso() } : gig
      )
    })),
  updateGigStatus: (slug, status) =>
    set((state) => ({
      createdGigs: state.createdGigs.map((gig) =>
        gig.slug === slug ? { ...gig, status, updatedAt: nowIso() } : gig
      )
    })),
  deleteGig: (slug) =>
    set((state) => ({
      createdGigs: state.createdGigs.filter((gig) => gig.slug !== slug)
    })),
  addToCart: (slug) =>
    set((state) => {
      const nextCart = { ...state.cartItems, [slug]: (state.cartItems[slug] ?? 0) + 1 };
      const nextCount = Object.values(nextCart).reduce((total, quantity) => total + quantity, 0);

      return {
        cartItems: nextCart,
        cartCount: nextCount
      };
    }),
  updateCartQuantity: (slug, quantity) =>
    set((state) => {
      const nextCart = { ...state.cartItems };

      if (quantity <= 0) {
        delete nextCart[slug];
      } else {
        nextCart[slug] = quantity;
      }

      return {
        cartItems: nextCart,
        cartCount: Object.values(nextCart).reduce((total, itemQuantity) => total + itemQuantity, 0)
      };
    }),
  clearCart: () => set({ cartItems: {}, cartCount: 0 }),
  enrollCourse: (slug) =>
    set((state) => ({
      enrolledCourseSlugs: state.enrolledCourseSlugs.includes(slug)
        ? state.enrolledCourseSlugs
        : [...state.enrolledCourseSlugs, slug],
      courseProgress: {
        ...state.courseProgress,
        [slug]: state.courseProgress[slug] ?? 0
      }
    })),
  advanceCourse: (slug, amount = 12) =>
    set((state) => ({
      courseProgress: {
        ...state.courseProgress,
        [slug]: Math.min(100, (state.courseProgress[slug] ?? 0) + amount)
      }
    })),
  issueCertificate: (certificate) =>
    set((state) => {
      if (state.certificates.some((item) => item.courseSlug === certificate.courseSlug)) {
        return state;
      }

      return {
        certificates: [
          ...state.certificates,
          {
            ...certificate,
            verificationCode: `MRC-${certificate.courseSlug.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(
              1000 + Math.random() * 8999
            )}`,
            issuedAt: nowIso()
          }
        ]
      };
    }),
  deposit: (amount, description = "Wallet deposit") =>
    set((state) => ({
      walletBalance: state.walletBalance + amount,
      walletTransactions: [createTransaction("DEPOSIT", amount, description), ...state.walletTransactions]
    })),
  withdraw: (amount, description = "Withdrawal request") =>
    set((state) => {
      const approvedAmount = Math.min(amount, state.walletBalance);

      return {
        walletBalance: state.walletBalance - approvedAmount,
        pendingBalance: state.pendingBalance + approvedAmount,
        walletTransactions: [
          createTransaction("WITHDRAWAL", -approvedAmount, description, "pending"),
          ...state.walletTransactions
        ]
      };
    }),
  transfer: (amount, recipient) =>
    set((state) => {
      const approvedAmount = Math.min(amount, state.walletBalance);

      return {
        walletBalance: state.walletBalance - approvedAmount,
        walletTransactions: [
          createTransaction("TRANSFER", -approvedAmount, `Transfer to ${recipient}`),
          ...state.walletTransactions
        ]
      };
    }),
  purchase: (amount, description = "Wallet purchase") =>
    set((state) => {
      const approvedAmount = Math.min(amount, state.walletBalance);

      return {
        walletBalance: state.walletBalance - approvedAmount,
        walletTransactions: [createTransaction("PURCHASE", -approvedAmount, description), ...state.walletTransactions]
      };
    })
    }),
    {
      name: "mr-creativist-platform-store",
      version: 3,
      migrate: (persistedState) => {
        const state = persistedState as Partial<PlatformState>;

        return {
          ...state,
          enrolledCourseSlugs: [],
          courseProgress: {},
          certificates: [],
          walletBalance: 0,
          pendingBalance: 0,
          walletTransactions: [],
          createdCourses: [],
          createdProducts: [],
          createdGigs: [],
          courseChapters: {},
          courseLessons: {},
          courseAssets: [],
          courseQuizzes: [],
          studentCourseRecords: {},
          completedChapters: {},
          courseScores: {}
        } as PlatformState;
      },
      partialize: (state) => ({
        cartCount: state.cartCount,
        cartItems: state.cartItems,
        enrolledCourseSlugs: state.enrolledCourseSlugs,
        courseProgress: state.courseProgress,
        certificates: state.certificates,
        walletBalance: state.walletBalance,
        pendingBalance: state.pendingBalance,
        walletTransactions: state.walletTransactions,
        createdCourses: state.createdCourses,
        createdProducts: state.createdProducts,
        createdGigs: state.createdGigs,
        courseChapters: state.courseChapters,
        courseLessons: state.courseLessons,
        courseAssets: state.courseAssets,
        courseQuizzes: state.courseQuizzes,
        studentCourseRecords: state.studentCourseRecords,
        completedChapters: state.completedChapters,
        courseScores: state.courseScores
      })
    }
  )
);
