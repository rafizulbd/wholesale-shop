import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased text-black bg-white`}>
        
        {/* ল্যাঙ্গুয়েজ ট্রান্সলেটর উইজেট কন্টেইনার */}
        <div 
          id="google_translate_element" 
          className="fixed bottom-5 right-5 z-[9999] shadow-2xl rounded-lg overflow-hidden border border-gray-100"
        ></div>
        
        {children}

        {/* গুগল ট্রান্সলেট স্ক্রিপ্টসমূহ */}
        <Script id="google-translate-config" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'bn',
                includedLanguages: 'en,bn',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
              }, 'google_translate_element');
            }
          `}
        </Script>
        <Script 
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" 
          strategy="afterInteractive" 
        />
      </body>
    </html>
  );
}