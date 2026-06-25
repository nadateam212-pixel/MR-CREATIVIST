import { connectMongoDB, friendlyMongoError, hasMongoConfig } from "@/lib/mongodb";
import { envNumber } from "@/lib/env";
import { normalizeCourseImage } from "@/lib/course-media";
import { DATABASE_MEDIA_FALLBACK_IMAGE, databaseMediaUrl } from "@/lib/database-media";
import AITool from "@/models/AITool";
import BlogPost from "@/models/BlogPost";
import ConsultingService from "@/models/ConsultingService";
import Course from "@/models/Course";
import FreelancerProfile from "@/models/FreelancerProfile";
import Gig from "@/models/Gig";
import JobPost from "@/models/JobPost";
import MultimediaProject from "@/models/MultimediaProject";
import Product from "@/models/Product";
import ShopProfile from "@/models/ShopProfile";
import User from "@/models/User";

const PRODUCT_FALLBACK_IMAGE = DATABASE_MEDIA_FALLBACK_IMAGE;

if (!globalThis.__mrCreativistPublicQueryCache) {
  globalThis.__mrCreativistPublicQueryCache = new Map();
}

const publicQueryCache = globalThis.__mrCreativistPublicQueryCache;

function stableOptions(options = {}) {
  return Object.fromEntries(
    Object.entries(options)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .sort(([left], [right]) => left.localeCompare(right))
  );
}

function publicCacheKey(collection, options = {}) {
  if (options.ownerId || options.all || options.noCache) return "";

  return `${collection}:${JSON.stringify(stableOptions(options))}`;
}

function publicCacheTtlMs() {
  return Math.max(5, envNumber("MONGODB_PUBLIC_CACHE_SECONDS", 60)) * 1000;
}

function readPublicCache(key, allowStale = false) {
  if (!key) return undefined;

  const cached = publicQueryCache.get(key);
  if (!cached) return undefined;

  if (allowStale || Date.now() - cached.createdAt < publicCacheTtlMs()) {
    return cached.value;
  }

  publicQueryCache.delete(key);
  return undefined;
}

function writePublicCache(key, value) {
  if (!key) return value;

  publicQueryCache.set(key, {
    value,
    createdAt: Date.now()
  });

  return value;
}

export function clearPublicQueryCache() {
  publicQueryCache.clear();
}

function money(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value ?? 0);
}

function cleanJson(doc) {
  const value = typeof doc?.toObject === "function" ? doc.toObject({ virtuals: true }) : doc;

  return JSON.parse(JSON.stringify(value));
}

export function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

function activeStatusFilter() {
  return { status: { $ne: "archived" } };
}

