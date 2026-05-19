"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, FileCheck2, FileUp, Loader2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RoleApplicationDocument, RoleApplicationProfile } from "@/lib/account-roles";
import { cn } from "@/lib/utils";

type ExistingDocument = {
  label: string;
  fileName?: string;
  url: string;
  kind: string;
  assetId?: string;
  description?: string;
};

type ExistingApplication = {
  id: string;
  status: "pending" | "approved" | "rejected" | "needs_more_info";
  professionalTitle?: string;
  organization?: string;
  phone?: string;
  website?: string;
  summary?: string;
  experienceYears?: number;
  roleDetails?: Record<string, string>;
  documents?: ExistingDocument[];
  adminNotes?: string;
  updatedAt?: string;
};

type DocumentState = {
  url: string;
  fileName: string;
  assetId?: string;
  uploading: boolean;
  error: string;
};

const baseInputClass =
  "rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-[hsl(var(--muted-foreground))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]";

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function applicationStatusCopy(status?: ExistingApplication["status"]) {
  if (status === "approved") return "Approved";
  if (status === "needs_more_info") return "Needs more info";
  if (status === "rejected") return "Rejected";
  return "Pending admin review";
}

function buildInitialDocuments(profile: RoleApplicationProfile, existing?: ExistingApplication | null) {
  const byLabel = new Map((existing?.documents ?? []).map((document) => [document.label, document]));

  return Object.fromEntries(
    profile.documents.map((document) => {
      const savedDocument = byLabel.get(document.label);
      return [
        document.id,
        {
          url: savedDocument?.url ?? "",
          fileName: savedDocument?.fileName ?? "",
          assetId: savedDocument?.assetId,
          uploading: false,
          error: ""
        }
      ];
    })
  ) as Record<string, DocumentState>;
}

