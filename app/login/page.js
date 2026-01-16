"use client";
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { LogIn, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("ইমেল অথবা পাসওয়ার্ড ভুল! আবার চেষ্টা করুন।");
    } else {
      // লগইন সফল হলে সরাসরি অ্যাডমিন ড্যাশবোর্ডে পাঠাবে
      router.push('/admin');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-900 font-sans p-4">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-blue-100 p-4 rounded-full mb-4">
             <Lock className="text-blue-900" size={32} />
          </div>
          <h2 className="text-3xl font-black text-blue-900 uppercase">অ্যাডমিন লগইন</h2>
          <p className="text-gray-500 mt-2 text-sm">আপনার তথ্য দিয়ে প্রবেশ করুন</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-2">ইমেল অ্যাড্রেস</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
              <input 
                type="email" 
                placeholder="email@example.com" 
                className="w-full border-2 border-gray-100 p-3 pl-10 rounded-xl outline-none focus:border-blue-500 text-black transition-all"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-2">পাসওয়ার্ড</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full border-2 border-gray-100 p-3 pl-10 rounded-xl outline-none focus:border-blue-500 text-black transition-all"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <LogIn size={20} />}
            {loading ? "ভেরিফাই হচ্ছে..." : "লগইন করুন"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-widest">Wholesale Business Panel v1.0</p>
        </div>
      </div>
    </div>
  );
}