export function normalizeCourse(doc, options = {}) {
  const course = cleanJson(doc);
  const includeImage = options.includeImage !== false;
  const instructorRecord = course.instructorId && typeof course.instructorId === "object" ? course.instructorId : null;
  const modules = course.modules ?? [];
  const chapters = modules.length ? modules.map((module) => module.title) : course.chapters ?? [];
  const computedLessonsCount = modules.reduce((total, module) => total + (module.lessons?.length ?? 0), 0);
  const lessonsCount =
    computedLessonsCount > 0 ? computedLessonsCount : course.lessonsCount ?? 0;
  const category = course.category ?? "Course";
  const outcomes =
    Array.isArray(course.outcomes) && course.outcomes.length
      ? course.outcomes
      : [];
  const tools = Array.isArray(course.tools) && course.tools.length ? course.tools : [];
  const numericPrice = Number(course.price ?? 0);
  const rawPricingType = course.pricingType ?? "";
  const pricingType =
    rawPricingType === "subscription" || rawPricingType === "manual"
      ? rawPricingType
      : rawPricingType === "free" || numericPrice <= 0
        ? "free"
        : "paid";
  const accessType =
    pricingType === "subscription" || pricingType === "manual"
      ? "premium"
      : pricingType === "free" || numericPrice <= 0
        ? "free"
        : "paid";
  const likes = Number(course.likes ?? Math.round(Number(course.enrolledCount ?? course.learners ?? 0) * 0.18 + Number(course.rating ?? 0) * 24));
  const shareCount = Number(course.shareCount ?? 0);
  const commentCount = Number(course.commentCount ?? 0);
  const replyCount = Number(course.replyCount ?? 0);

  return {
    id: course._id ?? course.id ?? course.slug,
    studioId: course.studioId ?? "",
    title: course.title ?? "Untitled course",
    slug: course.slug,
    level: course.level ?? "Beginner",
    category,
    price: typeof course.price === "string" ? course.price : money(course.price, course.currency),
    compareAt:
      typeof course.compareAt === "string"
        ? course.compareAt
        : course.compareAtPrice
          ? money(course.compareAtPrice, course.currency)
          : "",
    rating: Number(course.rating ?? 0),
    learners: Number(course.enrolledCount ?? course.learners ?? 0),
    likes,
    shareCount,
    commentCount,
    replyCount,
    pricingType,
    accessType,
    duration: course.duration ?? "Self-paced",
    lessons: Number(lessonsCount ?? 0),
    progress: Number(course.progress ?? 0),
    instructorId: instructorRecord?._id ?? course.instructorId,
    instructor: course.instructorName ?? instructorRecord?.name ?? course.instructor ?? "MR Creativist",
    instructorEmail: instructorRecord?.email,
    instructorAvatar: instructorRecord?.profileImage,
    instructorVerified: Boolean(instructorRecord?.isVerified),
    isVerified: Boolean(instructorRecord?.isVerified),
    certificate: course.certificate ?? "Completion certificate",
    image: includeImage ? normalizeCourseImage(course.image, category) : databaseMediaUrl("courses", course),
    trailerUrl: course.trailerUrl ?? "",
    description: course.description ?? course.shortDescription,
    outcomes,
    chapters,
    tools,
    modules,
    resources: Array.isArray(course.resources) ? course.resources : [],
    status: course.status,
    isFeatured: Boolean(course.isFeatured),
    createdAt: course.createdAt,
    updatedAt: course.updatedAt
  };
}

