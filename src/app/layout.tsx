import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Providers } from './providers';

export const metadata: Metadata = {
  title: "Alkos Barber",
  description: "Die beste Adresse für Haare und Bart.",
};

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={inter.className} >
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
