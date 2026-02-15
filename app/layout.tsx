import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { VersionCheck } from "@/components/VersionCheck";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillForge | AI Mock Interview Practice",
  description: "Practice tech interviews with AI that speaks & listens. Get instant feedback on technical skills, communication & depth. Free forever. Join 10K+ developers preparing for their dream jobs.",
  keywords: ["SkillForge", "AI mock interview", "interview practice", "tech interview", "voice interview", "coding interview prep", "fresher interview", "frontend interview", "backend interview", "fullstack interview", "job preparation", "interview simulator"],
  authors: [{ name: "SkillForge" }],
  creator: "SkillForge",
  publisher: "Sunadh EduTech",
  metadataBase: new URL("https://sunadhedutech.com"),
  alternates: {
    canonical: "https://sunadhedutech.com",
  },
  openGraph: {
    title: "SkillForge - Master Your Tech Interview",
    description: "Voice-powered AI interview practice with real-time feedback. Practice frontend, backend, fullstack & more. 100% Free!",
    url: "https://sunadhedutech.com",
    siteName: "SkillForge",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SkillForge - Practice Tech Interviews with AI",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillForge | AI Mock Interview",
    description: "Practice tech interviews with AI voice conversations. Get instant feedback & ace your next interview!",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "ADD_YOUR_GOOGLE_VERIFICATION_CODE",
  },
};

// Structured Data for SEO (JSON-LD)
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "SkillForge",
  "alternateName": "SkillForge AI Mock Interview",
  "url": "https://sunadhedutech.com",
  "description": "Practice tech interviews with AI that speaks & listens. Get instant feedback on technical skills, communication & depth.",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "10000"
  },
  "creator": {
    "@type": "Organization",
    "name": "Sunadh EduTech",
    "url": "https://sunadhedutech.com"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#facc15" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <VersionCheck />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
