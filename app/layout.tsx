import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "MR Creativist | AI-Powered E-Learning & Marketplace",
    template: "%s | MR Creativist"
  },
  description:
    "AI-powered e-learning, marketplace, multimedia production, consulting, and digital selling platform based in Global.",
  keywords: ["e-learning", "marketplace", "AI tools", "multimedia", "Rwanda", "digital products", "online courses"],
  openGraph: {
    title: "MR Creativist",
    description: "Learn, sell, consult, and grow with AI-powered digital tools from Experts to the world.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Providers>{children}</Providers>
          <Toaster />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
