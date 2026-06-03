import type { PlatformRole } from "@/types";

export const accountRoles = ["client", "student", "instructor", "seller", "freelancer", "consultant"] as const;
export const elevatedAccountRoles = ["instructor", "seller", "freelancer", "consultant"] as const;

export type AccountRole = (typeof accountRoles)[number];
export type ElevatedAccountRole = (typeof elevatedAccountRoles)[number];
export type ApplicationDocumentKind = "identity" | "credential" | "portfolio" | "business" | "policy" | "other";
export type ApplicationFieldType = "text" | "textarea" | "url" | "number" | "select";

export type RoleApplicationDocument = {
  id: string;
  label: string;
  kind: ApplicationDocumentKind;
  description: string;
  examples: string[];
  required: boolean;
};

export type RoleApplicationField = {
  name: string;
  label: string;
  type: ApplicationFieldType;
  placeholder: string;
  required: boolean;
  helper?: string;
  options?: string[];
  minLength?: number;
};

export type RoleApplicationProfile = {
  role: ElevatedAccountRole;
  eyebrow: string;
  title: string;
  description: string;
  focusAreas: string[];
  documents: RoleApplicationDocument[];
  detailFields: RoleApplicationField[];
};

export const roleLabels: Record<AccountRole | "admin", string> = {
  admin: "Admin",
  client: "Client",
  student: "Student",
  instructor: "Instructor",
  seller: "Seller",
  freelancer: "Freelancer",
  consultant: "Consultant"
};

export const roleDashboardPaths: Record<AccountRole | "admin", string> = {
  admin: "/admin/dashboard",
  client: "/dashboard",
  student: "/dashboard",
  instructor: "/studio",
  seller: "/studio",
  freelancer: "/studio",
  consultant: "/studio"
};

