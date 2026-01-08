import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Playfair_Display, Roboto, Syne } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Providers } from './providers';
import Footer from "@/components/Footer";
import { ThemeProvider } from "./theme-provider";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import InstagramBanner from "@/components/InstagramBanner";
import StickyBookingButton from "@/components/StickyBookingButton";
import FloatingScannerButton from "@/components/FloatingScannerButton";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ['400', '700'],
});

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ['400', '500', '700'],
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ['400', '700', '800'],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: "ALKOS | High-End Barber Vienna",
  description: "Die beste Adresse für Haare und Bart am Wiedner Gürtel.",
  openGraph: {
    title: "ALKOS | High-End Barber Vienna",
    description: "Buche deinen Termin beim besten Barber der Stadt.",
    url: "https://alkosbarber.at",
    siteName: "ALKOS",
    images: [
      {
        url: "/images/hero-bg.jpeg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "de_AT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${syne.variable} ${manrope.variable}`}>
      <body className="font-sans antialiased selection:bg-gold-500 selection:text-black">
        <Providers>
          <ThemeProvider>
            <div className="flex flex-col min-h-screen relative">
              <InstagramBanner />
              <Navbar />
              <main className="flex-grow">
                {children}
                <SpeedInsights />
                <Analytics/>
              </main>
              <Footer />
              <FloatingScannerButton />
              <StickyBookingButton />
            </div>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
