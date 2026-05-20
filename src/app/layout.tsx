import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://house-seacher.vcampos.dev";
const SITE_NAME = "House Searcher";
const DESCRIPTION = "Encontre os melhores imóveis e apartamentos para aluguel no Rio de Janeiro (Zona Sul, Norte, Oeste e Centro) por menos de R$ 1.000. Agregamos OLX, ZAP Imóveis e VivaReal num só lugar, atualizado a cada 6 horas.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4338ca" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1b4b" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Aluguel em conta no Rio de Janeiro`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "aluguel rio de janeiro",
    "imóveis rj",
    "apartamentos baratos rj",
    "aluguel zona oeste rj",
    "aluguel zona sul rj",
    "aluguel zona norte rj",
    "aluguel centro rj",
    "kitnet rj",
    "casas para alugar rio de janeiro",
    "quarto para alugar rj",
    "agregador de imóveis",
    "house searcher",
    "imóveis até 1000 reais rj",
    "aluguel barato copacabana",
    "aluguel barato tijuca",
    "aluguel campo grande rj",
    "aluguel bangu rj",
    "aluguel niterói",
    "olx imóveis rj",
    "zap imóveis rj",
    "vivareal rj",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "real estate",
  classification: "Real Estate Search Engine",
  referrer: "origin-when-cross-origin",
  generator: "Next.js",

  // Canonical
  alternates: {
    canonical: SITE_URL,
    languages: {
      "pt-BR": SITE_URL,
    },
  },

  // Open Graph (Facebook, WhatsApp, LinkedIn, Telegram)
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    title: `${SITE_NAME} — Aluguel em conta no Rio de Janeiro`,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "House Searcher — Agregador de imóveis do Rio de Janeiro",
        type: "image/png",
      },
    ],
  },

  // Twitter / X
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Imóveis em conta no RJ`,
    description: "Agregamos OLX, ZAP e VivaReal num só lugar. Aluguéis até R$ 1.000 no Rio de Janeiro inteiro.",
    images: ["/og-image.png"],
    creator: "@housesearcher",
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/mascot.png", sizes: "512x512", type: "image/png" },
    ],
  },

  // Manifest
  manifest: "/manifest.json",

  // Verification (add your IDs when you have them)
  // verification: {
  //   google: "your-google-site-verification-code",
  //   yandex: "your-yandex-verification",
  // },

  // App links
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },

  // Format detection
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // Other meta
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#4338ca",
    "msapplication-config": "none",
  },
};

// JSON-LD Structured Data
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    description: DESCRIPTION,
    applicationCategory: "RealEstateApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
    },
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/mascot.png`,
    },
    areaServed: {
      "@type": "City",
      name: "Rio de Janeiro",
      "@id": "https://www.wikidata.org/wiki/Q8678",
    },
    inLanguage: "pt-BR",
    image: `${SITE_URL}/og-image.png`,
    screenshot: `${SITE_URL}/og-image.png`,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: DESCRIPTION,
    inLanguage: "pt-BR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/mascot.png`,
    sameAs: [
      "https://github.com/rotciWictor/house-seacher",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: "https://github.com/rotciWictor/house-seacher/issues",
    },
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
