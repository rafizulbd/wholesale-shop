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
      <head>
        {/* গুগল ট্রান্সলেটর কাস্টম প্রফেশনাল স্টাইল */}
        <style>{`
          #google_translate_element {
            position: fixed;
            bottom: 25px;
            right: 25px;
            z-index: 9999;
          }
          /* বাটনের ডিজাইন */
          .goog-te-gadget-simple {
            background-color: #2563eb !important; 
            border: none !important;
            padding: 10px 16px !important;
            border-radius: 50px !important;
            box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4) !important;
            cursor: pointer;
            display: flex !important;
            align-items: center !important;
            transition: all 0.3s ease;
          }
          .goog-te-gadget-simple:hover {
            transform: translateY(-3px);
            box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.5) !important;
          }
          /* টেক্সট স্টাইল */
          .goog-te-gadget-simple span {
            color: #ffffff !important;
            font-weight: 700 !important;
            font-family: inherit !important;
            font-size: 13px !important;
            text-transform: uppercase;
          }
          /* অপ্রয়োজনীয় আইকন হাইড করা */
          .goog-te-gadget-icon, .goog-te-menu-value img {
            display: none !important;
          }
          /* গুগল ব্যানার হাইড করা */
          .goog-te-banner-frame.skiptranslate {
            display: none !important;
          }
          body {
            top: 0px !important;
          }
        `}</style>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased text-black bg-white`}>
        
        {/* ল্যাঙ্গুয়েজ বাটন কন্টেইনার */}
        <div id="google_translate_element"></div>
        
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