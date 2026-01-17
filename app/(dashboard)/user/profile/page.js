"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { User, MapPin, Phone, Save, Loader2, ArrowLeft, ShieldCheck, Mail, Sparkles } from 'lucide-react';

export default function UserProfile() {
  const [profile, setProfile] = useState({ full_name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [router]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name,
      phone: profile.phone,
      address: profile.address
    }).eq('id', profile.id);

    if (!error) {
      alert("প্রোফাইল আপডেট সফল হয়েছে!");
    } else {
      alert("সমস্যা হয়েছে: " + error.message);
    }
    setUpdating(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-blue-500 font-black uppercase text-[10px] tracking-[0.3em]">Loading Profile</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-xl mx-auto">
        {/* ব্যাক বাটন */}
        <button 
          onClick={() => router.back()} 
          className="mb-8 flex items-center gap-2 text-gray-500 hover:text-white transition-all font-bold uppercase text-[10px] tracking-widest group"
        >
          <div className="p-2 bg-slate-900 rounded-xl group-hover:bg-slate-800 transition-all border border-slate-800">
            <ArrowLeft size={16} />
          </div>
          ফিরে যান
        </button>

        <div className="bg-slate-900 border border-slate-800 p-8 md:p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
          {/* গ্লো ইফেক্ট ডেকোরেশন */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]"></div>

          {/* প্রোফাইল হেডার */}
          <div className="text-center mb-12 relative z-10">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-900/40 border-4 border-slate-900">
                <User size={48} className="text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 p-2 rounded-2xl border-4 border-slate-900 shadow-lg">
                <Sparkles size={14} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-2">আপনার প্রোফাইল</h1>
            <div className="flex items-center justify-center gap-2">
              <span className="h-[1px] w-8 bg-slate-800"></span>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-blue-500" /> সিকিউরড মেম্বার
              </p>
              <span className="h-[1px] w-8 bg-slate-800"></span>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-7 relative z-10">
            {/* নাম ইনপুট */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase text-gray-500 ml-5 tracking-widest">সম্পূর্ণ নাম</label>
              <div className="relative group">
                <User className="absolute left-5 top-5 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  className="w-full bg-slate-950/50 border border-slate-800 p-5 pl-14 rounded-[1.5rem] outline-none focus:border-blue-500/50 focus:bg-slate-950 transition-all text-sm font-bold shadow-inner" 
                  value={profile.full_name} 
                  onChange={e => setProfile({...profile, full_name: e.target.value})} 
                  placeholder="আপনার নাম লিখুন"
                  required 
                />
              </div>
            </div>

            {/* ফোন ইনপুট */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase text-gray-500 ml-5 tracking-widest">ফোন নম্বর</label>
              <div className="relative group">
                <Phone className="absolute left-5 top-5 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  className="w-full bg-slate-950/50 border border-slate-800 p-5 pl-14 rounded-[1.5rem] outline-none focus:border-blue-500/50 focus:bg-slate-950 transition-all text-sm font-bold tracking-widest shadow-inner" 
                  value={profile.phone} 
                  onChange={e => setProfile({...profile, phone: e.target.value})} 
                  placeholder="আপনার ফোন নম্বর"
                  required 
                />
              </div>
            </div>

            {/* ঠিকানা ইনপুট */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase text-gray-500 ml-5 tracking-widest">ডেলিভারি ঠিকানা</label>
              <div className="relative group">
                <MapPin className="absolute left-5 top-5 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={20} />
                <textarea 
                  className="w-full bg-slate-950/50 border border-slate-800 p-5 pl-14 rounded-[1.5rem] outline-none focus:border-blue-500/50 focus:bg-slate-950 transition-all h-36 text-sm font-medium resize-none shadow-inner leading-relaxed" 
                  value={profile.address} 
                  onChange={e => setProfile({...profile, address: e.target.value})} 
                  placeholder="আপনার বিস্তারিত ঠিকানা এখানে লিখুন..."
                  required 
                />
              </div>
            </div>

            {/* সেভ বাটন */}
            <button 
              type="submit" 
              disabled={updating} 
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-900/40 transition-all flex items-center justify-center gap-3 border border-blue-400/20"
            >
              {updating ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Save size={20} />
                  তথ্য সেভ করুন
                </>
              )}
            </button>
          </form>
        </div>

        {/* ফুটার নোট */}
        <p className="text-center mt-10 text-gray-600 text-[9px] font-black uppercase tracking-widest">
          আপনার প্রোফাইল তথ্য আপনার অর্ডারের সময় স্বয়ংক্রিয়ভাবে ব্যবহৃত হবে
        </p>
      </div>
    </div>
  );
}