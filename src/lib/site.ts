/** Canonical site origin: explicit env var, then Vercel, then GitHub Pages, then local dev. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.NODE_ENV === "production"
      ? "https://nileshkk9.github.io"
      : "http://localhost:3000");