export function normalizeProduct(doc, options = {}) {
  const product = cleanJson(doc);
  const includeImages = options.includeImages !== false;
  const image = includeImages ? product.image ?? product.images?.[0] : databaseMediaUrl("products", product, PRODUCT_FALLBACK_IMAGE);
  const sellerRecord = product.sellerId && typeof product.sellerId === "object" ? product.sellerId : null;
  const sellerVerified = Boolean(sellerRecord?.isVerified);

  return {
    id: product._id ?? product.id ?? product.slug,
    studioId: product.studioId ?? "",
    sellerId: sellerRecord?._id ?? product.sellerId,
    name: product.name,
    slug: product.slug,
    type: product.type,
    description: product.description,
    price: typeof product.price === "string" ? product.price : money(product.price, product.currency),
    compareAt:
      typeof product.compareAt === "string"
        ? product.compareAt
        : product.compareAtPrice
          ? money(product.compareAtPrice, product.currency)
          : "",
    seller: product.sellerName ?? sellerRecord?.name ?? product.seller ?? "MR Creativist Studio",
    sellerEmail: sellerRecord?.email,
    sellerPhone: sellerRecord?.phone,
    stock: product.stock ?? 0,
    rating: product.rating ?? 0,
    downloads: product.downloads ?? 0,
    category: product.category,
    location: product.location || "Kigali, Rwanda",
    delivery: product.delivery,
    image: image || PRODUCT_FALLBACK_IMAGE,
    images: includeImages ? product.images ?? [image].filter(Boolean) : [],
    tools: product.tools ?? [],
    status: product.status,
    isFeatured: Boolean(product.isFeatured),
    isVerified: sellerVerified,
    sellerVerified,
    listingVerified: Boolean(product.isVerified),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
}

export function normalizeJobPost(doc) {
  const job = cleanJson(doc);

  return {
    id: job._id ?? job.id ?? job.slug,
    title: job.title,
    slug: job.slug,
    companyName: job.companyName,
    companyLogo: job.companyLogo,
    location: job.location,
    workplaceType: job.workplaceType,
    employmentType: job.employmentType,
    salaryMin: Number(job.salaryMin ?? 0),
    salaryMax: Number(job.salaryMax ?? 0),
    currency: job.currency ?? "USD",
    category: job.category,
    description: job.description,
    responsibilities: job.responsibilities ?? [],
    requirements: job.requirements ?? [],
    benefits: job.benefits ?? [],
    skills: job.skills ?? [],
    applyUrl: job.applyUrl,
    contactEmail: job.contactEmail,
    applicationDeadline: job.applicationDeadline,
    postedById: job.postedById,
    postedByName: job.postedByName,
    status: job.status,
    isFeatured: Boolean(job.isFeatured),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  };
}

export function normalizeShopProfile(doc) {
  const shop = cleanJson(doc);
  const ownerRecord = shop.ownerId && typeof shop.ownerId === "object" ? shop.ownerId : null;
  const logo = shop.logo || "/icons/logo.png";
  const coverImage = shop.coverImage || "";

  return {
    id: shop._id ?? shop.id ?? shop.slug,
    studioId: shop.studioId ?? "",
    ownerId: ownerRecord?._id ?? shop.ownerId,
    ownerName: ownerRecord?.name ?? shop.ownerName,
    name: shop.name,
    slug: shop.slug,
    tagline: shop.tagline,
    description: shop.description,
    category: shop.category,
    logo,
    coverImage,
    contactName: shop.contactName,
    contactEmail: shop.contactEmail,
    phone: shop.phone,
    whatsapp: shop.whatsapp,
    website: shop.website,
    address: shop.address,
    city: shop.city,
    country: shop.country,
    openingHours: shop.openingHours,
    productsOrServices: shop.productsOrServices ?? [],
    tags: shop.tags ?? [],
    rating: Number(shop.rating ?? 0),
    status: shop.status,
    isFeatured: Boolean(shop.isFeatured),
    isVerified: Boolean(ownerRecord?.isVerified),
    ownerVerified: Boolean(ownerRecord?.isVerified),
    listingVerified: Boolean(shop.isVerified),
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt
  };
}

export function normalizeBlogPost(doc) {
  const post = cleanJson(doc);

  return {
    id: post._id ?? post.id ?? post.slug,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    image: post.image,
    content: post.content,
    published: Boolean(post.published),
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    authorName: post.authorName ?? "MR Creativist",
    authorEmail: post.authorEmail,
    categoryName: post.categoryName ?? "Platform Updates",
    categorySlug: post.categorySlug ?? "platform-updates"
  };
}

export function normalizeConsultingService(doc) {
  const service = cleanJson(doc);
  const expertRecord = service.expertId && typeof service.expertId === "object" ? service.expertId : null;
  const expertVerified = Boolean(expertRecord?.isVerified);

  return {
    id: service._id ?? service.id ?? service.slug,
    studioId: service.studioId ?? "",
    expertId: expertRecord?._id ?? service.expertId,
    name: service.expertName ?? expertRecord?.name ?? service.name,
    slug: service.slug,
    title: service.expertTitle ?? service.title,
    serviceTitle: service.title,
    rate: typeof service.rate === "string" ? service.rate : `${money(service.hourlyRate, service.currency)} / HOUR`,
    hourlyRate: service.hourlyRate,
    rating: service.rating ?? 0,
    expertise: service.expertise ?? [],
    languages: service.languages ?? ["English"],
    description: service.description,
    sessionTypes: service.sessionTypes ?? [],
    availability: service.availability ?? [],
    image: service.heroImage ?? service.avatar,
    status: service.status,
    isVerified: expertVerified,
    expertVerified,
    listingVerified: Boolean(service.isVerified),
    createdAt: service.createdAt,
    updatedAt: service.updatedAt
  };
}

export function normalizeFreelancer(doc) {
  const freelancer = cleanJson(doc);
  const userRecord = freelancer.userId && typeof freelancer.userId === "object" ? freelancer.userId : null;
  const listingVerified = Boolean(freelancer.isVerified);
  const accountVerified = Boolean(userRecord?.isVerified ?? listingVerified);
  const verified = accountVerified || listingVerified;

  return {
    id: userRecord?._id ?? freelancer.userId ?? freelancer.slug ?? freelancer._id,
    profileId: freelancer._id ?? freelancer.id ?? freelancer.slug,
    slug: freelancer.slug,
    studioId: freelancer.studioId ?? "",
    name: freelancer.name ?? userRecord?.name,
    role: freelancer.role,
    specialty: freelancer.specialty,
    location: freelancer.location,
    rate: freelancer.hourlyRate ?? freelancer.rate,
    rating: freelancer.rating ?? 0,
    completed: freelancer.completedJobs ?? freelancer.completed ?? 0,
    responseHours: freelancer.responseHours ?? 24,
    availability: freelancer.availabilityPercent ?? freelancer.availability ?? 60,
    portfolio: freelancer.portfolioScore ?? freelancer.portfolio ?? 80,
    portfolioScore: freelancer.portfolioScore ?? 80,
    portfolioItems: Array.isArray(freelancer.portfolio) ? freelancer.portfolio : [],
    gigs: freelancer.gigs ?? [],
    reviews: freelancer.reviews ?? [],
    bio: freelancer.bio ?? "",
    languages: freelancer.languages ?? [],
    skills: freelancer.skills ?? [],
    verified: freelancer.verifiedBadges ?? freelancer.verified ?? [],
    isVerified: verified,
    accountVerified,
    listingVerified,
    image: userRecord?.profileImage ?? freelancer.image,
    userEmail: userRecord?.email,
    userPhone: userRecord?.phone,
    socialLinks: userRecord?.socialLinks ?? {},
    status: freelancer.status,
    createdAt: freelancer.createdAt,
    updatedAt: freelancer.updatedAt
  };
}

export function normalizeGig(doc, options = {}) {
  const gig = cleanJson(doc);
  const includeImage = options.includeImage !== false;
  const ownerRecord = gig.ownerId && typeof gig.ownerId === "object" ? gig.ownerId : null;
  const ownerVerified = Boolean(ownerRecord?.isVerified);
  const image = includeImage ? gig.image : databaseMediaUrl("gigs", gig);

  return {
    id: gig._id ?? gig.id ?? gig.slug,
    studioId: gig.studioId ?? "",
    ownerId: ownerRecord?._id ?? gig.ownerId,
    ownerName: ownerRecord?.name ?? gig.ownerName,
    ownerImage: ownerRecord?.profileImage ?? gig.ownerImage ?? image,
    ownerEmail: ownerRecord?.email,
    ownerPhone: ownerRecord?.phone,
    slug: gig.slug,
    title: gig.title,
    category: gig.category,
    packageName: gig.packageName,
    description: gig.description,
    price: typeof gig.price === "string" ? gig.price : money(gig.price, gig.currency),
    currency: gig.currency ?? "USD",
    deliveryDays: Number(gig.deliveryDays ?? 1),
    revisions: Number(gig.revisions ?? 0),
    ownerAddress: gig.ownerAddress,
    ownerCity: gig.ownerCity,
    ownerCountry: gig.ownerCountry,
    image,
    images: includeImage ? (gig.images?.length ? gig.images : [image].filter(Boolean)) : [],
    tags: gig.tags ?? [],
    deliverables: gig.deliverables ?? [],
    rating: Number(gig.rating ?? 0),
    orders: Number(gig.orders ?? 0),
    status: gig.status,
    isFeatured: Boolean(gig.isFeatured),
    isVerified: ownerVerified,
    ownerVerified,
    listingVerified: Boolean(gig.isVerified),
    createdAt: gig.createdAt,
    updatedAt: gig.updatedAt
  };
}

export function normalizeAITool(doc) {
  const tool = cleanJson(doc);

  return {
    id: tool._id ?? tool.slug,
    name: tool.name,
    slug: tool.slug,
    description: tool.description,
    category: tool.category,
    icon: tool.icon ?? "sparkles",
    demoUrl: tool.demoUrl,
    pricingPlan: tool.pricingPlan,
    apiAvailable: Boolean(tool.apiAvailable),
    features: tool.features ?? [],
    usageCount: tool.usageCount ?? 0
  };
}

async function runWithFallback(query, fallbackValue, cacheKey = "") {
  const cached = readPublicCache(cacheKey);
  if (cached !== undefined) return cached;

  if (!hasMongoConfig()) return fallbackValue;
  const timeoutMs = envNumber("MONGODB_PUBLIC_QUERY_TIMEOUT_MS", 8000);

  try {
    await Promise.race([
      connectMongoDB(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database connection timed out.")), timeoutMs)
      )
    ]);
    const result = await Promise.race([
      query(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database query timed out.")), timeoutMs)
      )
    ]);
    return writePublicCache(cacheKey, result);
  } catch (error) {
    console.warn("MongoDB query failed:", friendlyMongoError(error));
    return readPublicCache(cacheKey, true) ?? fallbackValue;
  }
}

export async function getCourses(options = {}) {
  return runWithFallback(
    async () => {
      const filter = activeStatusFilter();
      if (options.q) {
        const term = new RegExp(options.q, "i");
        filter.$or = [{ title: term }, { category: term }, { instructorName: term }];
      }
      const items = await Course.find(filter)
        .select("title slug level category price compareAtPrice currency rating enrolledCount likes shareCount commentCount replyCount pricingType duration lessonsCount instructorId instructorName certificate outcomes chapters modules.title tools image status isFeatured createdAt updatedAt")
        .populate({ path: "instructorId", select: "name email profileImage isVerified", model: User })
        .sort({ isFeatured: -1, enrolledCount: -1, rating: -1, createdAt: -1 })
        .limit(options.limit ?? 48)
        .lean();
      return items.map((item) => normalizeCourse(item));
    },
    [],
    publicCacheKey("courses", options)
  );
}

export async function getCourseBySlug(slug) {
  return runWithFallback(
    async () => {
      const item = await Course.findOne({ slug, status: { $ne: "archived" } })
        .populate({ path: "instructorId", select: "name email profileImage isVerified", model: User })
        .lean();
      return item ? normalizeCourse(item) : null;
    },
    null
  );
}

export async function getProducts(options = {}) {
  return runWithFallback(
    async () => {
      const filter = activeStatusFilter();
      const includeImages = options.includeImages !== false;
      if (options.q) {
        const term = new RegExp(options.q, "i");
        filter.$or = [{ name: term }, { category: term }, { sellerName: term }, { type: term }];
      }
      const items = await Product.find(filter)
        .select(
          `name slug type sellerId sellerName price compareAtPrice currency category location stock rating downloads delivery status isFeatured isVerified createdAt updatedAt${includeImages ? " images tools" : ""}`
        )
        .populate({ path: "sellerId", select: "name email phone isVerified", model: User })
        .sort({ isFeatured: -1, downloads: -1, rating: -1, createdAt: -1 })
        .limit(options.limit ?? 48)
        .lean();
      return items.map((item) => normalizeProduct(item, { includeImages }));
    },
    [],
    publicCacheKey("products", options)
  );
}

export async function getJobPosts(options = {}) {
  return runWithFallback(
    async () => {
      const filter = activeStatusFilter();
      if (options.q) {
        const term = new RegExp(options.q, "i");
        filter.$or = [{ title: term }, { companyName: term }, { category: term }, { location: term }, { skills: term }];
      }
      const items = await JobPost.find(filter).sort({ isFeatured: -1, createdAt: -1 }).limit(options.limit ?? 48).lean();
      return items.map(normalizeJobPost);
    },
    [],
    publicCacheKey("jobs", options)
  );
}

export async function getJobPostBySlug(slug) {
  return runWithFallback(
    async () => {
      const item = await JobPost.findOne({ slug, status: { $ne: "archived" } }).lean();
      return item ? normalizeJobPost(item) : null;
    },
    null
  );
}

export async function getShopProfiles(options = {}) {
  return runWithFallback(
    async () => {
      const filter = activeStatusFilter();
      if (options.ownerId) {
        filter.ownerId = options.ownerId;
      }
      if (options.q) {
        const term = new RegExp(options.q, "i");
        filter.$or = [{ name: term }, { category: term }, { city: term }, { country: term }, { tags: term }];
      }
      const items = await ShopProfile.find(filter)
        .populate({ path: "ownerId", select: "name email phone profileImage isVerified", model: User })
        .sort({ isFeatured: -1, rating: -1, createdAt: -1 })
        .limit(options.limit ?? 48)
        .lean();
      return items.map(normalizeShopProfile);
    },
    [],
    publicCacheKey("shops", options)
  );
}

export async function getShopProfileBySlug(slug) {
  return runWithFallback(
    async () => {
      const item = await ShopProfile.findOne({ slug, status: { $ne: "archived" } })
        .populate({ path: "ownerId", select: "name email phone profileImage isVerified", model: User })
        .lean();
      return item ? normalizeShopProfile(item) : null;
    },
    null
  );
}

export async function getBlogPosts(options = {}) {
  return runWithFallback(
    async () => {
      const filter = options.all ? { deletedAt: { $exists: false } } : { published: true, deletedAt: { $exists: false } };
      if (options.q) {
        const term = new RegExp(options.q, "i");
        filter.$or = [{ title: term }, { excerpt: term }, { content: term }, { categoryName: term }];
      }
      const items = await BlogPost.find(filter).sort({ publishedAt: -1, createdAt: -1 }).limit(options.limit ?? 48).lean();
      return items.map(normalizeBlogPost);
    },
    [],
    publicCacheKey("blogs", options)
  );
}

export async function getBlogPostBySlug(slug) {
  return runWithFallback(
    async () => {
      const item = await BlogPost.findOne({ slug, published: true, deletedAt: { $exists: false } }).lean();
      return item ? normalizeBlogPost(item) : null;
    },
    null
  );
}

export async function getProductBySlug(slug) {
  return runWithFallback(
    async () => {
      const item = await Product.findOne({ slug, status: { $ne: "archived" } })
        .populate({ path: "sellerId", select: "name email phone profileImage isVerified", model: User })
        .lean();
      return item ? normalizeProduct(item) : null;
    },
    null
  );
}

export async function getConsultingServices(options = {}) {
  return runWithFallback(
    async () => {
      const filter = activeStatusFilter();
      if (options.q) {
        const term = new RegExp(options.q, "i");
        filter.$or = [{ title: term }, { expertName: term }, { expertTitle: term }, { expertise: term }];
      }
      const items = await ConsultingService.find(filter)
        .populate({ path: "expertId", select: "name email phone profileImage isVerified", model: User })
        .sort({ rating: -1, createdAt: -1 })
        .limit(options.limit ?? 48)
        .lean();
      return items.map(normalizeConsultingService);
    },
    [],
    publicCacheKey("consulting", options)
  );
}

export async function getConsultingServiceBySlug(slug) {
  return runWithFallback(
    async () => {
      const item = await ConsultingService.findOne({ slug, status: { $ne: "archived" } })
        .populate({ path: "expertId", select: "name email phone profileImage isVerified", model: User })
        .lean();
      return item ? normalizeConsultingService(item) : null;
    },
    null
  );
}

export async function getFreelancers(options = {}) {
  return runWithFallback(
    async () => {
      const filter = activeStatusFilter();
      if (options.q) {
        const term = new RegExp(options.q, "i");
        filter.$or = [{ name: term }, { role: term }, { specialty: term }, { location: term }, { skills: term }];
      }
      const items = await FreelancerProfile.find(filter)
        .populate({ path: "userId", select: "name email phone profileImage isVerified socialLinks createdAt", model: User })
        .sort({ rating: -1, completedJobs: -1 })
        .limit(options.limit ?? 48)
        .lean();
      return items.map(normalizeFreelancer);
    },
    [],
    publicCacheKey("freelancers", options)
  );
}

export async function getGigs(options = {}) {
  return runWithFallback(
    async () => {
      const filter = activeStatusFilter();
      if (options.ownerId) {
        filter.ownerId = options.ownerId;
      }
      if (options.q) {
        const term = new RegExp(options.q, "i");
        filter.$or = [{ title: term }, { category: term }, { packageName: term }, { ownerName: term }, { tags: term }];
      }
      const includeRawImage = options.includeImage !== false && Boolean(options.all);
      const items = await Gig.find(filter)
        .select(`studioId ownerId ownerName slug title category packageName description price currency deliveryDays revisions ownerAddress ownerCity ownerCountry tags deliverables rating orders status isFeatured isVerified createdAt updatedAt${includeRawImage ? " image images" : ""}`)
        .populate({ path: "ownerId", select: "name email phone profileImage isVerified", model: User })
        .sort({ isFeatured: -1, rating: -1, orders: -1, createdAt: -1 })
        .limit(options.limit ?? 48)
        .lean();
      return items.map((item) => normalizeGig(item, { includeImage: includeRawImage }));
    },
    [],
    publicCacheKey("gigs", options)
  );
}

export async function getAITools(options = {}) {
  return runWithFallback(
    async () => {
      const items = await AITool.find(activeStatusFilter()).sort({ usageCount: -1, createdAt: -1 }).limit(options.limit ?? 48).lean();
      return items.map(normalizeAITool);
    },
    [],
    publicCacheKey("ai-tools", options)
  );
}

export async function getMultimediaProjects(options = {}) {
  return runWithFallback(
    async () => {
      return MultimediaProject.find(activeStatusFilter()).sort({ likes: -1, createdAt: -1 }).limit(options.limit ?? 24).lean();
    },
    [],
    publicCacheKey("multimedia", options)
  );
}
