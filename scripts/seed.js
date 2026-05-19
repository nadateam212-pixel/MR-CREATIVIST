import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectMongoDB } from "../lib/mongodb.js";
import AITool from "../models/AITool.js";
import AccountApplication from "../models/AccountApplication.js";
import Booking from "../models/Booking.js";
import ConsultingService from "../models/ConsultingService.js";
import ContactMessage from "../models/ContactMessage.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import FreelancerProfile from "../models/FreelancerProfile.js";
import MultimediaProject from "../models/MultimediaProject.js";
import NewsletterSubscriber from "../models/NewsletterSubscriber.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

// Seed login credentials:
// admin@mrcreativist.com / MrCreativist@12!2026@
// student@mrcreativist.com / Student123!
// student2@mrcreativist.com / Student123!
// instructor@mrcreativist.com / Instructor123!
// maya@mrcreativist.com / Instructor123!
// seller@mrcreativist.com / Seller123!
// freelancer@mrcreativist.com / Freelancer123!

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function upsertBy(Model, filter, document) {
  return Model.findOneAndUpdate(filter, document, {
    returnDocument: "after",
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true
  });
}

const images = {
  learning: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=85",
  classroom: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=85",
  business: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85",
  ai: "https://images.unsplash.com/photo-1674027444485-cec3da58eef4?auto=format&fit=crop&w=1200&q=85",
  studio: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1200&q=85",
  commerce: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=85",
  consultant: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=85",
  production: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1200&q=85",
  photography: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=85",
  dashboard: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=85",
  profileA: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=85",
  profileB: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=85",
  profileC: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=85",
  profileD: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=85",
  profileE: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=800&q=85"
};