export const roleApplicationProfiles: Record<ElevatedAccountRole, RoleApplicationProfile> = {
  instructor: {
    role: "instructor",
    eyebrow: "Instructor validation",
    title: "Apply as an instructor",
    description:
      "Share your teaching background, course idea, and proof that you can safely publish learning content on MR Creativist.",
    focusAreas: ["Teaching credentials", "Course quality", "Student safety", "Portfolio evidence"],
    documents: [
      {
        id: "government-id",
        label: "Government ID",
        kind: "identity",
        description: "A passport, national ID, or driver's license. Hide sensitive numbers if needed.",
        examples: ["Passport", "National ID", "Driver's license"],
        required: true
      },
      {
        id: "teaching-proof",
        label: "Teaching credential or course outline",
        kind: "credential",
        description: "Upload a certificate, degree, trainer badge, course syllabus, or detailed course outline.",
        examples: ["Certificate PDF", "Course outline", "Trainer accreditation"],
        required: true
      },
      {
        id: "sample-lesson",
        label: "Intro video or teaching portfolio",
        kind: "portfolio",
        description: "A sample lesson, showreel, recorded class, or public portfolio that shows your delivery style.",
        examples: ["Sample lesson video", "Portfolio URL", "Recorded workshop"],
        required: true
      }
    ],
    detailFields: [
      {
        name: "teachingTopics",
        label: "Course topics you want to teach",
        type: "textarea",
        placeholder: "Example: brand identity, video editing, AI workflow automation, digital marketing...",
        required: true,
        minLength: 20
      },
      {
        name: "courseFormats",
        label: "Preferred teaching format",
        type: "select",
        placeholder: "Choose a format",
        required: true,
        options: ["Recorded course", "Live cohort", "Hybrid lessons", "One-to-one coaching"]
      },
      {
        name: "audienceLevel",
        label: "Audience level",
        type: "select",
        placeholder: "Choose a level",
        required: true,
        options: ["Beginner", "Intermediate", "Advanced", "All levels"]
      },
      {
        name: "sampleLessonUrl",
        label: "Public sample lesson URL",
        type: "url",
        placeholder: "https://...",
        required: false,
        helper: "Optional when you upload a video or portfolio file below."
      }
    ]
  },
  seller: {
    role: "seller",
    eyebrow: "Seller validation",
    title: "Apply as a seller",
    description:
      "Tell us what you sell, how orders are fulfilled, and upload documents that prove your store can serve customers reliably.",
    focusAreas: ["Business identity", "Product quality", "Delivery process", "Customer support"],
    documents: [
      {
        id: "government-id",
        label: "Government ID",
        kind: "identity",
        description: "A passport, national ID, or driver's license for account owner verification.",
        examples: ["Passport", "National ID", "Driver's license"],
        required: true
      },
      {
        id: "business-registration",
        label: "Business registration or seller profile",
        kind: "business",
        description: "Upload business registration, trade license, tax document, or a verified seller profile.",
        examples: ["Business registration", "Trade license", "Tax certificate"],
        required: true
      },
      {
        id: "fulfillment-policy",
        label: "Fulfillment or digital delivery policy",
        kind: "policy",
        description: "Explain delivery timelines, refund rules, stock handling, and customer support process.",
        examples: ["Shipping policy", "Digital delivery terms", "Refund policy"],
        required: true
      }
    ],
    detailFields: [
      {
        name: "productCategories",
        label: "Product categories",
        type: "textarea",
        placeholder: "Example: design templates, creator gear, presets, books, digital downloads...",
        required: true,
        minLength: 15
      },
      {
        name: "fulfillmentModel",
        label: "Fulfillment model",
        type: "select",
        placeholder: "Choose a model",
        required: true,
        options: ["Digital downloads", "Physical shipping", "Print on demand", "Service delivery", "Mixed catalog"]
      },
      {
        name: "businessRegistrationNumber",
        label: "Business registration number",
        type: "text",
        placeholder: "Registration, tax, or license number",
        required: false
      },
      {
        name: "returnPolicy",
        label: "Return/refund policy summary",
        type: "textarea",
        placeholder: "Describe how refunds, replacements, and customer complaints are handled.",
        required: true,
        minLength: 20
      }
    ]
  },
  freelancer: {
    role: "freelancer",
    eyebrow: "Freelancer validation",
    title: "Apply as a freelancer",
    description:
      "Build trust with hiring clients by showing your skills, portfolio, availability, and professional proof.",
    focusAreas: ["Portfolio quality", "Skill proof", "Client readiness", "Delivery reliability"],
    documents: [
      {
        id: "government-id",
        label: "Government ID",
        kind: "identity",
        description: "A passport, national ID, or driver's license for identity verification.",
        examples: ["Passport", "National ID", "Driver's license"],
        required: true
      },
      {
        id: "portfolio",
        label: "Portfolio samples",
        kind: "portfolio",
        description: "Upload case studies, creative work, screenshots, project files, or a portfolio deck.",
        examples: ["Portfolio PDF", "Case study deck", "Project screenshots"],
        required: true
      },
      {
        id: "skill-proof",
        label: "Skill proof or client reference",
        kind: "credential",
        description: "Share a certificate, client recommendation, contract proof, or professional reference.",
        examples: ["Client reference", "Certificate", "Completion letter"],
        required: true
      }
    ],
    detailFields: [
      {
        name: "primarySkills",
        label: "Primary skills",
        type: "textarea",
        placeholder: "Example: motion design, web development, copywriting, social content, 3D product renders...",
        required: true,
        minLength: 15
      },
      {
        name: "servicePackages",
        label: "Services or gig packages",
        type: "textarea",
        placeholder: "Describe the gigs you want to sell, typical deliverables, and turnaround time.",
        required: true,
        minLength: 25
      },
      {
        name: "hourlyRate",
        label: "Target hourly rate",
        type: "number",
        placeholder: "35",
        required: true
      },
      {
        name: "availability",
        label: "Weekly availability",
        type: "select",
        placeholder: "Choose availability",
        required: true,
        options: ["Less than 10 hours", "10-20 hours", "20-30 hours", "30+ hours", "Project based only"]
      }
    ]
  },
  consultant: {
    role: "consultant",
    eyebrow: "Consultant validation",
    title: "Apply as a consultant",
    description:
      "Consultants need strong credentials, clear session offers, and evidence that clients can trust their advice.",
    focusAreas: ["Professional credentials", "Service clarity", "Client outcomes", "Booking readiness"],
    documents: [
      {
        id: "government-id",
        label: "Government ID",
        kind: "identity",
        description: "A passport, national ID, or driver's license for identity verification.",
        examples: ["Passport", "National ID", "Driver's license"],
        required: true
      },
      {
        id: "professional-credentials",
        label: "Professional credentials",
        kind: "credential",
        description: "Upload licenses, certifications, awards, degrees, or industry proof.",
        examples: ["License", "Certificate", "Degree", "Award"],
        required: true
      },
      {
        id: "case-study",
        label: "Case study or service proposal",
        kind: "portfolio",
        description: "Show a client outcome, advisory framework, proposal deck, or sample consulting plan.",
        examples: ["Case study", "Proposal deck", "Client outcome report"],
        required: true
      }
    ],
    detailFields: [
      {
        name: "expertiseAreas",
        label: "Consulting expertise",
        type: "textarea",
        placeholder: "Example: business strategy, creator monetization, brand positioning, AI operations...",
        required: true,
        minLength: 20
      },
      {
        name: "sessionTypes",
        label: "Session types",
        type: "textarea",
        placeholder: "Describe discovery calls, audits, strategy sessions, retainers, workshops, or packages.",
        required: true,
        minLength: 25
      },
      {
        name: "hourlyRate",
        label: "Target hourly rate",
        type: "number",
        placeholder: "100",
        required: true
      },
      {
        name: "availability",
        label: "Booking availability",
        type: "select",
        placeholder: "Choose availability",
        required: true,
        options: ["Weekdays", "Weekends", "Evenings", "Flexible", "Retainer clients only"]
      }
    ]
  }
};

export const roleApplicationRequirements: Record<ElevatedAccountRole, string[]> = {
  instructor: roleApplicationProfiles.instructor.documents.filter((document) => document.required).map((document) => document.label),
  seller: roleApplicationProfiles.seller.documents.filter((document) => document.required).map((document) => document.label),
  freelancer: roleApplicationProfiles.freelancer.documents.filter((document) => document.required).map((document) => document.label),
  consultant: roleApplicationProfiles.consultant.documents.filter((document) => document.required).map((document) => document.label)
};

export function isAccountRole(value: string): value is AccountRole {
  return accountRoles.includes(value as AccountRole);
}

export function isElevatedAccountRole(value: string): value is ElevatedAccountRole {
  return elevatedAccountRoles.includes(value as ElevatedAccountRole);
}

export function normalizeRoles(roles: unknown, fallback: PlatformRole[] = ["client"]) {
  const source = Array.isArray(roles) ? roles : [];
  const normalized = source.filter((role): role is PlatformRole =>
    ["client", "student", "instructor", "seller", "freelancer", "consultant", "admin"].includes(String(role))
  );

  return Array.from(new Set(normalized.length ? normalized : fallback));
}
