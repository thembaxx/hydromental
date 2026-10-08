import type { Metadata, Viewport } from "next";
import { PwaManager } from "@/components/pwa-manager";
import { BrowserChrome } from "@/components/browser-chrome";
import { jsonLd, siteOrigin } from "@/lib/site";
import { themeBootstrapScript, themeCriticalCss, themeSurfaces } from "@/lib/theme";
import "./globals.css";

const origin = siteOrigin();
export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: { default: "Elementals — A playful science playground", template: "%s | Elementals" },
  description:
    "Touch, explore, and discover all 118 chemical elements. A playful periodic table with interactive atoms, scientific stories, and learning challenges.",
  applicationName: "Elementals",
  alternates: { canonical: "/" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Elementals" },
  icons: { icon: "/icon.svg", apple: "/icons/apple-touch-icon.png" },
  openGraph: {
    type: "website",
    siteName: "Elementals",
    url: "/",
    title: "Elementals — A playful science playground",
    description:
      "Meet the elements. Explore interactive atoms, everyday science, and playful learning challenges.",
    images: [
      {
        url: "/social-card.png",
        width: 1200,
        height: 630,
        alt: "Elementals — touch, explore, discover",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elementals — A playful science playground",
    images: ["/social-card.png"],
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: themeSurfaces.day.color },
    { media: "(prefers-color-scheme: dark)", color: themeSurfaces.midnight.color },
  ],
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <noscript
          dangerouslySetInnerHTML={{ __html: '<link rel="manifest" href="/manifest.webmanifest">' }}
        />
        <style id="theme-critical" dangerouslySetInnerHTML={{ __html: themeCriticalCss }} />
        <link
          rel="preload"
          href="/fonts/nunito-variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: themeBootstrapScript,
          }}
        />
      </head>
      <body>
        {children}
        <PwaManager />
        <BrowserChrome />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Elementals",
              url: origin,
              description:
                "An interactive periodic table for exploring chemical elements and learning about atoms.",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Any",
              isAccessibleForFree: true,
              browserRequirements:
                "JavaScript and WebGL for the interactive atom; readable element pages work without JavaScript.",
            }),
          }}
        />
      </body>
    </html>
  );
}
