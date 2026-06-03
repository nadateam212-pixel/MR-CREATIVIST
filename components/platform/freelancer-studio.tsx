"use client";

/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileCheck2,
  Languages,
  MessageSquare,
  Receipt,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Upload,
  Wallet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PriceDisplay } from "@/components/ui/price-display";
import { Progress } from "@/components/ui/progress";
import { formatConvertedAmount } from "@/lib/currency";
import { useI18n } from "@/hooks/use-i18n";
import { useUserPreferences } from "@/hooks/use-user-preferences";

type ProjectBrief = {
  id: string;
  title: string;
  client: string;
  category: string;
  budget: number;
  estimatedHours: number;
  deadlineDays: number;
  language: string;
  skills: string[];
  outcome: string;
  deliverables: string[];
};

type Freelancer = {
  id: string;
  name: string;
  role: string;
  specialty: string;
  location: string;
  rate: number;
  rating: number;
  completed: number;
  responseHours: number;
  availability: number;
  portfolio: number;
  languages: string[];
  skills: string[];
  verified: string[];
  isVerified?: boolean;
  image: string;
};

type PublicGig = {
  id?: string;
  ownerId?: string;
  ownerName?: string;
  ownerAddress?: string;
  ownerCity?: string;
  ownerCountry?: string;
  slug: string;
  title: string;
  category: string;
  packageName: string;
  description: string;
  price: string;
  deliveryDays: number;
  revisions: number;
  image: string;
  tags: string[];
  deliverables: string[];
  rating: number;
  orders: number;
  status?: string;
  isVerified?: boolean;
};

type StudioStage =
  | "MATCH"
  | "PROPOSAL"
  | "ESCROW"
  | "WORKROOM"
  | "REVIEW"
  | "PAID";

const projectBriefs: ProjectBrief[] = [
  {
    id: "course-launch",
    title: "AI COURSE LAUNCH KIT",
    client: "KIGALI ACADEMY",
    category: "AI AUTOMATION",
    budget: 2800,
    estimatedHours: 42,
    deadlineDays: 14,
    language: "ENGLISH",
    skills: ["AI WORKFLOWS", "COURSE FUNNELS", "COPYWRITING", "VIDEO EDITING"],
    outcome:
      "TURN A TRAINING IDEA INTO A SELLABLE COURSE LAUNCH SYSTEM WITH AUTOMATION, SALES COPY AND ANALYTICS.",
    deliverables: [
      "COURSE OUTLINE",
      "LANDING PAGE COPY",
      "EMAIL LAUNCH SEQUENCE",
      "DASHBOARD CHECKLIST"
    ]
  },
  {
    id: "marketplace-brand",
    title: "MARKETPLACE BRAND SYSTEM",
    client: "NOVA SELLERS",
    category: "BRAND DESIGN",
    budget: 1900,
    estimatedHours: 34,
    deadlineDays: 10,
    language: "ENGLISH",
    skills: ["BRAND DESIGN", "PRODUCT MOCKUPS", "COPYWRITING", "SEO"],
    outcome:
      "BUILD A PREMIUM SELLER STORE IDENTITY WITH PRODUCT PRESENTATION, TRUST SIGNALS AND CONVERSION COPY.",
    deliverables: [
      "STORE IDENTITY",
      "PRODUCT MOCKUPS",
      "SEO PRODUCT COPY",
      "SELLER PROFILE"
    ]
  },
  {
    id: "media-campaign",
    title: "MULTIMEDIA SALES CAMPAIGN",
    client: "AFRI MEDIA LAB",
    category: "MULTIMEDIA",
    budget: 3600,
    estimatedHours: 56,
    deadlineDays: 21,
    language: "KINYARWANDA",
    skills: ["VIDEO EDITING", "MOTION GRAPHICS", "SOCIAL ADS", "SCRIPTING"],
    outcome:
      "PRODUCE A COMPLETE CAMPAIGN PACK FOR A PRODUCT LAUNCH WITH SHORT VIDEOS, AD VARIANTS AND HANDOFF FILES.",
    deliverables: [
      "CAMPAIGN SCRIPT",
      "6 SHORT VIDEOS",
      "AD CREATIVE SET",
      "FINAL ASSET LIBRARY"
    ]
  }
];

