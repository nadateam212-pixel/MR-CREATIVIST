import { connectMongoDB, friendlyMongoError, hasMongoConfig } from "@/lib/mongodb";
import { envNumber } from "@/lib/env";
import { normalizeCourseImage } from "@/lib/course-media";
import AITool from "@/models/AITool";
import BlogPost from "@/models/BlogPost";
import ConsultingService from "@/models/ConsultingService";
import Course from "@/models/Course";
import FreelancerProfile from "@/models/FreelancerProfile";
import JobPost from "@/models/JobPost";
import MultimediaProject from "@/models/MultimediaProject";
import Product from "@/models/Product";
import ShopProfile from "@/models/ShopProfile";

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

export function normalizeCourse(doc) {
  const course = cleanJson(doc);
  const modules = course.modules ?? [];
  const chapters = modules.length ? modules.map((module) => module.title) : course.chapters ?? [];
  const lessonsCount =
    course.lessonsCount ?? modules.reduce((total, module) => total + (module.lessons?.length ?? 0), 0);
  const category = course.category ?? "Course";
  const outcomes =
    Array.isArray(course.outcomes) && course.outcomes.length
      ? course.outcomes
      : ["Learn the core workflow", "Practice with guided lessons", "Complete a certificate-ready path"];
  const tools = Array.isArray(course.tools) && course.tools.length ? course.tools : ["Lessons", "Progress", "Certificate"];

  return {
    id: course._id ?? course.id ?? course.slug,
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
    duration: course.duration ?? "Self-paced",
    lessons: Number(lessonsCount ?? 0),
    progress: Number(course.progress ?? 0),
    instructor: course.instructorName ?? course.instructor ?? "MR Creativist",
    certificate: course.certificate ?? "Completion certificate",
    image: normalizeCourseImage(course.image, category),
    trailerUrl: course.trailerUrl ?? "",
    description: course.description ?? course.shortDescription,
    outcomes,
    chapters,
    tools,
    modules,
    status: course.status,
    isFeatured: Boolean(course.isFeatured),
    createdAt: course.createdAt,
    updatedAt: course.updatedAt
  };
}