function DocumentUploadCard({
  document,
  state,
  onExternalUrl,
  onUpload
}: {
  document: RoleApplicationDocument;
  state: DocumentState;
  onExternalUrl: (url: string) => void;
  onUpload: (file: File) => void;
}) {
  const isUploadedFile = state.url.startsWith("/api/uploads/");

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{document.label}</p>
            {document.required ? <Badge>Required</Badge> : <Badge>Optional</Badge>}
          </div>
          <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{document.description}</p>
        </div>
        {state.url ? (
          <CheckCircle2 className="size-5 shrink-0 text-[hsl(var(--primary))]" aria-label="Document added" />
        ) : (
          <FileUp className="size-5 shrink-0 text-[hsl(var(--muted-foreground))]" aria-hidden />
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {document.examples.map((example) => (
          <span key={example} className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-1 text-xs text-[hsl(var(--muted-foreground))]">
            {example}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
        <Input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx"
          disabled={state.uploading}
          aria-label={`Upload ${document.label}`}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
        {state.url ? (
          <Button asChild type="button" variant="outline">
            <Link href={state.url} target="_blank">
              Open <ExternalLink className="size-4" />
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="mt-3 grid gap-1">
        <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]" htmlFor={`external-${document.id}`}>
          Or paste a Drive, cloud storage, or portfolio URL
        </label>
        <Input
          id={`external-${document.id}`}
          type="url"
          value={isUploadedFile ? "" : state.url}
          onChange={(event) => onExternalUrl(event.target.value)}
          placeholder="https://..."
        />
      </div>

      {state.fileName ? (
        <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
          Attached: <span className="font-medium text-[hsl(var(--foreground))]">{state.fileName}</span>
        </p>
      ) : null}
      {state.uploading ? (
        <p className="mt-2 inline-flex items-center gap-2 text-xs text-[hsl(var(--primary))]">
          <Loader2 className="size-3 animate-spin" /> Uploading document...
        </p>
      ) : null}
      {state.error ? <p className="mt-2 text-xs text-[hsl(var(--destructive))]">{state.error}</p> : null}
    </div>
  );
}

export function AccountApplicationForm({
  profile,
  existingApplication,
  alreadyValidated
}: {
  profile: RoleApplicationProfile;
  existingApplication?: ExistingApplication | null;
  alreadyValidated?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    professionalTitle: existingApplication?.professionalTitle ?? "",
    organization: existingApplication?.organization ?? "",
    phone: existingApplication?.phone ?? "",
    website: existingApplication?.website ?? "",
    summary: existingApplication?.summary ?? "",
    experienceYears: String(existingApplication?.experienceYears ?? 0)
  });
  const [roleDetails, setRoleDetails] = useState<Record<string, string>>(
    Object.fromEntries(profile.detailFields.map((field) => [field.name, existingApplication?.roleDetails?.[field.name] ?? ""]))
  );
  const [documents, setDocuments] = useState(() => buildInitialDocuments(profile, existingApplication));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const requiredMissing = useMemo(
    () => profile.documents.filter((document) => document.required && !documents[document.id]?.url.trim()).map((document) => document.label),
    [documents, profile.documents]
  );

  function updateDocument(documentId: string, patch: Partial<DocumentState>) {
    setDocuments((current) => ({
      ...current,
      [documentId]: {
        ...current[documentId],
        ...patch
      }
    }));
  }

  async function uploadDocument(document: RoleApplicationDocument, file: File) {
    updateDocument(document.id, { uploading: true, error: "" });

    try {
      const payload = new FormData();
      payload.append("file", file);
      payload.append("kind", "document");
      payload.append("ownerType", "profile");
      payload.append(
        "metadata",
        JSON.stringify({
          requestedRole: profile.role,
          documentId: document.id,
          documentLabel: document.label,
          documentKind: document.kind
        })
      );

      const response = await fetch("/api/upload", {
        method: "POST",
        body: payload
      });
      const result = await response.json();

      if (!response.ok) {
        updateDocument(document.id, { error: result.error ?? "Upload failed.", uploading: false });
        return;
      }

      updateDocument(document.id, {
        url: result.asset.url,
        assetId: result.asset.id,
        fileName: result.asset.fileName,
        uploading: false,
        error: ""
      });
    } catch {
      updateDocument(document.id, { error: "Upload failed. Try again.", uploading: false });
    }
  }

  function validateClient() {
    if (!form.professionalTitle.trim()) return "Professional title is required.";
    if (form.summary.trim().length < 30) return "Summary must be at least 30 characters.";

    for (const field of profile.detailFields) {
      const value = roleDetails[field.name]?.trim() ?? "";
      if (field.required && !value) return `${field.label} is required.`;
      if (field.minLength && value && value.length < field.minLength) {
        return `${field.label} must be at least ${field.minLength} characters.`;
      }
      if (field.type === "url" && value && !isValidHttpUrl(value)) return `${field.label} must be a valid URL.`;
    }

    if (form.website && !isValidHttpUrl(form.website)) return "Website must be a valid URL.";
    if (requiredMissing.length) return `Add required documents: ${requiredMissing.join(", ")}.`;

    return "";
  }

  async function submitApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const clientError = validateClient();
    if (clientError) {
      setError(clientError);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/account/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedRole: profile.role,
          ...form,
          experienceYears: Number(form.experienceYears) || 0,
          roleDetails,
          documents: profile.documents
            .map((document) => {
              const state = documents[document.id];
              return {
                label: document.label,
                fileName: state?.fileName || document.label,
                url: state?.url?.trim() ?? "",
                kind: document.kind,
                assetId: state?.assetId,
                description: document.description
              };
            })
            .filter((document) => document.url)
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Application could not be submitted.");
        return;
      }

      setMessage(payload.message ?? "Application submitted for admin validation.");
      router.refresh();
    } catch {
      setError("Application could not be submitted. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Button asChild variant="ghost" className="-ml-3 mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Link>
          </Button>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[hsl(var(--primary))]">{profile.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{profile.title}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-[hsl(var(--muted-foreground))]">{profile.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.focusAreas.map((area) => (
            <Badge key={area}>{area}</Badge>
          ))}
        </div>
      </section>

      {alreadyValidated ? (
        <Card>
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 text-[hsl(var(--primary))]" />
              <div>
                <p className="font-semibold">This account mode is already validated.</p>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  Use the account switcher in the header to enter this dashboard.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/dashboard">Open account switcher</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {existingApplication && !alreadyValidated ? (
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{applicationStatusCopy(existingApplication.status)}</Badge>
              {existingApplication.updatedAt ? (
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  Updated {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(existingApplication.updatedAt))}
                </span>
              ) : null}
            </div>
            {existingApplication.adminNotes ? (
              <p className="mt-3 rounded-md border border-[hsl(var(--border))] p-3 text-sm text-[hsl(var(--muted-foreground))]">
                Admin note: {existingApplication.adminNotes}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <form onSubmit={submitApplication} className={cn("grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]", alreadyValidated && "opacity-60")}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Professional profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Input
                required
                value={form.professionalTitle}
                onChange={(event) => setForm((current) => ({ ...current, professionalTitle: event.target.value }))}
                placeholder="Professional title"
              />
              <Input
                value={form.organization}
                onChange={(event) => setForm((current) => ({ ...current, organization: event.target.value }))}
                placeholder="Organization or business"
              />
              <Input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="Phone"
              />
              <Input
                type="url"
                value={form.website}
                onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
                placeholder="Website or portfolio URL"
              />
              <Input
                type="number"
                min={0}
                max={80}
                value={form.experienceYears}
                onChange={(event) => setForm((current) => ({ ...current, experienceYears: event.target.value }))}
                placeholder="Years of experience"
              />
              <div className="sm:col-span-2">
                <textarea
                  required
                  minLength={30}
                  value={form.summary}
                  onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                  className={cn(baseInputClass, "min-h-32 w-full resize-y")}
                  placeholder="Explain your experience, offer, audience, risk controls, and why this account should be validated."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {profile.detailFields.map((field) => (
                <div key={field.name} className="grid gap-2">
                  <label className="text-sm font-semibold" htmlFor={field.name}>
                    {field.label}
                    {field.required ? <span className="text-[hsl(var(--destructive))]"> *</span> : null}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={field.name}
                      required={field.required}
                      minLength={field.minLength}
                      value={roleDetails[field.name] ?? ""}
                      onChange={(event) => setRoleDetails((current) => ({ ...current, [field.name]: event.target.value }))}
                      className={cn(baseInputClass, "min-h-28 w-full resize-y")}
                      placeholder={field.placeholder}
                    />
                  ) : field.type === "select" ? (
                    <select
                      id={field.name}
                      required={field.required}
                      value={roleDetails[field.name] ?? ""}
                      onChange={(event) => setRoleDetails((current) => ({ ...current, [field.name]: event.target.value }))}
                      className={cn(baseInputClass, "h-10")}
                    >
                      <option value="">{field.placeholder}</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
                      required={field.required}
                      value={roleDetails[field.name] ?? ""}
                      onChange={(event) => setRoleDetails((current) => ({ ...current, [field.name]: event.target.value }))}
                      placeholder={field.placeholder}
                    />
                  )}
                  {field.helper ? <p className="text-xs text-[hsl(var(--muted-foreground))]">{field.helper}</p> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {profile.documents.map((document) => (
                <DocumentUploadCard
                  key={document.id}
                  document={document}
                  state={documents[document.id]}
                  onExternalUrl={(url) => updateDocument(document.id, { url, fileName: url ? "External document URL" : "", assetId: undefined, error: "" })}
                  onUpload={(file) => void uploadDocument(document, file)}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="xl:sticky xl:top-24">
            <CardHeader>
              <CardTitle>Review checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {profile.documents.map((document) => (
                  <div key={document.id} className="flex items-center gap-2 text-sm">
                    <FileCheck2
                      className={cn(
                        "size-4",
                        documents[document.id]?.url ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
                      )}
                    />
                    <span>{document.label}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-md border border-[hsl(var(--border))] p-3 text-xs leading-5 text-[hsl(var(--muted-foreground))]">
                Admin can approve, reject, or request more information. Approved roles unlock their dashboard in the header account switcher.
              </div>
              {error ? <p className="rounded-md border border-[hsl(var(--destructive))]/40 p-3 text-sm text-[hsl(var(--destructive))]">{error}</p> : null}
              {message ? <p className="rounded-md border border-[hsl(var(--primary))]/40 p-3 text-sm text-[hsl(var(--primary))]">{message}</p> : null}
              <Button type="submit" className="w-full" disabled={submitting || alreadyValidated}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
                Submit for validation
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  );
}
