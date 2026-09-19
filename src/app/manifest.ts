import type { MetadataRoute } from "next";

// Web app manifest (served at /manifest.webmanifest and linked automatically).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Map of the Unknown",
    short_name: "Map of the Unknown",
    description:
      "Mapping the unknown. Expanding the frontier of discovery.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
  };
}
