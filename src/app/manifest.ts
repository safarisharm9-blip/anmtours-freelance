import type { MetadataRoute } from "next";
import { SEO_CONFIG } from "@/config/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SEO_CONFIG.siteName} | Egypt Tours`,
    short_name: SEO_CONFIG.siteName,
    description: SEO_CONFIG.defaultDescription,
    start_url: "/en",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/logo.jpeg",
        sizes: "any",
        type: "image/jpeg",
      },
    ],
  };
}
