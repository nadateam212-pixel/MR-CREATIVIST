import type { Metadata } from "next";
import { JobsDirectory } from "@/components/platform/job-shop-workbenches";
import { getJobPosts } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Jobs"
};

const exampleJobs = [
  {
    title: "AI Workflow Specialist",
    slug: "ai-workflow-specialist",
    companyName: "MR Creativist Studio",
    companyLogo: "/icons/logo.png",
    location: "Remote",
    workplaceType: "Remote",
    employmentType: "Contract",
    salaryMin: 500,
    salaryMax: 1500,
    currency: "USD",
    category: "AI Tools",
    description:
      "Design practical AI workflows, prompt libraries, automations and client-ready documentation for creators and small businesses.",
    responsibilities: ["Build reusable AI workflows", "Document client playbooks", "Support launch and handoff"],
    requirements: ["Strong AI workflow portfolio", "Clear communication", "Ability to ship complete systems"],
    benefits: ["Remote collaboration", "Featured platform profile", "Performance growth opportunities"],
    skills: ["AI workflows", "Prompt engineering", "Automation", "Documentation"],
    contactEmail: "hello@mrcreativist.com",
    status: "published",
    isFeatured: true
  },
  {
    title: "Creative Content Producer",
    slug: "creative-content-producer",
    companyName: "MR Creativist Media",
    companyLogo: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=85",
    location: "Kigali, Rwanda",
    workplaceType: "Hybrid",
    employmentType: "Freelance",
    salaryMin: 250,
    salaryMax: 900,
    currency: "USD",
    category: "Media",
    description:
      "Plan, shoot, edit and package short-form learning and marketplace content for courses, businesses and brand campaigns.",
    responsibilities: ["Prepare shoot plans", "Edit short-form media", "Package assets for publishing"],
    requirements: ["Video editing portfolio", "Reliable delivery", "Strong visual taste"],
    benefits: ["Paid creative briefs", "Portfolio visibility", "Repeat client work"],
    skills: ["Video editing", "Storytelling", "Social media", "Production"],
    contactEmail: "hello@mrcreativist.com",
    status: "published",
    isFeatured: true
  },
  {
    title: "Marketplace Operations Assistant",
    slug: "marketplace-operations-assistant",
    companyName: "MR Creativist Commerce",
    companyLogo: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=85",
    location: "Online",
    workplaceType: "Remote",
    employmentType: "Part-time",
    salaryMin: 180,
    salaryMax: 650,
    currency: "USD",
    category: "Marketplace",
    description:
      "Help sellers publish clean business profiles, organize product details, respond to buyer questions and keep listings accurate.",
    responsibilities: ["Review shop details", "Prepare product copy", "Route buyer messages"],
    requirements: ["Detail-oriented writing", "Customer support mindset", "Comfort with digital products"],
    benefits: ["Flexible schedule", "Marketplace experience", "Growth into seller support"],
    skills: ["Operations", "Copywriting", "Customer support", "Catalog management"],
    contactEmail: "hello@mrcreativist.com",
    status: "published"
  }
];

export default async function JobsPage() {
  const jobs = await getJobPosts();
  const jobItems = jobs.length ? jobs : exampleJobs;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <JobsDirectory jobs={jobItems} />
    </div>
  );
}
