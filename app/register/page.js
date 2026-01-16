"use client";
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, User, Phone, MapPin, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    phone: '', 
    address: '' 
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        // এই তথ্যগুলো সুপাবেসের user_metadata তে সেভ হবে
        data: { 
          full_name: formData.name,
          phone: formData.phone,
          address: formData.address
        }
      }
    });

    if (error) {
      alert("রেজিস্ট্রেশন ব্যর্থ: " + error.message);
    } else {
      alert("রেজিস্ট্রেশন সফল! এখন লগইন করুন।");
      router.push('/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-3xl font-black text-center text-blue-900 mb-6 uppercase tracking-tighter">একাউন্ট তৈরি করুন</h2>
        <p className="text-center text-gray-500 mb-8 text-sm font-medium">পাইকারি ক্যাটালগ অ্যাক্সেস করতে তথ্য দিন</p>
        
        <form onSubmit={handleRegister} className="space-y-4">
          {/* নাম */}
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="আপনার পূর্ণ নাম" 
              className="w-full border p-3 pl-10 rounded-xl outline-none focus:ring-2 ring-blue-500 text-black shadow-sm"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          {/* মোবাইল নম্বর */}
          <div className="relative">
            <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="মোবাইল নম্বর" 
              className="w-full border p-3 pl-10 rounded-xl outline-none focus:ring-2 ring-blue-500 text-black shadow-sm"
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>

          {/* দোকানের ঠিকানা */}
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="দোকান বা ব্যবসার ঠিকানা" 
              className="w-full border p-3 pl-10 rounded-xl outline-none focus:ring-2 ring-blue-500 text-black shadow-sm"
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
              className="w-full border p-3 pl-10 rounded-xl outline-none focus:ring-2 ring-blue-500 text-black shadow-sm"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          {/* পাসওয়ার্ড */}
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              type="password" 
              placeholder="পাসওয়ার্ড" 
              className="w-full border p-3 pl-10 rounded-xl outline-none focus:ring-2 ring-blue-500 text-black shadow-sm"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 active:scale-95 transition-all flex justify-center items-center gap-2 shadow-lg mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
            {loading ? "ভেরিফাই হচ্ছে..." : "রেজিস্ট্রেশন সম্পন্ন করুন"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            আগে থেকেই একাউন্ট আছে?{" "}
            <button onClick={() => router.push('/login')} className="text-blue-600 font-bold hover:underline">
              লগইন করুন
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}