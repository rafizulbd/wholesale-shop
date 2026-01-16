"use client";
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, ShieldCheck, Truck, Zap, Star } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <ShoppingBag size={24} />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">পাইকারি শপ</span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => router.push('/login')} className="text-sm font-bold hover:text-blue-600 transition-colors">লগইন</button>
          <button onClick={() => router.push('/register')} className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">শুরু করুন</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-black uppercase mb-6 tracking-widest">
          <Star size={14} /> বাংলাদেশের ১ নম্বর পাইকারি মার্কেটপ্লেস
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.1] mb-8 tracking-tighter">
          সরাসরি ইম্পোর্টার থেকে <br /> <span className="text-blue-600">পাইকারি কিনুন</span>
        </h1>
        <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium">
          আপনার দোকানের জন্য সেরা মানের পণ্য সুলভ মূল্যে সংগ্রহ করুন। দ্রুত ডেলিভারি এবং প্রি-অর্ডারের সুবিধা এখন আপনার হাতের মুঠোয়।
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <button 
            onClick={() => router.push('/register')} 
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-10 py-5 rounded-2xl text-lg font-black hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 group"
          >
            অর্ডার শুরু করুন <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => router.push('/login')} 
            className="flex items-center justify-center gap-2 bg-white text-gray-900 border-2 border-gray-100 px-10 py-5 rounded-2xl text-lg font-black hover:bg-gray-50 transition-all"
          >
            পুরনো অর্ডার দেখুন
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="bg-blue-100 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 tracking-tight">নিরাপদ পেমেন্ট</h3>
            <p className="text-gray-500 font-medium leading-relaxed">বিকাশ বা নগদে অগ্রিম পেমেন্ট করে নিশ্চিন্তে অর্ডার করুন। আমরা দিচ্ছি ১০০% পেমেন্ট গ্যারান্টি।</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="bg-green-100 w-12 h-12 rounded-2xl flex items-center justify-center text-green-600 mb-6">
              <Truck size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 tracking-tight">দ্রুত ডেলিভারি</h3>
            <p className="text-gray-500 font-medium leading-relaxed">চকবাজার থেকে সরাসরি সারা বাংলাদেশে কুরিয়ারের মাধ্যমে আমরা পণ্য পৌঁছে দিই।</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="bg-purple-100 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
              <Zap size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 tracking-tight">প্রি-অর্ডার সুবিধা</h3>
            <p className="text-gray-500 font-medium leading-relaxed">পণ্য স্টকে না থাকলেও প্রি-অর্ডার দিয়ে বুকিং দিয়ে রাখতে পারেন। স্টক এলে সবার আগে আপনি পাবেন।</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center border-t border-gray-100">
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
          &copy; ২০২৬ পাইকারি বিজনেস প্লাটফর্ম | সর্বস্বত্ব সংরক্ষিত
        </p>
      </footer>
    </div>
  );
}