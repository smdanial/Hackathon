import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Poppins } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampusEase — Student life, made easy",
  description:
    "Find free rooms, track campus buses, recover lost items and more. Your student-life toolkit.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-surface font-sans text-ink antialiased">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