function courseModules(courseSlug) {
  return ["Foundation", "Workflow", "Launch"].map((title, moduleIndex) => ({
    title,
    description: `${title} module with guided lessons, resources, and implementation checks.`,
    lessons: [
      {
        title: `${title} overview`,
        type: "video",
        durationMinutes: 18 + moduleIndex * 4,
        videoUrl: `https://videos.example.mrcreativist.com/${courseSlug}/${moduleIndex + 1}-overview`,
        isPreview: moduleIndex === 0
      },
      {
        title: `${title} implementation lab`,
        type: "assignment",
        durationMinutes: 42 + moduleIndex * 8,
        resources: [{ label: "Project workbook", url: `/resources/${courseSlug}-${moduleIndex + 1}.pdf` }]
      },
      {
        title: `${title} assessment`,
        type: "quiz",
        durationMinutes: 16,
        resources: [{ label: "Review checklist", url: `/resources/${courseSlug}-${moduleIndex + 1}-checklist.pdf` }]
      }
    ]
  }));
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Set MONGODB_URI in .env.local before running npm run seed:mongo.");
  }

  await connectMongoDB();

  await Promise.all([
    ConsultingService.deleteMany({ slug: { $in: ["aline-strategy", "noah-media", "maya-learning"] } }),
    AccountApplication.deleteMany({ applicantEmail: "student2@mrcreativist.com" }),
    Enrollment.deleteMany({ learnerEmail: /example\.com$/i }),
    Order.deleteMany({ buyerEmail: /example\.com$/i }),
    Booking.deleteMany({ clientEmail: /example\.com$/i }),
    NewsletterSubscriber.deleteMany({ source: "seed" }),
    ContactMessage.deleteMany({ source: "seed" })
  ]);

  const seededPasswords = {
    admin: await bcrypt.hash("MrCreativist@12!2026@", 12),
    student: await bcrypt.hash("Student123!", 12),
    instructor: await bcrypt.hash("Instructor123!", 12),
    seller: await bcrypt.hash("Seller123!", 12),
    freelancer: await bcrypt.hash("Freelancer123!", 12),
    consultant: await bcrypt.hash("Consultant123!", 12)
  };

  const users = await Promise.all([
    upsertBy(User, { email: "aline@mrcreativist.com" }, { name: "Aline Strategy", email: "aline@mrcreativist.com", passwordHash: seededPasswords.consultant, role: "consultant", validatedRoles: ["client", "consultant"], profileImage: images.profileA, isVerified: true, accountStatus: "active" }),
    upsertBy(User, { email: "noah@mrcreativist.com" }, { name: "Noah Media", email: "noah@mrcreativist.com", passwordHash: seededPasswords.seller, role: "seller", validatedRoles: ["client", "seller"], profileImage: images.profileB, isVerified: true, accountStatus: "active" }),
    upsertBy(User, { email: "maya@mrcreativist.com" }, { name: "Maya Learning", email: "maya@mrcreativist.com", passwordHash: seededPasswords.instructor, role: "instructor", validatedRoles: ["client", "instructor"], profileImage: images.profileC, isVerified: true, accountStatus: "active" }),
    upsertBy(User, { email: "admin@mrcreativist.com" }, { name: "MR Creativist Admin", email: "admin@mrcreativist.com", passwordHash: seededPasswords.admin, role: "admin", validatedRoles: ["admin", "client", "student", "instructor", "seller", "freelancer", "consultant"], isVerified: true, accountStatus: "active" }),
    upsertBy(User, { email: "student@mrcreativist.com" }, { name: "Divine Learner", email: "student@mrcreativist.com", passwordHash: seededPasswords.student, role: "student", validatedRoles: ["client", "student"], profileImage: images.profileA, isVerified: true, accountStatus: "active" }),
    upsertBy(User, { email: "student2@mrcreativist.com" }, { name: "Eric Student", email: "student2@mrcreativist.com", passwordHash: seededPasswords.student, role: "client", validatedRoles: ["client", "student"], profileImage: images.profileB, isVerified: true, accountStatus: "active" }),
    upsertBy(User, { email: "instructor@mrcreativist.com" }, { name: "Grace Instructor", email: "instructor@mrcreativist.com", passwordHash: seededPasswords.instructor, role: "instructor", validatedRoles: ["client", "instructor"], profileImage: images.profileC, isVerified: true, accountStatus: "active" }),
    upsertBy(User, { email: "seller@mrcreativist.com" }, { name: "Kigali Seller", email: "seller@mrcreativist.com", passwordHash: seededPasswords.seller, role: "seller", validatedRoles: ["client", "seller"], profileImage: images.profileB, isVerified: true, accountStatus: "active" }),
    upsertBy(User, { email: "freelancer@mrcreativist.com" }, { name: "Amina Freelancer", email: "freelancer@mrcreativist.com", passwordHash: seededPasswords.freelancer, role: "freelancer", validatedRoles: ["client", "freelancer"], profileImage: images.profileA, isVerified: true, accountStatus: "active" })
  ]);

  const [aline, noah, maya, , student, student2, grace, seller, aminaUser] = users;

  const courseSeeds = [
    {
      title: "Creator Commerce Foundations",
      instructor: aline,
      category: "Business",
      level: "Beginner",
      price: 49,
      compareAtPrice: 89,
      image: images.business,
      duration: "42 hours",
      lessonsCount: 38,
      rating: 4.8,
      enrolledCount: 12450,
      certificate: "Professional certificate",
      outcomes: ["Build a digital offer", "Price and package products", "Launch a complete sales funnel"],
      tools: ["Workbook", "Revenue calculator", "Certificate exam", "Referral challenge"],
      tags: ["commerce", "creator", "launch"]
    },
    {
      title: "Marketplace Growth Systems",
      instructor: noah,
      category: "Marketplace",
      level: "Intermediate",
      price: 89,
      compareAtPrice: 149,
      image: images.commerce,
      duration: "35 hours",
      lessonsCount: 31,
      rating: 4.7,
      enrolledCount: 8920,
      certificate: "Seller growth certificate",
      outcomes: ["Optimize product pages", "Run coupon campaigns", "Build seller analytics"],
      tools: ["SKU planner", "Coupon builder", "Order tracker", "Review response kit"],
      tags: ["marketplace", "seller", "growth"]
    },
    {
      title: "AI-Assisted Course Design",
      instructor: maya,
      category: "AI and Education",
      level: "Advanced",
      price: 129,
      compareAtPrice: 199,
      image: images.ai,
      duration: "48 hours",
      lessonsCount: 44,
      rating: 4.9,
      enrolledCount: 15670,
      certificate: "AI course builder certificate",
      outcomes: ["Generate course outlines", "Build quizzes automatically", "Improve student completion"],
      tools: ["AI outline lab", "Quiz generator", "Upload checklist", "Certificate designer"],
      tags: ["ai", "education", "course"]
    },
    {
      title: "Multimedia Production Sprint",
      instructor: noah,
      category: "Multimedia",
      level: "Intermediate",
      price: 99,
      compareAtPrice: 159,
      image: images.production,
      duration: "32 hours",
      lessonsCount: 29,
      rating: 4.8,
      enrolledCount: 6430,
      certificate: "Production sprint certificate",
      outcomes: ["Plan a production board", "Edit a campaign showreel", "Package client-ready assets"],
      tools: ["Shot list", "Edit checklist", "Delivery folder map"],
      tags: ["media", "production", "showreel"]
    },
    {
      title: "Freelance Client Systems",
      instructor: grace,
      category: "Freelancing",
      level: "Beginner",
      price: 59,
      compareAtPrice: 99,
      image: images.classroom,
      duration: "28 hours",
      lessonsCount: 24,
      rating: 4.6,
      enrolledCount: 5810,
      certificate: "Freelance operations certificate",
      outcomes: ["Write strong proposals", "Scope milestone contracts", "Handle revisions professionally"],
      tools: ["Proposal board", "Milestone planner", "Client message scripts"],
      tags: ["freelance", "client", "operations"]
    },
    {
      title: "Consulting Practice Builder",
      instructor: aline,
      category: "Consulting",
      level: "All levels",
      price: 119,
      compareAtPrice: 189,
      image: images.consultant,
      duration: "40 hours",
      lessonsCount: 36,
      rating: 4.9,
      enrolledCount: 7340,
      certificate: "Consulting practice certificate",
      outcomes: ["Package advisory offers", "Run discovery sessions", "Track client outcomes"],
      tools: ["Session agenda", "Client intake form", "Outcome dashboard"],
      tags: ["consulting", "services", "clients"]
    },
    {
      title: "AI Tool Integration With APIs",
      instructor: maya,
      category: "AI Tools",
      level: "Expert",
      price: 149,
      compareAtPrice: 229,
      image: images.dashboard,
      duration: "52 hours",
      lessonsCount: 47,
      rating: 4.8,
      enrolledCount: 4620,
      certificate: "AI integration certificate",
      outcomes: ["Design secure API workflows", "Connect demos to production endpoints", "Measure AI tool usage"],
      tools: ["API checklist", "Rate limit guide", "Demo telemetry map"],
      tags: ["ai", "api", "integration"]
    },
    {
      title: "Product Photography for Marketplaces",
      instructor: grace,
      category: "Marketplace",
      level: "Beginner",
      price: 69,
      compareAtPrice: 109,
      image: images.photography,
      duration: "22 hours",
      lessonsCount: 21,
      rating: 4.7,
      enrolledCount: 3980,
      certificate: "Marketplace photography certificate",
      outcomes: ["Style product sets", "Shoot clean catalog images", "Prepare thumbnails that convert"],
      tools: ["Lighting plan", "Shot checklist", "Image naming guide"],
      tags: ["photo", "marketplace", "catalog"]
    }
  ];

  const courses = await Promise.all(
    courseSeeds.map((course, index) => {
      const slug = slugify(course.title);

      return upsertBy(Course, { slug }, {
        title: course.title,
        slug,
        shortDescription: `${course.title} with practical projects, templates, progress tracking, and certification.`,
        description: `${course.title} helps creators, sellers, consultants, and teams build a production-ready workflow with lessons, assignments, downloadable resources, progress tracking, and final validation.`,
        instructorId: course.instructor._id,
        instructorName: course.instructor.name,
        category: course.category,
        level: course.level,
        price: course.price,
        compareAtPrice: course.compareAtPrice,
        image: course.image,
        duration: course.duration,
        lessonsCount: course.lessonsCount,
        rating: course.rating,
        enrolledCount: course.enrolledCount,
        certificate: course.certificate,
        outcomes: course.outcomes,
        tools: course.tools,
        tags: course.tags,
        modules: courseModules(slug),
        status: "published",
        isFeatured: index < 3
      });
    })
  );

  const productSeeds = [
    ["Creator Launch Kit", "Digital", 29, 49, "Templates", "Instant download", 999, images.ai, ["Launch checklist", "Offer worksheet", "Pricing calculator"], noah, "MR Creativist Studio"],
    ["Consulting Proposal System", "Template", 39, 79, "Services", "Instant download", 640, images.business, ["Proposal deck", "Scope builder", "Invoice blueprint"], aline, "Aline Strategy"],
    ["Creator Studio Starter Gear", "Physical", 189, 249, "Equipment", "Tracked shipping", 32, images.studio, ["Shipment tracking", "Warranty card", "Setup guide"], seller, "Kigali Seller"],
    ["AI Prompt Operations Pack", "Download", 25, 45, "AI Tools", "Instant download", 880, images.dashboard, ["Prompt library", "Workflow cards", "Testing grid"], maya, "Maya Learning"],
    ["Seller Analytics Dashboard", "Software", 79, 129, "Software", "License key", 420, images.dashboard, ["KPI dashboard", "CSV import", "Weekly report"], noah, "Noah Media"],
    ["Brand Storytelling Kit", "Creator assets", 55, 95, "Branding", "Instant download", 530, images.production, ["Story framework", "Visual guide", "Caption bank"], seller, "Kigali Seller"],
    ["Course Workbook Bundle", "Digital", 35, 59, "Education", "Instant download", 750, images.learning, ["Learner workbook", "Instructor guide", "Quiz bank"], grace, "Grace Instructor"],
    ["Social Video Preset Pack", "Download", 45, 75, "Multimedia", "Instant download", 360, images.studio, ["Color presets", "Motion titles", "Export notes"], noah, "Noah Media"],
    ["Client Intake Automation", "Template", 49, 89, "Consulting", "Instant download", 610, images.consultant, ["Intake form", "CRM fields", "Follow-up emails"], aline, "Aline Strategy"],
    ["Marketplace Photography Kit", "Physical", 99, 149, "Equipment", "Tracked shipping", 55, images.photography, ["Backdrop set", "Reflector card", "Lighting guide"], seller, "Kigali Seller"]
  ];

  const products = await Promise.all(
    productSeeds.map(([name, type, price, compareAtPrice, category, delivery, stock, image, tools, sellerUser, sellerName], index) =>
      upsertBy(Product, { slug: slugify(name) }, {
        name,
        slug: slugify(name),
        type,
        description: `${name} is a marketplace-ready product with fulfillment details, invoices, reviews, and seller payout support.`,
        sellerId: sellerUser._id,
        sellerName,
        price,
        compareAtPrice,
        category,
        stock,
        rating: Math.min(4.95, 4.55 + index * 0.04),
        downloads: type === "Physical" ? 0 : 1200 + index * 210,
        delivery,
        images: [image],
        tools,
        tags: [slugify(category), slugify(type)],
        status: "published",
        isFeatured: index < 4
      })
    )
  );

  const serviceSeeds = [
    ["Business Growth Consultant", aline, "Go-to-market, pricing, and operations expert", 120, images.consultant, ["Go-to-market", "Pricing", "Operations"]],
    ["Creative Systems Consultant", noah, "Multimedia systems, creative delivery, and automation specialist", 95, images.studio, ["Content systems", "Automation", "Analytics"]],
    ["Course Design Specialist", maya, "Curriculum, assessments, and learner engagement expert", 110, images.learning, ["Curriculum", "Assessments", "Engagement"]],
    ["Instructor Operations Advisor", grace, "Cohort delivery, certificate workflows, and learner success advisor", 90, images.classroom, ["Cohorts", "Certificates", "Student success"]],
    ["Marketplace Seller Advisor", seller, "Catalog strategy, product operations, and fulfillment advisor", 85, images.commerce, ["Catalogs", "Fulfillment", "Seller analytics"]]
  ];

  const services = await Promise.all(
    serviceSeeds.map(([expertTitle, expertUser, description, hourlyRate, heroImage, expertise], index) =>
      upsertBy(ConsultingService, { slug: slugify(`${expertUser.name}-advisory`) }, {
        title: `${expertUser.name} advisory`,
        slug: slugify(`${expertUser.name}-advisory`),
        expertId: expertUser._id,
        expertName: expertUser.name,
        expertTitle,
        avatar: expertUser.profileImage,
        description,
        hourlyRate,
        expertise,
        languages: index === 2 ? ["English", "French"] : ["English", "Kinyarwanda"],
        sessionTypes: [
          { label: "Strategy session", durationMinutes: 60, price: hourlyRate },
          { label: "Implementation review", durationMinutes: 90, price: Math.round(hourlyRate * 1.4) }
        ],
        availability: [
          { day: "Tuesday", slots: ["09:00", "13:00"] },
          { day: "Thursday", slots: ["10:00", "15:00"] }
        ],
        rating: Math.min(4.95, 4.75 + index * 0.04),
        heroImage,
        status: "published"
      })
    )
  );

  const freelancerSeeds = [
    {
      userId: aminaUser._id,
      slug: "amina-ai",
      name: "AMINA K.",
      role: "AI AUTOMATION FREELANCER",
      specialty: "AI AUTOMATION",
      location: "KIGALI, RWANDA",
      hourlyRate: 64,
      rating: 4.9,
      completedJobs: 128,
      responseHours: 2,
      availabilityPercent: 86,
      portfolioScore: 94,
      languages: ["ENGLISH", "KINYARWANDA"],
      skills: ["AI WORKFLOWS", "COURSE FUNNELS", "COPYWRITING", "AUTOMATION", "ANALYTICS"],
      verifiedBadges: ["ID VERIFIED", "ESCROW READY", "NDA READY"],
      image: images.profileA
    },
    {
      slug: "david-brand",
      name: "DAVID N.",
      role: "BRAND AND PRODUCT DESIGNER",
      specialty: "BRAND DESIGN",
      location: "NAIROBI, KENYA",
      hourlyRate: 58,
      rating: 4.8,
      completedJobs: 96,
      responseHours: 4,
      availabilityPercent: 72,
      portfolioScore: 91,
      languages: ["ENGLISH"],
      skills: ["BRAND DESIGN", "PRODUCT MOCKUPS", "SEO", "SELLER PROFILE", "COPYWRITING"],
      verifiedBadges: ["PORTFOLIO VERIFIED", "CONTRACT READY", "FAST HANDOFF"],
      image: images.profileB
    },
    {
      slug: "keza-media",
      name: "KEZA M.",
      role: "MULTIMEDIA PRODUCER",
      specialty: "MULTIMEDIA",
      location: "KIGALI, RWANDA",
      hourlyRate: 70,
      rating: 5,
      completedJobs: 141,
      responseHours: 1,
      availabilityPercent: 80,
      portfolioScore: 97,
      languages: ["ENGLISH", "KINYARWANDA", "FRENCH"],
      skills: ["VIDEO EDITING", "MOTION GRAPHICS", "SOCIAL ADS", "SCRIPTING", "FINAL ASSET LIBRARY"],
      verifiedBadges: ["STUDIO VERIFIED", "ESCROW READY", "4K DELIVERY"],
      image: images.profileC
    },
    {
      slug: "noel-web",
      name: "NOEL T.",
      role: "FULL STACK WEB FREELANCER",
      specialty: "WEB BUILD",
      location: "KAMPALA, UGANDA",
      hourlyRate: 75,
      rating: 4.9,
      completedJobs: 112,
      responseHours: 3,
      availabilityPercent: 68,
      portfolioScore: 89,
      languages: ["ENGLISH"],
      skills: ["WEB BUILD", "PAYMENTS", "DASHBOARDS", "SEO", "AUTOMATION"],
      verifiedBadges: ["CODE REVIEWED", "SECURITY READY", "API READY"],
      image: images.profileD
    },
    {
      slug: "laila-copy",
      name: "LAILA O.",
      role: "SALES COPY AND LAUNCH WRITER",
      specialty: "COPYWRITING",
      location: "DAR ES SALAAM, TANZANIA",
      hourlyRate: 52,
      rating: 4.7,
      completedJobs: 88,
      responseHours: 5,
      availabilityPercent: 74,
      portfolioScore: 90,
      languages: ["ENGLISH", "SWAHILI"],
      skills: ["COPYWRITING", "EMAIL LAUNCH", "PRODUCT PAGES", "BRAND VOICE", "SEO"],
      verifiedBadges: ["COPY TESTED", "FAST TURNAROUND", "CONTRACT READY"],
      image: images.profileE
    }
  ];

  await Promise.all(
    freelancerSeeds.map((freelancer) =>
      upsertBy(FreelancerProfile, { slug: freelancer.slug }, {
        ...freelancer,
        bio: `${freelancer.name} helps teams ship polished ${freelancer.specialty.toLowerCase()} work with clear milestones, reliable handoff, and strong client communication.`,
        gigs: [
          { title: `${freelancer.specialty} sprint`, price: freelancer.hourlyRate * 8, deliveryDays: 5 },
          { title: "Strategy and implementation package", price: freelancer.hourlyRate * 20, deliveryDays: 12 }
        ],
        portfolio: [
          { title: `${freelancer.specialty} portfolio piece`, url: `/freelancers/${freelancer.slug}`, image: freelancer.image }
        ],
        reviews: [
          { clientName: "Kigali Academy", rating: Math.min(5, Math.round(freelancer.rating)), comment: "Clear scope, fast delivery, and excellent handoff quality." }
        ],
        status: "published"
      })
    )
  );

  await Promise.all([
    upsertBy(MultimediaProject, { slug: "creator-showreel-system" }, {
      title: "Creator Showreel System",
      slug: "creator-showreel-system",
      type: "showreel",
      creatorId: noah._id,
      creatorName: noah.name,
      description: "A complete creator showreel with short-form edits, brand frames, audio tags, and campaign assets.",
      coverImage: images.studio,
      mediaUrls: [{ url: images.studio, type: "image", caption: "Studio production board" }],
      services: ["Video editing", "Brand motion", "Audio packaging"],
      likes: 342,
      status: "published"
    }),
    upsertBy(MultimediaProject, { slug: "marketplace-product-film" }, {
      title: "Marketplace Product Film",
      slug: "marketplace-product-film",
      type: "campaign",
      creatorId: seller._id,
      creatorName: seller.name,
      description: "A product launch film package with hero footage, catalog clips, seller trust signals, and social cutdowns.",
      coverImage: images.photography,
      mediaUrls: [{ url: images.photography, type: "image", caption: "Product photography set" }],
      services: ["Product video", "Catalog photography", "Ad cutdowns"],
      likes: 286,
      status: "published"
    }),
    upsertBy(MultimediaProject, { slug: "ai-learning-campaign" }, {
      title: "AI Learning Campaign",
      slug: "ai-learning-campaign",
      type: "video",
      creatorId: maya._id,
      creatorName: maya.name,
      description: "A learning campaign with animated lesson teasers, instructor scripts, and AI-generated assessment previews.",
      coverImage: images.ai,
      mediaUrls: [{ url: images.ai, type: "image", caption: "AI course campaign visual" }],
      services: ["Learning video", "Script editing", "Campaign assets"],
      likes: 314,
      status: "published"
    })
  ]);

  await Promise.all([
    upsertBy(AITool, { slug: "ai-course-generator" }, {
      name: "AI COURSE GENERATOR",
      slug: "ai-course-generator",
      description: "Turn one idea into modules, lessons, quizzes, assignments, resources, and certificate rules.",
      category: "Education",
      icon: "wand",
      demoUrl: "/ai-tools?demo=course-generator",
      pricingPlan: "pro",
      apiAvailable: true,
      endpointKey: "course-generator",
      features: ["Outline generation", "Quiz drafting", "Certificate rules"],
      usageCount: 820,
      status: "published"
    }),
    upsertBy(AITool, { slug: "ai-chat-assistant" }, {
      name: "AI CHAT ASSISTANT",
      slug: "ai-chat-assistant",
      description: "Support learners, customers, sellers, and consultants with guided answers and workflow help.",
      category: "Support",
      icon: "bot",
      demoUrl: "/ai-tools?demo=chat",
      pricingPlan: "starter",
      apiAvailable: true,
      endpointKey: "chat-assistant",
      features: ["Guided support", "Workflow memory", "Escalation notes"],
      usageCount: 690,
      status: "published"
    }),
    upsertBy(AITool, { slug: "content-writer" }, {
      name: "CONTENT WRITER",
      slug: "content-writer",
      description: "Generate landing pages, blog posts, email campaigns, product copy, captions, and sales scripts.",
      category: "Marketing",
      icon: "file",
      demoUrl: "/ai-tools?demo=content",
      pricingPlan: "starter",
      apiAvailable: true,
      endpointKey: "content-writer",
      features: ["Campaign copy", "Product descriptions", "Email sequences"],
      usageCount: 620,
      status: "published"
    }),
    upsertBy(AITool, { slug: "marketplace-listing-optimizer" }, {
      name: "MARKETPLACE LISTING OPTIMIZER",
      slug: "marketplace-listing-optimizer",
      description: "Improve marketplace titles, descriptions, SEO tags, trust signals, and conversion-focused product details.",
      category: "Marketplace",
      icon: "sparkles",
      demoUrl: "/ai-tools?demo=marketplace-listing",
      pricingPlan: "pro",
      apiAvailable: true,
      endpointKey: "marketplace-listing",
      features: ["SEO title scoring", "Benefit rewriting", "Trust signal checklist"],
      usageCount: 540,
      status: "published"
    })
  ]);

  await Promise.all([
    upsertBy(Enrollment, { courseId: courses[0]._id, learnerEmail: student.email }, {
      courseId: courses[0]._id,
      userId: student._id,
      learnerName: student.name,
      learnerEmail: student.email,
      progressPercent: 45,
      paidAmount: 49,
      status: "active"
    }),
    upsertBy(Enrollment, { courseId: courses[2]._id, learnerEmail: student2.email }, {
      courseId: courses[2]._id,
      userId: student2._id,
      learnerName: student2.name,
      learnerEmail: student2.email,
      progressPercent: 92,
      paidAmount: 129,
      status: "completed",
      certificateIssuedAt: new Date()
    }),
    upsertBy(Order, { buyerEmail: student.email, "items.slug": products[0].slug }, {
      buyerId: student._id,
      buyerName: student.name,
      buyerEmail: student.email,
      items: [{ productId: products[0]._id, name: products[0].name, slug: products[0].slug, quantity: 1, unitPrice: products[0].price }],
      subtotal: products[0].price,
      discount: 0,
      tax: 2,
      total: products[0].price + 2,
      paymentMethod: "Wallet",
      status: "paid"
    }),
    upsertBy(Booking, { serviceId: services[0]._id, clientEmail: "partnerships@kigaliacademy.rw" }, {
      serviceId: services[0]._id,
      clientName: "Kigali Academy",
      clientEmail: "partnerships@kigaliacademy.rw",
      sessionType: "Strategy session",
      scheduledFor: new Date(Date.now() + 86400000),
      notes: "Discuss launch strategy, course packaging, and marketplace distribution.",
      status: "confirmed"
    }),
    upsertBy(NewsletterSubscriber, { email: "reader@mrcreativist.com" }, {
      email: "reader@mrcreativist.com",
      name: "MR Creativist Reader",
      interests: ["Courses", "AI tools", "Marketplace"],
      source: "seed"
    })
  ]);

  await ContactMessage.create({
    name: "Kigali Academy Partnerships",
    email: "partnerships@kigaliacademy.rw",
    subject: "Platform partnership",
    message: "We want to discuss courses, marketplace selling, multimedia support, and AI automation for our creator programs.",
    source: "seed"
  });

  await upsertBy(AccountApplication, { applicantEmail: "student2@mrcreativist.com", requestedRole: "seller" }, {
    userId: student2._id,
    applicantName: student2.name,
    applicantEmail: student2.email,
    requestedRole: "seller",
    status: "pending",
    professionalTitle: "Digital product seller",
    organization: "Eric Learning Shop",
    phone: "+250 788 000 000",
    website: "https://example.com/eric-learning-shop",
    summary: "I want to sell course workbooks, creator templates, and digital delivery packages through the marketplace with clear support and refund rules.",
    experienceYears: 2,
    roleDetails: {
      productCategories: "Course workbooks, creator templates, digital downloads, and business planning kits.",
      fulfillmentModel: "Digital downloads",
      businessRegistrationNumber: "Pending local registration",
      returnPolicy: "Refunds are offered for duplicate purchases or broken downloads within seven days after support review."
    },
    documents: [
      { label: "Government ID", fileName: "government-id.pdf", url: "https://example.com/docs/eric-id.pdf", kind: "identity" },
      { label: "Business registration or seller profile", fileName: "seller-profile.pdf", url: "https://example.com/docs/eric-seller-profile.pdf", kind: "business" },
      { label: "Fulfillment or digital delivery policy", fileName: "delivery-policy.pdf", url: "https://example.com/docs/eric-delivery-policy.pdf", kind: "policy" }
    ],
    adminNotes: ""
  });

  console.log(`MongoDB seed completed for ${mongoose.connection.name}.`);
  console.log("Inserted or updated: 9 users, 8 courses, 10 products, 5 services, 5 freelancers, 3 projects, 4 AI tools, and account applications.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