const stageFlow: { key: StudioStage; label: string; detail: string }[] = [
  { key: "MATCH", label: "MATCH", detail: "BRIEF AND RANKING" },
  { key: "PROPOSAL", label: "PROPOSAL", detail: "SCOPE AND TERMS" },
  { key: "ESCROW", label: "ESCROW", detail: "CLIENT FUNDS HELD" },
  { key: "WORKROOM", label: "WORKROOM", detail: "MILESTONE DELIVERY" },
  { key: "REVIEW", label: "REVIEW", detail: "APPROVAL AND RATING" },
  { key: "PAID", label: "PAID", detail: "PAYOUT COMPLETE" }
];

const milestoneBlueprint = [
  {
    title: "DISCOVERY AND SCOPE LOCK",
    percent: 20,
    asset: "SIGNED BRIEF, RISKS, TIMELINE AND ACCEPTANCE CRITERIA"
  },
  {
    title: "FIRST BUILD SPRINT",
    percent: 35,
    asset: "CORE CREATIVE, STRUCTURE, COPY OR PROTOTYPE READY"
  },
  {
    title: "QUALITY AND REVISION SPRINT",
    percent: 30,
    asset: "CLIENT FEEDBACK APPLIED, TESTS COMPLETED, EDGE CASES CLOSED"
  },
  {
    title: "FINAL HANDOFF",
    percent: 15,
    asset: "SOURCE FILES, INVOICE, USAGE NOTES AND REVIEW REQUEST"
  }
];

