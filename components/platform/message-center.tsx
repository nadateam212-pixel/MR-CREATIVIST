"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Inbox, Loader2, MessageSquare, Search, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Contact = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  profileImage?: string;
  unreadCount?: number;
  lastMessage?: ChatMessage | null;
};

type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  subject?: string;
  contextType?: string;
  contextId?: string;
  content: string;
  createdAt?: string;
  readAt?: string;
};

function initials(value?: string | null) {
  return (value ?? "MC")
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function MessageCenter({ recipientId }: { recipientId?: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialRecipient = recipientId ?? searchParams.get("to") ?? "";
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedId, setSelectedId] = useState(initialRecipient);
  const [query, setQuery] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState(searchParams.get("subject") ?? "");
  const [contextType, setContextType] = useState(searchParams.get("contextType") ?? "direct");
  const [contextId] = useState(searchParams.get("contextId") ?? "");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const currentUserId = session?.user?.id ?? "";

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedId) ?? null,
    [contacts, selectedId]
  );
  const filteredContacts = contacts.filter((contact) =>
    `${contact.name ?? ""} ${contact.email ?? ""} ${contact.role ?? ""}`.toLowerCase().includes(query.toLowerCase())
  );

  const loadMessages = useCallback(
    async (nextSelectedId = selectedId) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (nextSelectedId) params.set("userId", nextSelectedId);
        const response = await fetch(`/api/messages?${params.toString()}`, { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) throw new Error(payload.error ?? "Messages unavailable.");

        setContacts(payload.contacts ?? []);
        setMessages(payload.items ?? []);

        if (!nextSelectedId && payload.contacts?.[0]?.id) {
          setSelectedId(payload.contacts[0].id);
        }
        setStatus("");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Messages unavailable.");
      } finally {
        setLoading(false);
      }
    },
    [selectedId]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMessages(initialRecipient);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialRecipient, loadMessages]);

  useEffect(() => {
    if (!selectedId) return;
    const interval = window.setInterval(() => {
      void loadMessages(selectedId);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [loadMessages, selectedId]);

  async function selectContact(contactId: string) {
    setSelectedId(contactId);
    router.replace(`/messages/${contactId}`);
    await loadMessages(contactId);
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId || !content.trim()) return;

    setStatus("Sending...");
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedId,
          subject: subject.trim(),
          contextType,
          contextId: contextId || undefined,
          content: content.trim()
        })
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Message failed.");

      setMessages((current) => [...current, payload]);
      setContent("");
      setStatus("Message sent.");
      toast.success("Private message sent.");
      await loadMessages(selectedId);
    } catch (error) {
      const nextStatus = error instanceof Error ? error.message : "Message failed.";
      setStatus(nextStatus);
      toast.error(nextStatus);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-10rem)] gap-5 lg:grid-cols-[21rem_1fr]">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Inbox className="size-5 text-[hsl(var(--primary))]" />
            <CardTitle>Messages</CardTitle>
          </div>
          <div className="relative pt-3">
            <Search className="absolute left-3 top-[1.55rem] size-4 text-[hsl(var(--muted-foreground))]" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Search users" />
          </div>
        </CardHeader>
        <CardContent className="grid max-h-[calc(100vh-16rem)] gap-2 overflow-y-auto p-3 pt-0">
          {filteredContacts.map((contact) => {
            const active = contact.id === selectedId;

            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => void selectContact(contact.id)}
                className={cn(
                  "grid grid-cols-[2.75rem_1fr] gap-3 rounded-md border p-3 text-left transition-colors",
                  active
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
                    : "border-transparent hover:border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/45"
                )}
              >
                <span className="relative flex size-11 items-center justify-center overflow-hidden rounded-md bg-[hsl(var(--muted))] text-sm font-black">
                  {contact.profileImage ? (
                    <Image src={contact.profileImage} alt={contact.name ?? "User"} fill sizes="44px" className="object-cover" />
                  ) : (
                    initials(contact.name)
                  )}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{contact.name ?? contact.email}</span>
                    {contact.unreadCount ? <Badge>{contact.unreadCount}</Badge> : null}
                  </span>
                  <span className="mt-1 block truncate text-xs text-[hsl(var(--muted-foreground))]">
                    {contact.lastMessage?.content ?? contact.role ?? "Platform user"}
                  </span>
                </span>
              </button>
            );
          })}
          {filteredContacts.length === 0 ? (
            <div className="rounded-md border border-dashed border-[hsl(var(--border))] p-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No users found. New users appear here after registration.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[hsl(var(--border))]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex size-12 items-center justify-center overflow-hidden rounded-md bg-[hsl(var(--muted))] font-black">
                {selectedContact?.profileImage ? (
                  <Image src={selectedContact.profileImage} alt={selectedContact.name ?? "User"} fill sizes="48px" className="object-cover" />
                ) : (
                  initials(selectedContact?.name)
                )}
              </span>
              <div>
                <CardTitle>{selectedContact?.name ?? "Select a conversation"}</CardTitle>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  {selectedContact?.email ?? "Send direct messages, shop questions and offer replies."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>
                <ShieldCheck className="mr-1 size-3" />
                Secure thread
              </Badge>
              {contextType !== "direct" ? <Badge>{contextType}</Badge> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid h-full gap-0 p-0">
          <div className="min-h-[26rem] space-y-3 overflow-y-auto p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <Loader2 className="size-4 animate-spin" />
                Loading messages
              </div>
            ) : null}
            {messages.map((message) => {
              const mine = String(message.senderId) === currentUserId;

              return (
                <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[min(34rem,85%)] rounded-lg border p-4 text-sm shadow-sm",
                      mine
                        ? "border-[hsl(var(--primary))]/35 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35"
                    )}
                  >
                    {message.subject ? <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] opacity-75">{message.subject}</p> : null}
                    <p className="whitespace-pre-wrap leading-6">{message.content}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.7rem] opacity-75">
                      {message.contextType && message.contextType !== "direct" ? <span>{message.contextType}</span> : null}
                      <span>{formatTime(message.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {!loading && messages.length === 0 ? (
              <div className="rounded-md border border-dashed border-[hsl(var(--border))] p-8 text-center">
                <MessageSquare className="mx-auto mb-3 size-8 text-[hsl(var(--primary))]" />
                <p className="font-semibold">No messages in this thread yet</p>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  Start a conversation, reply to an offer, or contact a shop from here.
                </p>
              </div>
            ) : null}
          </div>

          <form className="border-t border-[hsl(var(--border))] p-4 sm:p-5" onSubmit={sendMessage}>
            <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
              <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject or offer title" />
              <select
                value={contextType}
                onChange={(event) => setContextType(event.target.value)}
                className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
              >
                {["direct", "offer", "product", "shop", "job", "course", "support", "consulting"].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                disabled={!selectedId}
                placeholder="Write a message..."
                className="min-h-24 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              />
              <Button type="submit" disabled={!selectedId || !content.trim()} className="h-full min-h-24">
                <Send className="size-4" />
                Send
              </Button>
            </div>
            {status ? <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">{status}</p> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
