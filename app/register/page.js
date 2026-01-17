"use client";
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, User, Phone, MapPin, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', phone: '', address: '' 
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();

    // শক্তিশালী মোবাইল নম্বর ভ্যালিডেশন: ১১ ডিজিট হতে হবে এবং ০ দিয়ে শুরু হতে হবে
    const phone = formData.phone;
    if (phone.length !== 11 || !phone.startsWith('0')) {
      alert("ভুল নম্বর! দয়া করে ১১ ডিজিটের সঠিক মোবাইল নম্বর দিন যা ০ দিয়ে শুরু (যেমন: 017xxxxxxxx)।");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          // এই তথ্যগুলো সুপাবেসের user_metadata তে সেভ হবে এবং ট্রিগারের মাধ্যমে প্রোফাইল টেবিলে যাবে
          data: { 
            full_name: formData.name,
            phone: formData.phone,
            address: formData.address,
            status: 'pending', // প্রাথমিক স্ট্যাটাস পেন্ডিং
            registration_date: new Date().toISOString() // রেজিস্ট্রেশন সময় সেভ করা
          }
        }
      });

      if (error) {
        alert("রেজিস্ট্রেশন ব্যর্থ: " + error.message);
      } else {
        alert("রেজিস্ট্রেশন সফল! আপনি ১ ঘণ্টার জন্য ড্যাশবোর্ড ব্যবহার করতে পারবেন। স্থায়ী এক্সেসের জন্য অ্যাডমিন ভেরিফিকেশন প্রয়োজন।");
        router.push('/user'); 
      }
    } catch (err) {
      alert("একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans text-black">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="flex justify-center mb-4">
           <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">
              <UserPlus size={32} />
           </div>
        </div>
        <h2 className="text-3xl font-black text-center text-blue-900 mb-2 uppercase tracking-tighter">একাউন্ট তৈরি করুন</h2>
        <p className="text-center text-gray-500 mb-8 text-sm font-medium tracking-tight">সঠিক তথ্য দিয়ে আমাদের পাইকারি প্যানেলে যুক্ত হন</p>
        
        <form onSubmit={handleRegister} className="space-y-4">
          {/* নাম */}
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="আপনার পূর্ণ নাম (উদা: মোঃ রাফিজুল ইসলাম)" 
              className="w-full border p-3 pl-10 rounded-xl outline-none focus:ring-2 ring-blue-500 bg-white shadow-sm"
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              required 
            />
          </div>

          {/* মোবাইল নম্বর - শুধুমাত্র সংখ্যা ইনপুট নেবে */}
          <div className="relative">
            <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              type="text" 
              inputMode="numeric"
              maxLength={11}
              placeholder="মোবাইল নম্বর (১১ ডিজিট)" 
              className="w-full border p-3 pl-10 rounded-xl outline-none focus:ring-2 ring-blue-500 bg-white shadow-sm"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, "")})} 
              required 
            />
          </div>

          {/* দোকানের ঠিকানা */}
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="দোকান বা ব্যবসার ঠিকানা" 
              className="w-full border p-3 pl-10 rounded-xl outline-none focus:ring-2 ring-blue-500 bg-white shadow-sm"
              onChange={(e) => setFormData({...formData, address: e.target.value})} 
              required 
            />
          </div>

          {/* ইমেল */}
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              type="email" 
              placeholder="ইমেল অ্যাড্রেস" 
              className="w-full border p-3 pl-10 rounded-xl outline-none focus:ring-2 ring-blue-500 bg-white shadow-sm"
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              required 
            />
          </div>

          {/* পাসওয়ার্ড */}
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              type="password" 
              placeholder="পাসওয়ার্ড (কমপক্ষে ৬ ডিজিট)" 
              className="w-full border p-3 pl-10 rounded-xl outline-none focus:ring-2 ring-blue-500 bg-white shadow-sm"
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 active:scale-95 transition-all flex justify-center items-center gap-2 shadow-lg mt-4 uppercase tracking-widest"
          >
            {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
            {loading ? "ভেরিফাই হচ্ছে..." : "রেজিস্ট্রেশন সম্পন্ন করুন"}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm font-bold">
            আগে থেকেই একাউন্ট আছে?{" "}
            <button onClick={() => router.push('/login')} className="text-blue-600 hover:underline">
              লগইন করুন
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}