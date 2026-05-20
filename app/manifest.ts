import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
import { getSiteUrl } from "@/lib/site-url";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MR Creativist",
    short_name: "MR Creativist",
    description: brand.tagline,
    id: getSiteUrl(),
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#14b8a6",
    categories: ["education", "business", "productivity", "shopping"],
    icons: [
      {
        src: "/icons/icon.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icons/logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
