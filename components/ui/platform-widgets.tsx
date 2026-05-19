import { BarChart3, CalendarDays, Check, Code2, FileUp, Link as LinkIcon, Play, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RatingStars } from "@/components/ui/rating-stars";

export function VideoPlayer({ title = "Lesson preview" }: { title?: string }) {
  return (
    <div className="grid aspect-video place-items-center rounded-lg bg-black text-white">
      <div className="text-center">
        <Play className="mx-auto mb-3 size-8" />
        <p className="font-medium">{title}</p>
      </div>
    </div>
  );
}

export function Calendar() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarDays className="size-4" /> Booking calendar</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-7 gap-2 text-center text-sm">
        {Array.from({ length: 28 }).map((_, index) => (
          <span key={index} className="rounded-md border border-[hsl(var(--border))] p-2">{index + 1}</span>
        ))}
      </CardContent>
    </Card>
  );
}

export function DataTable({ rows }: { rows: string[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))]">
      {rows.map((row) => (
        <div key={row} className="border-b border-[hsl(var(--border))] px-4 py-3 last:border-0">{row}</div>
      ))}
    </div>
  );
}

export function ChartCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 className="size-4" /> Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Progress value={72} />
          <Progress value={48} />
          <Progress value={91} />
        </div>
      </CardContent>
    </Card>
  );
}

export function FileUploader() {
  return (
    <div className="grid gap-3 rounded-lg border border-dashed border-[hsl(var(--border))] p-6 text-sm">
      <div className="flex items-start gap-3">
        <FileUp className="mt-1 size-5 text-[hsl(var(--primary))]" />
        <div>
          <p className="font-medium">Upload from device</p>
          <p className="text-[hsl(var(--muted-foreground))]">Images, videos, PDFs, documents, audio, archives, and assignment files.</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <LinkIcon className="mt-1 size-5 text-[hsl(var(--primary))]" />
        <div>
          <p className="font-medium">Paste a hosted link</p>
          <p className="text-[hsl(var(--muted-foreground))]">YouTube, Vimeo, Google Drive, Cloudinary, portfolio, storage, or document URLs.</p>
        </div>
      </div>
    </div>
  );
}

export function QuizPlayer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz player</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-medium">Which tool powers type-safe validation?</p>
        {["Zod", "FTP", "Blade"].map((answer) => (
          <Button key={answer} variant="outline" className="w-full justify-start">{answer}</Button>
        ))}
      </CardContent>
    </Card>
  );
}

export function CertificateViewer() {
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] p-8 text-center">
      <Star className="mx-auto mb-3 size-8 text-[hsl(var(--secondary))]" />
      <p className="text-2xl font-semibold">Certificate of Completion</p>
    </div>
  );
}

export function ChatInterface() {
  return (
    <Card>
      <CardHeader><CardTitle>Chat</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="rounded-md bg-[hsl(var(--muted))] p-3">Hello, I need help choosing a course.</p>
        <p className="ml-auto rounded-md bg-[hsl(var(--primary))] p-3 text-[hsl(var(--primary-foreground))]">Let me recommend a path.</p>
      </CardContent>
    </Card>
  );
}

export function ReviewList() {
  return (
    <div className="space-y-3">
      <RatingStars value={4.8} />
      <p className="text-sm text-[hsl(var(--muted-foreground))]">Verified reviews with moderation and seller/instructor replies.</p>
    </div>
  );
}

export function CountdownTimer() {
  return <span className="font-mono text-sm">02:14:33</span>;
}

export function CodeEditor() {
  return (
    <pre className="overflow-auto rounded-lg bg-black p-4 text-sm text-white">
      <code>{`export function solve() {\n  return "modern platform";\n}`}</code>
    </pre>
  );
}

export function RichTextEditor() {
  return <div className="min-h-36 rounded-lg border border-[hsl(var(--border))] p-4 text-sm text-[hsl(var(--muted-foreground))]">TipTap-ready rich text editor surface.</div>;
}

export function InfiniteScroll() {
  return <div className="rounded-lg border border-[hsl(var(--border))] p-4 text-sm">Cursor pagination and infinite loading boundary.</div>;
}

export function ImageGallery() {
  return <div className="grid grid-cols-3 gap-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square rounded-md bg-[hsl(var(--muted))]" />)}</div>;
}

export function Alert({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 text-sm">{children}</div>;
}

export function Breadcrumb({ items }: { items: string[] }) {
  return <div className="text-sm text-[hsl(var(--muted-foreground))]">{items.join(" / ")}</div>;
}

export function Pagination() {
  return <div className="flex items-center gap-2"><Button variant="outline">Previous</Button><Button variant="outline">Next</Button></div>;
}

export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return <span title={label}>{children}</span>;
}

export function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  return <details className="rounded-lg border border-[hsl(var(--border))] p-4"><summary className="cursor-pointer font-medium">{title}</summary><div className="mt-3">{children}</div></details>;
}

export function Tabs({ tabs }: { tabs: string[] }) {
  return <div className="flex gap-2">{tabs.map((tab) => <Button key={tab} variant="outline">{tab}</Button>)}</div>;
}

export function Modal({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">{children}</div>;
}

export function DropdownMenu({ items }: { items: string[] }) {
  return <select className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">{items.map((item) => <option key={item}>{item}</option>)}</select>;
}

export function ChecklistItem({ children }: { children: React.ReactNode }) {
  return <p className="flex items-center gap-2 text-sm"><Check className="size-4 text-[hsl(var(--primary))]" />{children}</p>;
}

export function CodingCourseWidget() {
  return <p className="flex items-center gap-2 text-sm"><Code2 className="size-4" /> Coding-course tooling is ready.</p>;
}
