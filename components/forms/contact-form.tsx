"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
  const [values, setValues] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateValue(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (!emailPattern.test(values.email)) {
      setStatus("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(payload.error ?? "Message could not be sent.");

      setValues({ name: "", email: "", subject: "", message: "" });
      setStatus(payload.message ?? "Message sent.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Message could not be sent.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name" className="uppercase">
            YOUR NAME
          </Label>
          <Input id="name" required placeholder="YOUR FULL NAME" value={values.name} onChange={(event) => updateValue("name", event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email" className="uppercase">
            EMAIL ADDRESS
          </Label>
          <Input id="email" type="email" required placeholder="YOU@EXAMPLE.COM" value={values.email} onChange={(event) => updateValue("email", event.target.value)} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="subject" className="uppercase">
          SUBJECT
        </Label>
        <Input id="subject" required placeholder="COURSES, MARKETPLACE, AI TOOLS, MULTIMEDIA OR SUPPORT" value={values.subject} onChange={(event) => updateValue("subject", event.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message" className="uppercase">
          MESSAGE
        </Label>
        <textarea
          id="message"
          required
          rows={8}
          value={values.message}
          onChange={(event) => updateValue("message", event.target.value)}
          placeholder="TELL US WHAT YOU WANT TO BUILD, LEARN, SELL OR AUTOMATE..."
          className="w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-3 text-sm outline-none transition-colors placeholder:text-[hsl(var(--muted-foreground))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
        />
      </div>
      {status ? (
        <p className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35 px-4 py-3 text-sm font-medium">
          {status}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "SENDING..." : "SEND MESSAGE"}
        <Send className="size-4" />
      </Button>
    </form>
  );
}
