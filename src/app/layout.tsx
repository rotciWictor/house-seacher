import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL('https://house-seacher.vcampos.dev'),
  title: {
    default: "House Searcher | Agregador de Imóveis no Rio de Janeiro",
    template: "%s | House Searcher"
  },
  description: "Encontre os melhores imóveis e apartamentos para aluguel no Rio de Janeiro (Zona Sul, Norte, Oeste e Centro) por menos de R$ 1000. Agregador de anúncios imobiliários atualizado automaticamente.",
  keywords: ["aluguel rio de janeiro", "imóveis rj", "apartamentos baratos rj", "aluguel zona oeste", "aluguel zona sul rj", "kitnet rj", "casas para alugar", "agregador de imóveis"],
  authors: [{ name: "House Searcher" }],
  creator: "House Searcher",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://house-seacher.vcampos.dev",
    title: "House Searcher | O melhor agregador de imóveis do RJ",
    description: "Encontre os melhores imóveis para aluguel no Rio de Janeiro por menos de R$ 1000. Atualizado automaticamente a cada 6 horas com dezenas de opções.",
    siteName: "House Searcher",
  },
  twitter: {
    card: "summary_large_image",
    title: "House Searcher | Imóveis baratos no RJ",
    description: "Encontre apartamentos e kitnets para aluguel no Rio de Janeiro por menos de R$ 1000.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
