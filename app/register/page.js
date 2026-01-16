"use client";
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, User, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: { full_name: formData.name }
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
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-black text-center text-blue-900 mb-8 uppercase tracking-tighter">একাউন্ট তৈরি করুন</h2>
        <form onSubmit={handleRegister} className="space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="আপনার পূর্ণ নাম" 
              className="w-full border p-3 pl-10 rounded-xl outline-none focus:ring-2 ring-blue-500 text-black"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input 
              type="email" 
              placeholder="ইমেল অ্যাড্রেস" 
              className="w-full border p-3 pl-10 rounded-xl outline-none focus:ring-2 ring-blue-500 text-black"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input 
              type="password" 
              placeholder="পাসওয়ার্ড" 
              className="w-full border p-3 pl-10 rounded-xl outline-none focus:ring-2 ring-blue-500 text-black"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex justify-center items-center gap-2 shadow-lg"
          >
            {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
            {loading ? "অপেক্ষা করুন..." : "রেজিস্ট্রেশন সম্পন্ন করুন"}
          </button>
        </form>
      </div>
    </div>
  );
}