const initialMessages = [
  {
    sender: "CLIENT",
    body: "WE NEED A CLEAN BRIEF, FIXED MILESTONES AND WEEKLY DELIVERY VISIBILITY.",
    stamp: "09:10"
  },
  {
    sender: "FREELANCER",
    body: "I CAN START WITH SCOPE LOCK, THEN SEND THE FIRST BUILD SPRINT WITH PROOF FILES.",
    stamp: "09:14"
  }
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getMatchedSkills(freelancer: Freelancer, project: ProjectBrief) {
  return project.skills.filter((skill) => freelancer.skills.includes(skill));
}

function scoreFreelancer(freelancer: Freelancer, project: ProjectBrief) {
  const matchedSkills = getMatchedSkills(freelancer, project);
  const skillScore = (matchedSkills.length / project.skills.length) * 42;
  const categoryScore = freelancer.specialty === project.category ? 14 : 6;
  const estimatedCost = freelancer.rate * project.estimatedHours;
  const budgetScore =
    estimatedCost <= project.budget
      ? 16
      : clamp(
          16 - ((estimatedCost - project.budget) / project.budget) * 16,
          0,
          16
        );
  const ratingScore = (freelancer.rating / 5) * 10;
  const responseScore = clamp((8 - freelancer.responseHours) / 8, 0, 1) * 6;
  const availabilityScore = (freelancer.availability / 100) * 7;
  const portfolioScore = (freelancer.portfolio / 100) * 7;
  const languageScore = freelancer.languages.includes(project.language) ? 4 : 1;

  return Math.round(
    clamp(
      skillScore +
        categoryScore +
        budgetScore +
        ratingScore +
        responseScore +
        availabilityScore +
        portfolioScore +
        languageScore,
      0,
      100
    )
  );
}

export function FreelancerStudio({
  initialFreelancers = [],
  initialGigs = []
}: {
  initialFreelancers?: Freelancer[];
  initialGigs?: PublicGig[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const freelancers = initialFreelancers;
  const preferences = useUserPreferences();
  const { t } = useI18n();
  const publishedGigs = initialGigs.filter((gig) => gig.status === "published");
  const formatCurrency = (value: number) => formatConvertedAmount(value, "USD", preferences.currency, preferences.usdToFrw);
  const categories = useMemo(
    () => ["ALL", ...Array.from(new Set(freelancers.map((item) => item.specialty)))],
    [freelancers]
  );
  const [selectedProjectId, setSelectedProjectId] = useState(
    projectBriefs[0].id
  );
  const [selectedFreelancerId, setSelectedFreelancerId] = useState(
    freelancers[0]?.id ?? ""
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [urgency, setUrgency] = useState(2);
  const [stage, setStage] = useState<StudioStage>("MATCH");
  const [approvedMilestones, setApprovedMilestones] = useState(0);
  const [messageDraft, setMessageDraft] = useState("");
  const [messageLog, setMessageLog] = useState(initialMessages);
  const [requestingGigSlug, setRequestingGigSlug] = useState("");
  const [gigRequestStatus, setGigRequestStatus] = useState("");

  const selectedProject =
    projectBriefs.find((project) => project.id === selectedProjectId) ??
    projectBriefs[0];
  const selectedFreelancer =
    freelancers.find((freelancer) => freelancer.id === selectedFreelancerId) ??
    freelancers[0];

  const filteredMatches = useMemo(() => {
    const term = query.trim().toLowerCase();

    return freelancers
      .filter(
        (freelancer) => category === "ALL" || freelancer.specialty === category
      )
      .filter((freelancer) => {
        const haystack = [
          freelancer.name,
          freelancer.role,
          freelancer.location,
          freelancer.specialty,
          ...freelancer.skills
        ]
          .join(" ")
          .toLowerCase();

        return !term || haystack.includes(term);
      })
      .map((freelancer) => ({
        freelancer,
        score: scoreFreelancer(freelancer, selectedProject),
        matchedSkills: getMatchedSkills(freelancer, selectedProject)
      }))
      .sort((a, b) => b.score - a.score);
  }, [category, freelancers, query, selectedProject]);

  if (!selectedFreelancer) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BriefcaseBusiness className="mx-auto mb-4 size-8 text-[hsl(var(--primary))]" />
          <h2 className="text-xl font-semibold">No freelancers found</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[hsl(var(--muted-foreground))]">
            Publish freelancer profiles to activate matching, contracts, escrow, and reviews.
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedScore = scoreFreelancer(selectedFreelancer, selectedProject);
  const matchedSkills = getMatchedSkills(selectedFreelancer, selectedProject);
  const urgencyMultiplier = 1 + urgency * 0.035;
  const proposalAmount = Math.round(
    Math.min(
      selectedProject.budget * 0.96,
      Math.max(
        selectedProject.budget * 0.62,
        selectedFreelancer.rate *
          selectedProject.estimatedHours *
          urgencyMultiplier
      )
    )
  );
  const platformFee = Math.round(proposalAmount * 0.08);
  const freelancerReceives = proposalAmount - platformFee;
  const stageIndex = stageFlow.findIndex((item) => item.key === stage);
  const contractProgress = Math.round(
    (stageIndex / (stageFlow.length - 1)) * 100
  );
  const escrowFunded =
    stageIndex >= stageFlow.findIndex((item) => item.key === "WORKROOM");
  const releasedAmount = stage === "PAID" ? freelancerReceives : 0;

  const milestones = milestoneBlueprint.map((milestone) => ({
    ...milestone,
    amount: Math.round((proposalAmount * milestone.percent) / 100)
  }));

  function resetContract() {
    setStage("MATCH");
    setApprovedMilestones(0);
  }

  function selectProject(projectId: string) {
    setSelectedProjectId(projectId);
    resetContract();
  }

  function selectFreelancer(freelancerId: string) {
    setSelectedFreelancerId(freelancerId);
    resetContract();
  }

  async function requestGig(gig: PublicGig) {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/freelancers%23${gig.slug}`);
      return;
    }

    setRequestingGigSlug(gig.slug);
    setGigRequestStatus("");

    try {
      const response = await fetch("/api/gigs/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: gig.ownerId,
          ownerName: gig.ownerName ?? "Freelancer",
          gigSlug: gig.slug,
          gigTitle: gig.title,
          gigPrice: gig.price
        })
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Could not request this gig.");

      setGigRequestStatus("Gig owner notified. Opening chat...");
      router.push(payload.threadUrl ?? "/messages");
    } catch (error) {
      setGigRequestStatus(error instanceof Error ? error.message : "Could not request this gig.");
    } finally {
      setRequestingGigSlug("");
    }
  }

  function handlePrimaryAction() {
    if (stage === "MATCH") {
      setStage("PROPOSAL");
      return;
    }

    if (stage === "PROPOSAL") {
      setStage("ESCROW");
      return;
    }

    if (stage === "ESCROW") {
      setStage("WORKROOM");
      return;
    }

    if (stage === "WORKROOM") {
      const nextCount = Math.min(approvedMilestones + 1, milestones.length);
      setApprovedMilestones(nextCount);

      if (nextCount === milestones.length) {
        setStage("REVIEW");
      }
      return;
    }

    if (stage === "REVIEW") {
      setStage("PAID");
      return;
    }

    resetContract();
  }

  function getPrimaryActionLabel() {
    if (stage === "MATCH") return "GENERATE PROPOSAL";
    if (stage === "PROPOSAL") return "ACCEPT CONTRACT";
    if (stage === "ESCROW") return "FUND ESCROW";
    if (stage === "WORKROOM") {
      return approvedMilestones >= milestones.length - 1
        ? "APPROVE FINAL MILESTONE"
        : "APPROVE NEXT MILESTONE";
    }
    if (stage === "REVIEW") return "RELEASE PAYMENT";
    return "START NEW CONTRACT";
  }

  function sendMessage() {
    const cleanMessage = messageDraft.trim();
    if (!cleanMessage) return;

    setMessageLog((current) => [
      ...current,
      {
        sender: "CLIENT",
        body: cleanMessage.toUpperCase(),
        stamp: "NOW"
      }
    ]);
    setMessageDraft("");
  }

  return (
    <div className="bg-[hsl(var(--background))]">
      {publishedGigs.length ? (
        <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
                  {t("freelancer.publicGigs")}
                </p>
                <h2 className="mt-2 text-3xl font-black uppercase tracking-tight">
                  {t("freelancer.marketplace")}
                </h2>
              </div>
              <Button asChild variant="outline">
                <Link href="/freelancer/gigs">{t("freelancer.createGig")}</Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {publishedGigs.map((gig) => (
                <Card key={gig.slug} id={gig.slug} className="overflow-hidden">
                  <div className="relative aspect-[4/3] bg-[hsl(var(--muted))]">
                    <img src={gig.image} alt={gig.title} className="h-full w-full object-cover" />
                  </div>
                  <CardHeader>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{gig.category}</Badge>
                      <Badge>{gig.deliveryDays} days</Badge>
                      <Badge>{gig.revisions} revisions</Badge>
                      {gig.isVerified ? (
                        <Badge className="border-sky-500/45 text-sky-500">
                          <BadgeCheck className="mr-1 size-3" />
                          Verified
                        </Badge>
                      ) : null}
                    </div>
                    <CardTitle className="leading-tight">{gig.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-md border border-[hsl(var(--border))] p-3 text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                      <p className="text-[hsl(var(--foreground))]">{gig.ownerName ?? "Freelancer"}</p>
                      <p className="mt-1">
                        {[gig.ownerAddress, gig.ownerCity, gig.ownerCountry].filter(Boolean).join(", ") || "Remote"}
                      </p>
                    </div>
                    <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">{gig.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {gig.tags.slice(0, 4).map((tag) => (
                        <Badge key={`${gig.slug}-${tag}`}>{tag}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <PriceDisplay price={gig.price} className="text-xl text-[hsl(var(--primary))]" />
                      <Button size="sm" onClick={() => void requestGig(gig)} disabled={requestingGigSlug === gig.slug}>
                        <BriefcaseBusiness className="size-4" />
                        {requestingGigSlug === gig.slug ? "Sending..." : t("freelancer.requestGig")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {gigRequestStatus ? (
              <p className="mt-4 rounded-md border border-[hsl(var(--border))] p-3 text-sm text-[hsl(var(--muted-foreground))]">
                {gigRequestStatus}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[1.25fr_0.85fr]">
        <Card className="order-3 xl:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Target className="size-5 text-[hsl(var(--primary))]" />
              <CardTitle className="uppercase">PROJECT BRIEF</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <label className="text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                SELECT CLIENT JOB
              </label>
              <select
                value={selectedProjectId}
                onChange={(event) => selectProject(event.target.value)}
                className="h-11 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm font-bold uppercase"
              >
                {projectBriefs.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 text-sm font-semibold uppercase leading-6 text-[hsl(var(--muted-foreground))]">
              <p className="flex items-center justify-between gap-3">
                <span>CLIENT</span>
                <strong className="text-[hsl(var(--foreground))]">
                  {selectedProject.client}
                </strong>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span>CATEGORY</span>
                <strong className="text-[hsl(var(--foreground))]">
                  {selectedProject.category}
                </strong>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span>DEADLINE</span>
                <strong className="text-[hsl(var(--foreground))]">
                  {selectedProject.deadlineDays} DAYS
                </strong>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span>ESTIMATED WORK</span>
                <strong className="text-[hsl(var(--foreground))]">
                  {selectedProject.estimatedHours} HOURS
                </strong>
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                REQUIRED SKILLS
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedProject.skills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                DELIVERABLES
              </p>
              <div className="mt-3 grid gap-2">
                {selectedProject.deliverables.map((deliverable) => (
                  <p
                    key={deliverable}
                    className="flex items-center gap-2 text-sm font-semibold uppercase"
                  >
                    <CheckCircle2 className="size-4 text-[hsl(var(--primary))]" />
                    {deliverable}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="order-1">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-[hsl(var(--primary))]" />
                <CardTitle className="text-lg uppercase sm:text-xl">AI MATCH BOARD</CardTitle>
              </div>
              <Badge className="w-fit shrink-0 text-[10px]">{filteredMatches.length} MATCHES</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-11 pl-10 uppercase"
                  placeholder="SEARCH SKILLS, ROLE OR LOCATION"
                />
              </div>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-11 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm font-bold uppercase"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {filteredMatches.map(
                ({ freelancer, score, matchedSkills: skills }) => {
                  const isSelected = freelancer.id === selectedFreelancerId;
                  const visibleSkills = skills.slice(0, 2);
                  const hiddenSkillCount = Math.max(skills.length - visibleSkills.length, 0);

                  return (
                    <button
                      key={freelancer.id}
                      type="button"
                      onClick={() => selectFreelancer(freelancer.id)}
                      className={[
                        "grid min-w-0 gap-4 overflow-hidden rounded-md border p-4 text-left transition-colors sm:grid-cols-[4.5rem_1fr] xl:grid-cols-[4.5rem_1fr]",
                        isSelected
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
                          : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/55"
                      ].join(" ")}
                    >
                      <span className="relative size-16 overflow-hidden rounded-md bg-[hsl(var(--muted))]">
                        <Image
                          src={freelancer.image}
                          alt={freelancer.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </span>
                      <span className="min-w-0 overflow-hidden">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-black uppercase">
                            {freelancer.name}
                          </span>
                          {freelancer.isVerified ? (
                            <Badge className="border-sky-500/45 text-sky-500">
                              <BadgeCheck className="mr-1 size-3" />
                              Verified
                            </Badge>
                          ) : null}
                          <Badge>{freelancer.specialty}</Badge>
                        </span>
                        <span className="mt-1 block text-xs font-black uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
                          {freelancer.role}
                        </span>
                        <span className="mt-3 flex max-w-full flex-wrap gap-2 overflow-hidden">
                          {visibleSkills.length > 0 ? (
                            <>
                            {visibleSkills.map((skill) => (
                              <Badge
                                key={`${freelancer.id}-${skill}`}
                                className="max-w-full truncate border-[hsl(var(--primary))]/45 text-[hsl(var(--primary))]"
                              >
                                {skill}
                              </Badge>
                            ))}
                            {hiddenSkillCount ? <Badge>+{hiddenSkillCount}</Badge> : null}
                            </>
                          ) : (
                            <Badge>GENERAL FIT</Badge>
                          )}
                        </span>
                      </span>
                      <span className="grid gap-1 text-sm font-black uppercase sm:col-span-2 sm:grid-cols-2 sm:gap-2">
                        <span className="flex items-center gap-1">
                          <Star className="size-4 fill-amber-400 text-amber-400" />
                          {freelancer.rating.toFixed(1)}
                        </span>
                        <span className="text-2xl text-[hsl(var(--primary))] sm:text-right">
                          {score}%
                        </span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))] sm:col-span-2">
                          {formatCurrency(freelancer.rate)} / HOUR
                        </span>
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="order-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileCheck2 className="size-5 text-[hsl(var(--primary))]" />
              <CardTitle className="uppercase">PROPOSAL DESK</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                SELECTED FREELANCER
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="relative size-14 overflow-hidden rounded-md">
                  <Image
                    src={selectedFreelancer.image}
                    alt={selectedFreelancer.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </span>
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-black uppercase">
                    <span>{selectedFreelancer.name}</span>
                    {selectedFreelancer.isVerified ? (
                      <Badge className="border-sky-500/45 text-sky-500">
                        <BadgeCheck className="mr-1 size-3" />
                        Verified
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                    {selectedFreelancer.location}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3 text-sm font-black uppercase">
                <span>SKILL COVERAGE</span>
                <span>
                  {matchedSkills.length}/{selectedProject.skills.length}
                </span>
              </div>
              <Progress
                value={
                  (matchedSkills.length / selectedProject.skills.length) * 100
                }
              />
              <div className="flex items-center justify-between gap-3 text-sm font-black uppercase">
                <span>CONTRACT READINESS</span>
                <span>{selectedScore}%</span>
              </div>
              <Progress value={selectedScore} />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                URGENCY MULTIPLIER
              </label>
              <input
                type="range"
                min="0"
                max="5"
                value={urgency}
                onChange={(event) => setUrgency(Number(event.target.value))}
                className="w-full accent-[hsl(var(--primary))]"
              />
              <p className="text-sm font-semibold uppercase text-[hsl(var(--muted-foreground))]">
                {urgency === 0
                  ? "STANDARD TIMELINE"
                  : `${urgency} LEVEL URGENCY`}
              </p>
            </div>

            <div className="grid gap-3 rounded-md border border-[hsl(var(--border))] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                SMART QUOTE
              </p>
              <p className="text-3xl font-black text-[hsl(var(--primary))]">
                {formatCurrency(proposalAmount)}
              </p>
              <div className="grid gap-2 text-sm font-semibold uppercase text-[hsl(var(--muted-foreground))]">
                <span>PLATFORM FEE: {formatCurrency(platformFee)}</span>
                <span>
                  FREELANCER RECEIVES: {formatCurrency(freelancerReceives)}
                </span>
                <span>
                  CLIENT SAVES AGAINST BUDGET:{" "}
                  {formatCurrency(selectedProject.budget - proposalAmount)}
                </span>
              </div>
            </div>

            <Button onClick={handlePrimaryAction} className="w-full font-black">
              {getPrimaryActionLabel()}
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-5 text-[hsl(var(--primary))]" />
                  <CardTitle className="uppercase">
                    A-Z CONTRACT ENGINE
                  </CardTitle>
                </div>
                <Badge>{contractProgress}% COMPLETE</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5">
              <Progress value={contractProgress} />
              <div className="grid gap-3 md:grid-cols-3">
                {stageFlow.map((item, index) => {
                  const isDone = index < stageIndex || stage === "PAID";
                  const isActive = item.key === stage;

                  return (
                    <div
                      key={item.key}
                      className={[
                        "rounded-md border p-4",
                        isActive
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
                          : isDone
                            ? "border-[hsl(var(--primary))]/45 bg-[hsl(var(--primary))]/10 text-[hsl(var(--foreground))]"
                            : "border-[hsl(var(--border))] bg-[hsl(var(--background))]"
                      ].join(" ")}
                    >
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                        STEP {index + 1}
                      </p>
                      <p className="mt-2 font-black uppercase">{item.label}</p>
                      <p className="mt-1 text-xs font-semibold uppercase leading-5 text-[hsl(var(--muted-foreground))]">
                        {item.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Wallet className="size-5 text-[hsl(var(--primary))]" />
                <CardTitle className="uppercase">ESCROW AND PAYOUT</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              {[
                {
                  label: "CLIENT FUNDED",
                  value: escrowFunded ? formatCurrency(proposalAmount) : "$0"
                },
                {
                  label: "APPROVED VALUE",
                  value: formatCurrency(
                    milestones
                      .slice(0, approvedMilestones)
                      .reduce((total, milestone) => total + milestone.amount, 0)
                  )
                },
                {
                  label: "RELEASED PAYOUT",
                  value: formatCurrency(releasedAmount)
                }
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-md border border-[hsl(var(--border))] p-4"
                >
                  <p className="text-sm font-black uppercase text-[hsl(var(--muted-foreground))]">
                    {item.label}
                  </p>
                  <p className="text-xl font-black">{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Upload className="size-5 text-[hsl(var(--primary))]" />
              <CardTitle className="uppercase">MILESTONE WORKROOM</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {milestones.map((milestone, index) => {
              const isApproved = index < approvedMilestones || stage === "PAID";
              const isActive =
                stage === "WORKROOM" && index === approvedMilestones;
              const status = isApproved
                ? "APPROVED"
                : isActive
                  ? "ACTIVE"
                  : "LOCKED";

              return (
                <div
                  key={milestone.title}
                  className="grid gap-4 rounded-md border border-[hsl(var(--border))] p-4 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{status}</Badge>
                      <Badge>{formatCurrency(milestone.amount)}</Badge>
                    </div>
                    <p className="mt-3 font-black uppercase">
                      {milestone.title}
                    </p>
                    <p className="mt-1 text-sm font-semibold uppercase leading-6 text-[hsl(var(--muted-foreground))]">
                      {milestone.asset}
                    </p>
                  </div>
                  {isApproved ? (
                    <CheckCircle2 className="size-7 text-emerald-500" />
                  ) : (
                    <Clock className="size-7 text-[hsl(var(--muted-foreground))]" />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageSquare className="size-5 text-[hsl(var(--primary))]" />
                <CardTitle className="uppercase">
                  CLIENT WORKROOM CHAT
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid max-h-56 gap-3 overflow-auto pr-1">
                {messageLog.map((message, index) => (
                  <div
                    key={`${message.sender}-${message.stamp}-${index}`}
                    className="rounded-md border border-[hsl(var(--border))] p-3"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                      {message.sender} / {message.stamp}
                    </p>
                    <p className="mt-2 text-sm font-semibold uppercase leading-6">
                      {message.body}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value)}
                  placeholder="TYPE UPDATE, REQUEST OR REVISION"
                  className="uppercase"
                />
                <Button onClick={sendMessage} className="font-black">
                  <Send className="size-4" />
                  SEND
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Receipt className="size-5 text-[hsl(var(--primary))]" />
                <CardTitle className="uppercase">FINAL INVOICE</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm font-semibold uppercase text-[hsl(var(--muted-foreground))]">
              <p className="flex justify-between gap-3">
                <span>CONTRACT</span>
                <strong className="text-[hsl(var(--foreground))]">
                  {selectedProject.title}
                </strong>
              </p>
              <p className="flex justify-between gap-3">
                <span>FREELANCER</span>
                <strong className="text-[hsl(var(--foreground))]">
                  {selectedFreelancer.name}
                </strong>
              </p>
              <p className="flex justify-between gap-3">
                <span>PAYMENT STATUS</span>
                <strong className="text-[hsl(var(--foreground))]">
                  {stage}
                </strong>
              </p>
              <p className="flex justify-between gap-3 border-t border-[hsl(var(--border))] pt-3 text-base">
                <span>TOTAL DUE</span>
                <strong className="text-[hsl(var(--primary))]">
                  {formatCurrency(proposalAmount)}
                </strong>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35 text-[hsl(var(--foreground))]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-4">
          {[
            {
              title: "VERIFIED TALENT",
              body: `${freelancers.reduce((total, item) => total + item.completed, 0)} COMPLETED JOBS INDEXED`,
              icon: BadgeCheck
            },
            {
              title: "GLOBAL DELIVERY",
              body: "ENGLISH, KINYARWANDA AND CROSS-BORDER WORKFLOWS",
              icon: Languages
            },
            {
              title: "SCOPE CONTROL",
              body: "CLEAR ACCEPTANCE CRITERIA BEFORE PAYMENT RELEASE",
              icon: BriefcaseBusiness
            },
            {
              title: "GROWTH SIGNALS",
              body: "RATINGS, PORTFOLIO SCORE AND RESPONSE SPEED RANKING",
              icon: TrendingUp
            }
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
            >
              <item.icon className="mb-4 size-6 text-[hsl(var(--primary))]" />
              <p className="font-black uppercase">{item.title}</p>
              <p className="mt-2 text-sm font-semibold uppercase leading-6 text-[hsl(var(--muted-foreground))]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: CalendarDays,
              title: "BOOK AND START",
              body: "CLIENT APPROVES SCOPE, FUNDS ESCROW AND OPENS THE WORKROOM."
            },
            {
              icon: ShieldCheck,
              title: "PROTECT BOTH SIDES",
              body: "MILESTONES, REVISION LIMITS AND ACCEPTANCE RULES ARE VISIBLE."
            },
            {
              icon: Star,
              title: "RATE AND REHIRE",
              body: "FINAL REVIEW UPDATES TRUST SIGNALS AND CREATES A REHIRE PATH."
            }
          ].map((item) => (
            <Card key={item.title}>
              <CardContent className="p-6">
                <item.icon className="mb-4 size-6 text-[hsl(var(--primary))]" />
                <p className="font-black uppercase">{item.title}</p>
                <p className="mt-2 text-sm font-semibold uppercase leading-6 text-[hsl(var(--muted-foreground))]">
                  {item.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
