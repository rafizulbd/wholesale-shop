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

// এসইও এবং প্রজেক্টের টাইটেল আপডেট করা হয়েছে
export const metadata: Metadata = {
  title: "পাইকারি শপ | বাংলাদেশের বিশ্বস্ত হোলসেল মার্কেট",
  description: "সেরা দামে সরাসরি ইম্পোর্টার থেকে পাইকারি পণ্য কিনুন। দ্রুত ডেলিভারি এবং নিরাপদ পেমেন্ট সিস্টেম।",
  keywords: ["wholesale", "পাইকারি", "হোলসেল", "অনলাইন বাজার", "বাংলাদেশ"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}