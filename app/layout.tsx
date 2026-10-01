import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const sans = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.seo.title, template: "%s | " + site.name },
  description: site.seo.description,
  keywords: site.seo.keywords,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: site.name,
    title: site.seo.title,
    description: site.seo.description,
    images: [{ url: site.seo.ogImage, alt: site.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.seo.title,
    description: site.seo.description,
    images: [site.seo.ogImage],
  },
  icons: { icon: "/images/logo.png", apple: "/images/logo.png" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#16120E",
  width: "device-width",
  initialScale: 1,
};

// Intro only on the first visit of the session (and never with reduced motion).
const introScript =
  "try{if(sessionStorage.getItem('adp-intro')||matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.intro='seen'}}catch(e){}";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={serif.variable + " " + sans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <noscript>
          <style>{".rv{opacity:1!important;transform:none!important;clip-path:none!important}.intro{display:none!important}"}</style>
        </noscript>
      </head>
      <body>
        <a className="skip" href="#contenu">Aller au contenu</a>
        {children}
      </body>
    </html>
  );
}