export function normalizeProduct(doc) {
  const product = cleanJson(doc);
  const image = product.image ?? product.images?.[0];

  return {
    id: product._id ?? product.id ?? product.slug,
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
    seller: product.sellerName ?? product.seller ?? "MR Creativist Studio",
    stock: product.stock ?? 0,
    rating: product.rating ?? 0,
    downloads: product.downloads ?? 0,
    category: product.category,
    delivery: product.delivery,
    image,
    images: product.images ?? [image].filter(Boolean),
    tools: product.tools ?? [],
    status: product.status,
    isFeatured: Boolean(product.isFeatured),
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
  const logo = shop.logo || "/icons/logo.png";
  const coverImage =
    shop.coverImage ||
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=85";

  return {
    id: shop._id ?? shop.id ?? shop.slug,
    ownerId: shop.ownerId,
    ownerName: shop.ownerName,
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

  return {
    id: service._id ?? service.id ?? service.slug,
    name: service.expertName ?? service.name,
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
    image: service.heroImage ?? service.avatar
  };
}

export function normalizeFreelancer(doc) {
  const freelancer = cleanJson(doc);

  return {
    id: freelancer.slug ?? freelancer._id,
    name: freelancer.name,
    role: freelancer.role,
    specialty: freelancer.specialty,
    location: freelancer.location,
    rate: freelancer.hourlyRate ?? freelancer.rate,
    rating: freelancer.rating ?? 0,
    completed: freelancer.completedJobs ?? freelancer.completed ?? 0,
    responseHours: freelancer.responseHours ?? 24,
    availability: freelancer.availabilityPercent ?? freelancer.availability ?? 60,
    portfolio: freelancer.portfolioScore ?? freelancer.portfolio ?? 80,
    languages: freelancer.languages ?? [],
    skills: freelancer.skills ?? [],
    verified: freelancer.verifiedBadges ?? freelancer.verified ?? [],
    image: freelancer.image,
    status: freelancer.status,
    createdAt: freelancer.createdAt,
    updatedAt: freelancer.updatedAt
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

async function runWithFallback(query, fallbackValue) {
  if (!hasMongoConfig()) return fallbackValue;
  const timeoutMs = envNumber("MONGODB_PUBLIC_QUERY_TIMEOUT_MS", 2500);

  try {
    await Promise.race([
      connectMongoDB(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database connection timed out.")), timeoutMs)
      )
    ]);
    return await Promise.race([
      query(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database query timed out.")), timeoutMs)
      )
    ]);
  } catch (error) {
    console.warn("MongoDB query failed:", friendlyMongoError(error));
    return fallbackValue;
  }
}

export async function getCourses(options = {}) {
  return runWithFallback(
    async () => {
      const filter = { status: "published" };
      if (options.q) {
        const term = new RegExp(options.q, "i");
        filter.$or = [{ title: term }, { category: term }, { instructorName: term }];
      }
      const items = await Course.find(filter).sort({ isFeatured: -1, enrolledCount: -1, rating: -1, createdAt: -1 }).limit(options.limit ?? 48).lean();
      return items.map(normalizeCourse);
    },
    []
  );
}

export async function getCourseBySlug(slug) {
  return runWithFallback(
    async () => {
      const item = await Course.findOne({ slug, status: { $ne: "archived" } }).lean();
      return item ? normalizeCourse(item) : null;
    },
    null
  );
}

export async function getProducts(options = {}) {
  return runWithFallback(
    async () => {
      const filter = { status: "published" };
      if (options.q) {
        const term = new RegExp(options.q, "i");
        filter.$or = [{ name: term }, { category: term }, { sellerName: term }, { type: term }];
      }
      const items = await Product.find(filter).sort({ isFeatured: -1, downloads: -1, rating: -1, createdAt: -1 }).limit(options.limit ?? 48).lean();
      return items.map(normalizeProduct);
    },
    []
  );
}

export async function getJobPosts(options = {}) {
  return runWithFallback(
    async () => {
      const filter = { status: "published" };
      if (options.q) {
        const term = new RegExp(options.q, "i");
        filter.$or = [{ title: term }, { companyName: term }, { category: term }, { location: term }, { skills: term }];
      }
      const items = await JobPost.find(filter).sort({ isFeatured: -1, createdAt: -1 }).limit(options.limit ?? 48).lean();
      return items.map(normalizeJobPost);
    },
    []
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
      const filter = options.all ? { status: { $ne: "archived" } } : { status: "published" };
      if (options.ownerId) {
        filter.ownerId = options.ownerId;
      }
      if (options.q) {
        const term = new RegExp(options.q, "i");
        filter.$or = [{ name: term }, { category: term }, { city: term }, { country: term }, { tags: term }];
      }
      const items = await ShopProfile.find(filter).sort({ isFeatured: -1, rating: -1, createdAt: -1 }).limit(options.limit ?? 48).lean();
      return items.map(normalizeShopProfile);
    },
    []
  );
}

export async function getShopProfileBySlug(slug) {
  return runWithFallback(
    async () => {
      const item = await ShopProfile.findOne({ slug, status: { $ne: "archived" } }).lean();
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
    []
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
      const item = await Product.findOne({ slug, status: { $ne: "archived" } }).lean();
      return item ? normalizeProduct(item) : null;
    },
    null
  );
}

export async function getConsultingServices(options = {}) {
  return runWithFallback(
    async () => {
      const items = await ConsultingService.find({ status: "published" }).sort({ rating: -1, createdAt: -1 }).limit(options.limit ?? 48).lean();
      return items.map(normalizeConsultingService);
    },
    []
  );
}

export async function getConsultingServiceBySlug(slug) {
  return runWithFallback(
    async () => {
      const item = await ConsultingService.findOne({ slug, status: { $ne: "archived" } }).lean();
      return item ? normalizeConsultingService(item) : null;
    },
    null
  );
}

export async function getFreelancers(options = {}) {
  return runWithFallback(
    async () => {
      const items = await FreelancerProfile.find({ status: "published" }).sort({ rating: -1, completedJobs: -1 }).limit(options.limit ?? 48).lean();
      return items.map(normalizeFreelancer);
    },
    []
  );
}

export async function getAITools(options = {}) {
  return runWithFallback(
    async () => {
      const items = await AITool.find({ status: "published" }).sort({ usageCount: -1, createdAt: -1 }).limit(options.limit ?? 48).lean();
      return items.map(normalizeAITool);
    },
    []
  );
}

export async function getMultimediaProjects(options = {}) {
  return runWithFallback(
    async () => {
      return MultimediaProject.find({ status: "published" }).sort({ likes: -1, createdAt: -1 }).limit(options.limit ?? 24).lean();
    },
    []
  );
}
