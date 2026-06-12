import { z } from "zod";

const slug = z
  .string()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a URL-safe slug.");

function normalizeOptionalUrl(value: unknown) {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  if (/^(www\.|[a-z0-9-]+(?:\.[a-z0-9-]+)+)(?:[/:?#]|$)/i.test(trimmed)) return `https://${trimmed}`;

  return trimmed;
}

const optionalUrl = z.preprocess(normalizeOptionalUrl, z.url().optional());
const dataImageUrl = z.string().regex(/^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i, "Use a valid uploaded image.");
const assetUrl = z
  .url()
  .or(z.string().regex(/^\/[^\s]*$/, "Use a valid URL or public asset path."))
  .or(dataImageUrl)
  .or(z.literal(""));
const optionalAssetUrl = assetUrl.optional().transform((value) => value || undefined);
const reviewStatus = z.enum(["draft", "submitted", "changes_requested", "approved", "published", "archived"]);
const courseResourceSchema = z.object({
  title: z.string().min(1).max(180),
  label: z.string().max(180).optional(),
  type: z.string().min(2).max(80).default("PDF"),
  url: assetUrl,
  accessRule: z.enum(["enrolled", "free"]).default("enrolled"),
  attachLevel: z.enum(["course", "lesson"]).default("course"),
  downloadable: z.boolean().default(true),
  description: z.string().max(800).optional()
});

export const courseSchema = z.object({
  title: z.string().min(3).max(160),
  slug: slug.optional(),
  shortDescription: z.string().min(10).max(260),
  description: z.string().min(20).max(5000),
  instructorName: z.string().min(2).max(120),
  level: z.enum(["Beginner", "Intermediate", "Advanced", "All levels", "Expert"]).default("Beginner"),
  category: z.string().min(2).max(120),
  location: z.string().min(2).max(180).default("Kigali, Rwanda"),
  subcategory: z.string().max(120).optional(),
  language: z.enum(["Kinyarwanda", "English", "French", "Other"]).default("English"),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional(),
  currency: z.enum(["USD", "FRW"]).default("USD"),
  image: assetUrl,
  trailerUrl: optionalUrl,
  previewType: z.enum(["smart", "custom", "none"]).default("smart"),
  defaultPreviewDuration: z.coerce.number().int().min(0).default(90),
  previewApplyTo: z.enum(["first", "selected", "all"]).default("first"),
  paywallMessage: z.string().max(400).default("This is a preview. Enroll now to continue watching the full lesson."),
  pricingType: z.enum(["free", "paid", "subscription", "manual"]).default("paid"),
  targetAudience: z.string().max(1200).optional(),
  duration: z.string().min(2).max(80).default("Self-paced"),
  lessonsCount: z.coerce.number().int().min(0).default(0),
  rating: z.coerce.number().min(0).max(5).default(0),
  enrolledCount: z.coerce.number().int().min(0).default(0),
  certificate: z.string().max(120).default("Completion certificate"),
  outcomes: z.array(z.string().min(2).max(180)).default([]),
  tools: z.array(z.string().min(2).max(120)).default([]),
  tags: z.array(z.string().min(2).max(60)).default([]),
  modules: z
    .array(
      z.object({
        title: z.string().min(2).max(180),
        description: z.string().max(900).optional(),
        orderIndex: z.coerce.number().int().min(0).default(0),
        status: z.enum(["draft", "ready", "hidden"]).default("draft"),
        lessons: z
          .array(
            z.object({
              title: z.string().min(2).max(180),
              type: z.enum(["video", "article", "image", "quiz", "assignment", "download"]).default("video"),
              sourceType: z.enum(["google-drive", "external-link", "upload", "text"]).default("google-drive"),
              durationMinutes: z.coerce.number().int().min(0).default(0),
              durationSeconds: z.coerce.number().int().min(0).default(0),
              summary: z.string().max(1200).optional(),
              videoUrl: optionalUrl,
              videoProvider: z.string().max(80).optional(),
              imageUrl: optionalAssetUrl,
              resources: z
                .array(
                  z.object({
                    label: z.string().max(180).optional(),
                    title: z.string().max(180).optional(),
                    type: z.string().max(80).optional(),
                    url: assetUrl,
                    accessRule: z.enum(["enrolled", "free"]).default("enrolled"),
                    downloadable: z.boolean().default(true)
                  })
                )
                .default([]),
              quizQuestions: z
                .array(
                  z.object({
                    id: z.string().max(80).optional(),
                    question: z.string().min(4).max(500),
                    options: z.array(z.string().min(1).max(240)).min(2).max(6),
                    correctIndex: z.coerce.number().int().min(0).default(0),
                    explanation: z.string().max(700).optional()
                  })
                )
                .default([]),
              isPreview: z.boolean().default(false),
              freePreview: z.boolean().default(false),
              previewStartSeconds: z.coerce.number().int().min(0).default(0),
              previewEndSeconds: z.coerce.number().int().min(0).default(90)
            })
          )
          .default([])
      })
    )
    .default([]),
  resources: z.array(courseResourceSchema).default([]),
  reviewNotes: z.string().max(2000).optional(),
  status: z.enum(["draft", "submitted", "changes_requested", "approved", "published", "unlisted", "archived"]).default("draft"),
  isFeatured: z.boolean().default(false)
});

export const productSchema = z.object({
  name: z.string().min(3).max(180),
  slug: slug.optional(),
  type: z.enum(["Digital", "Physical", "Template", "Download", "Software", "Creator assets", "Service"]),
  description: z.string().min(20).max(5000),
  sellerName: z.string().min(2).max(120),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional(),
  currency: z.enum(["USD", "FRW"]).default("USD"),
  images: z.array(assetUrl).min(1),
  category: z.string().min(2).max(120),
  stock: z.coerce.number().int().min(0).default(0),
  rating: z.coerce.number().min(0).max(5).default(0),
  downloads: z.coerce.number().int().min(0).default(0),
  delivery: z.string().min(2).max(160),
  tools: z.array(z.string().min(2).max(120)).default([]),
  tags: z.array(z.string().min(2).max(60)).default([]),
  status: reviewStatus.default("draft"),
  isFeatured: z.boolean().default(false),
  isVerified: z.boolean().default(false)
});

export const jobPostSchema = z.object({
  title: z.string().min(3).max(180),
  slug: slug.optional(),
  companyName: z.string().min(2).max(160),
  companyLogo: optionalAssetUrl,
  location: z.string().min(2).max(180),
  workplaceType: z.enum(["Remote", "Hybrid", "On-site"]).default("Remote"),
  employmentType: z.enum(["Full-time", "Part-time", "Contract", "Internship", "Freelance"]).default("Full-time"),
  salaryMin: z.coerce.number().min(0).default(0),
  salaryMax: z.coerce.number().min(0).default(0),
  currency: z.enum(["USD", "FRW"]).default("USD"),
  category: z.string().min(2).max(120),
  description: z.string().min(20).max(8000),
  responsibilities: z.array(z.string().min(2).max(240)).default([]),
  requirements: z.array(z.string().min(2).max(240)).default([]),
  benefits: z.array(z.string().min(2).max(180)).default([]),
  skills: z.array(z.string().min(2).max(100)).default([]),
  applyUrl: optionalUrl,
  contactEmail: z.email().optional().or(z.literal("")).transform((value) => value || undefined),
  applicationDeadline: z.coerce.date().optional(),
  status: z.enum(["draft", "published", "closed", "archived"]).default("published"),
  isFeatured: z.boolean().default(false)
});

export const shopProfileSchema = z.object({
  name: z.string().min(2).max(180),
  slug: slug.optional(),
  tagline: z.string().max(220).optional(),
  description: z.string().min(20).max(6000),
  category: z.string().min(2).max(120),
  logo: optionalAssetUrl,
  coverImage: optionalAssetUrl,
  contactName: z.string().max(120).optional(),
  contactEmail: z.email().optional().or(z.literal("")).transform((value) => value || undefined),
  phone: z.string().max(50).optional(),
  whatsapp: z.string().max(50).optional(),
  website: optionalUrl,
  address: z.string().max(240).optional(),
  city: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  openingHours: z.string().max(240).optional(),
  productsOrServices: z
    .array(
      z.object({
        name: z.string().min(2).max(180),
        type: z.enum(["Product", "Service"]).default("Product"),
        description: z.string().max(1000).optional(),
        price: z.coerce.number().min(0).default(0),
        currency: z.enum(["USD", "FRW"]).default("USD"),
        image: optionalAssetUrl
      })
    )
    .default([]),
  tags: z.array(z.string().min(2).max(80)).default([]),
  rating: z.coerce.number().min(0).max(5).default(0),
  status: reviewStatus.default("draft"),
  isFeatured: z.boolean().default(false),
  isVerified: z.boolean().default(false)
});

export const blogPostSchema = z.object({
  title: z.string().min(3).max(140),
  slug: slug.optional(),
  excerpt: z.string().max(240).optional(),
  image: optionalAssetUrl,
  content: z.string().min(10).max(20000),
  published: z.boolean().default(true),
  categoryName: z.string().min(2).max(120).default("Platform Updates"),
  categorySlug: slug.optional()
});

export const consultingServiceSchema = z.object({
  title: z.string().min(3).max(180),
  slug: slug.optional(),
  expertName: z.string().min(2).max(120),
  expertTitle: z.string().min(2).max(160),
  avatar: optionalUrl,
  description: z.string().min(20).max(4000),
  hourlyRate: z.coerce.number().min(0),
  currency: z.enum(["USD", "FRW"]).default("USD"),
  expertise: z.array(z.string().min(2).max(120)).min(1),
  languages: z.array(z.string().min(2).max(80)).default(["English"]),
  sessionTypes: z
    .array(z.object({ label: z.string().min(2), durationMinutes: z.coerce.number().int().min(15), price: z.coerce.number().min(0).optional() }))
    .default([]),
  availability: z.array(z.object({ day: z.string(), slots: z.array(z.string()) })).default([]),
  rating: z.coerce.number().min(0).max(5).default(0),
  heroImage: z.url(),
  status: reviewStatus.default("draft"),
  isVerified: z.boolean().default(false)
});

export const freelancerProfileSchema = z.object({
  slug: slug.optional(),
  name: z.string().min(2).max(120),
  role: z.string().min(2).max(160),
  specialty: z.string().min(2).max(120),
  location: z.string().min(2).max(160),
  hourlyRate: z.coerce.number().min(0),
  rating: z.coerce.number().min(0).max(5).default(0),
  completedJobs: z.coerce.number().int().min(0).default(0),
  responseHours: z.coerce.number().min(0).default(24),
  availabilityPercent: z.coerce.number().min(0).max(100).default(60),
  portfolioScore: z.coerce.number().min(0).max(100).default(80),
  languages: z.array(z.string().min(2)).min(1),
  skills: z.array(z.string().min(2)).min(1),
  verifiedBadges: z.array(z.string().min(2)).default([]),
  image: assetUrl,
  bio: z.string().max(2000).optional(),
  gigs: z.array(z.object({ title: z.string(), price: z.coerce.number().min(0), deliveryDays: z.coerce.number().int().min(1) })).default([]),
  portfolio: z.array(z.object({ title: z.string().min(1).max(180), url: assetUrl, image: optionalAssetUrl })).default([]),
  status: reviewStatus.default("draft"),
  isVerified: z.boolean().default(false)
});

export const gigSchema = z.object({
  slug: slug.optional(),
  title: z.string().min(3).max(180),
  category: z.string().min(2).max(120),
  packageName: z.string().min(2).max(160),
  description: z.string().min(20).max(5000),
  price: z.coerce.number().min(0),
  currency: z.enum(["USD", "FRW"]).default("USD"),
  deliveryDays: z.coerce.number().int().min(1).default(5),
  revisions: z.coerce.number().int().min(0).default(1),
  ownerName: z.string().max(120).optional(),
  ownerAddress: z.string().max(240).optional(),
  ownerCity: z.string().max(120).optional(),
  ownerCountry: z.string().max(120).optional(),
  image: assetUrl,
  images: z.array(assetUrl).default([]),
  tags: z.array(z.string().min(2).max(80)).default([]),
  deliverables: z.array(z.string().min(2).max(180)).default([]),
  rating: z.coerce.number().min(0).max(5).default(0),
  orders: z.coerce.number().int().min(0).default(0),
  status: reviewStatus.default("draft"),
  isFeatured: z.boolean().default(false),
  isVerified: z.boolean().default(false)
});

export const aiToolSchema = z.object({
  name: z.string().min(2).max(160),
  slug: slug.optional(),
  description: z.string().min(10).max(1800),
  category: z.string().min(2).max(120),
  icon: z.string().min(2).max(80).default("sparkles"),
  demoUrl: optionalUrl,
  pricingPlan: z.enum(["free", "starter", "pro", "enterprise"]).default("starter"),
  apiAvailable: z.boolean().default(false),
  endpointKey: z.string().max(120).optional(),
  features: z.array(z.string().min(2).max(140)).default([]),
  usageCount: z.coerce.number().int().min(0).default(0),
  status: z.enum(["draft", "published", "archived"]).default("published")
});

export const multimediaProjectSchema = z.object({
  title: z.string().min(3).max(180),
  slug: slug.optional(),
  type: z.enum(["video", "audio", "brand", "photo", "animation", "campaign", "showreel"]),
  creatorName: z.string().min(2).max(120),
  description: z.string().min(20).max(4000),
  coverImage: z.url(),
  mediaUrls: z
    .array(
      z.object({
        url: z.url(),
        type: z.enum(["image", "video", "audio", "document"]),
        thumbnail: z.url().optional(),
        caption: z.string().max(180).optional()
      })
    )
    .default([]),
  services: z.array(z.string().min(2).max(140)).default([]),
  likes: z.coerce.number().int().min(0).default(0),
  status: z.enum(["draft", "published", "archived"]).default("published")
});

export const contactMessageSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.email(),
  subject: z.string().min(3).max(180),
  message: z.string().min(10).max(4000),
  source: z.string().max(80).default("contact-page")
});

export const newsletterSchema = z.object({
  email: z.email(),
  name: z.string().max(120).optional(),
  interests: z.array(z.string().min(2).max(80)).default([]),
  source: z.string().max(80).default("website")
});

export const enrollmentSchema = z.object({
  courseId: z.string().min(1),
  learnerName: z.string().min(2).max(120),
  learnerEmail: z.email(),
  paidAmount: z.coerce.number().min(0).default(0)
});

export const bookingSchema = z.object({
  serviceId: z.string().min(1),
  clientName: z.string().min(2).max(120),
  clientEmail: z.email(),
  sessionType: z.string().min(2).max(120),
  scheduledFor: z.coerce.date(),
  notes: z.string().max(2000).optional()
});

export const orderSchema = z.object({
  buyerName: z.string().min(2).max(120),
  buyerEmail: z.email(),
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.coerce.number().int().min(1) })).min(1),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  paymentMethod: z.string().min(2).max(80)
});
