import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { seoKeywords, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "MR Creativist",
  title: {
    default: "MR Creativist | Best AI E-Learning, Marketplace, Jobs & Business Platform",
    template: "%s | MR Creativist"
  },
  description:
    "MR Creativist is an AI-powered e-learning, marketplace, jobs, business directory, freelance, consulting, multimedia, and digital selling platform for Rwanda, Africa, Canada, and global creators.",
  keywords: seoKeywords,
  authors: [{ name: "MR Creativist", url: siteUrl }],
  creator: "MR Creativist",
  publisher: "MR Creativist",
  category: "education, marketplace, business, AI, jobs, multimedia",
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      rw: "/",
      fr: "/"
    }
  },
  icons: {
    icon: [
      { url: "/icons/icon.png", type: "image/png" },
      { url: "/icons/logo.png", type: "image/png" }
    ],
    shortcut: "/icons/icon.png",
    apple: "/icons/icon.png"
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    title: "MR Creativist | AI-Powered Learning, Marketplace, Jobs & Business Growth",
    description: "Learn, sell, hire, consult, publish businesses, find freelancers, and create with AI tools from Rwanda, Africa, Canada, and beyond.",
    url: siteUrl,
    siteName: "MR Creativist",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/icons/icon.png",
        width: 512,
        height: 512,
        alt: "MR Creativist logo"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "MR Creativist | AI E-Learning, Marketplace, Jobs & Business Platform",
    description: "Courses, marketplace, jobs, businesses, freelancers, consulting, multimedia, and AI tools for Rwanda, Africa, Canada, and global creators.",
    images: ["/icons/icon.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = [organizationJsonLd(), websiteJsonLd()];

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <Providers>{children}</Providers>
          <Toaster />
        </ThemeProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
