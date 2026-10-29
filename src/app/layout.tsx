import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { architect } from "@/content/archive";
import { siteUrl } from "@/lib/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const title = "The Systems Architect — Nilesh Kumar Pandey";
const description =
  "An interactive 3D portfolio. Travel through the systems Nilesh Kumar Pandey built: workforce scheduling at Zinier, an in-house routing engine, ZPilot developer tooling, a production RAG platform, and earlier work at Udaan and Infosys.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "The Systems Architect",
  authors: [{ name: architect.name, url: architect.links.github }],
  creator: architect.name,
  keywords: ["Nilesh Kumar Pandey", "software engineer", "distributed systems", "scheduling", "routing", "RAG", "portfolio", "Zinier", "Bangalore"],
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description: "Enter the simulation. Travel through the systems he built.",
    type: "website",
    url: "/",
    siteName: "The Systems Architect",
  },
  twitter: { card: "summary_large_image", title, description: "Enter the simulation. Travel through the systems he built." },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#04050a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
