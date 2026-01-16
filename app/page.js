"use client";
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, ShieldCheck, Truck, Zap, Star } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Navigation - সহজ এবং কার্যকর নেভিগেশন */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100">
            <ShoppingBag size={24} />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">পাইকারি শপ</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => router.push('/login')} 
            className="text-sm font-bold hover:text-blue-600 transition-colors"
          >
            লগইন
          </button>
          <button 
            onClick={() => router.push('/register')} 
            className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
          >
            শুরু করুন
          </button>
        </div>
      </nav>

      {/* Hero Section - মূল আকর্ষণ */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-32 text-center animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-[10px] font-black uppercase mb-8 tracking-widest border border-blue-100">
          <Star size={14} className="fill-blue-700" /> বাংলাদেশের ১ নম্বর পাইকারি মার্কেটপ্লেস
        </div>
        <h1 className="text-5xl md:text-8xl font-black text-gray-900 leading-[1.05] mb-8 tracking-tighter">
          সরাসরি ইম্পোর্টার থেকে <br /> <span className="text-blue-600">পাইকারি কিনুন</span>
        </h1>
        <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
          আপনার দোকানের জন্য সেরা মানের পণ্য সুলভ মূল্যে সংগ্রহ করুন। দ্রুত ডেলিভারি এবং প্রি-অর্ডারের সুবিধা এখন আপনার হাতের মুঠোয়।
        </p>
        
        <div className="flex flex-col md:flex-row justify-center gap-5">
          <button 
            onClick={() => router.push('/register')} 
            className="flex items-center justify-center gap-3 bg-blue-600 text-white px-12 py-5 rounded-2xl text-lg font-black hover:bg-blue-700 hover:scale-105 transition-all shadow-2xl shadow-blue-200 group"
          >
            অর্ডার শুরু করুন <ArrowRight className="group-hover:translate-x-2 transition-transform" />
          </button>
          <button 
            onClick={() => router.push('/login')} 
            className="flex items-center justify-center gap-3 bg-white text-gray-900 border-2 border-gray-100 px-12 py-5 rounded-2xl text-lg font-black hover:bg-gray-50 hover:border-gray-200 transition-all"
          >
            পুরনো অর্ডার দেখুন
          </button>
        </div>
      </section>

      {/* Features - ব্যবসার বৈশিষ্ট্যসমূহ */}
      <section className="bg-gray-50 py-24 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-600 mb-8">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-2xl font-black mb-4 tracking-tight text-gray-800 uppercase">নিরাপদ পেমেন্ট</h3>
            <p className="text-gray-500 font-bold text-sm leading-relaxed">বিকাশ বা নগদে অগ্রিম পেমেন্ট করে নিশ্চিন্তে অর্ডার করুন। আমরা দিচ্ছি ১০০% পেমেন্ট গ্যারান্টি।</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="bg-green-50 w-16 h-16 rounded-2xl flex items-center justify-center text-green-600 mb-8">
              <Truck size={32} />
            </div>
            <h3 className="text-2xl font-black mb-4 tracking-tight text-gray-800 uppercase">দ্রুত ডেলিভারি</h3>
            <p className="text-gray-500 font-bold text-sm leading-relaxed">চকবাজার থেকে সরাসরি সারা বাংলাদেশে কুরিয়ারের মাধ্যমে আমরা দ্রুত পণ্য পৌঁছে দিই।</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center text-purple-600 mb-8">
              <Zap size={32} />
            </div>
            <h3 className="text-2xl font-black mb-4 tracking-tight text-gray-800 uppercase">প্রি-অর্ডার সুবিধা</h3>
            <p className="text-gray-500 font-bold text-sm leading-relaxed">পণ্য স্টকে না থাকলেও বুকিং দিয়ে রাখতে পারেন। স্টক এলে অগ্রাধিকার ভিত্তিতে আপনি পাবেন।</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center bg-white">
        <div className="flex justify-center items-center gap-2 mb-4 opacity-50">
           <ShoppingBag size={20} />
           <span className="font-black uppercase tracking-tighter">পাইকারি শপ</span>
        </div>
        <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">
          &copy; ২০২৬ পাইকারি বিজনেস প্লাটফর্ম | সর্বস্বত্ব সংরক্ষিত
        </p>
      </footer>
    </div>
  );
}