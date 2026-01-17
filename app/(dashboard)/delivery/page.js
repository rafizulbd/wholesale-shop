"use client";
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Truck, MapPin, Phone, CheckCircle, Clock, 
  ExternalLink, LogOut, Package, Navigation, 
  AlertCircle, Loader2, BellRing 
} from 'lucide-react';

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riderName, setRiderName] = useState('');
  const [newOrderAlert, setNewOrderAlert] = useState(false); // নোটিফিকেশন স্টেট
  const router = useRouter();

  // ১. রাইডার ডাটা ফেচিং লজিক
  const fetchAssignedOrders = useCallback(async (riderId) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('delivery_person_id', riderId)
      .order('id', { ascending: false });

    if (error) {
      console.error("Orders fetch error:", error.message);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }, []);

  // অ্যালার্ট সাউন্ড ফাংশন
  const playAlertSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log("সাউন্ড প্লে করতে ব্রাউজারের পারমিশন লাগবে।"));
  };

  useEffect(() => {
    let channel;

    const checkUserAndSubscribe = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');
      
      const userId = session.user.id;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();
      
      if (profile) setRiderName(profile.full_name);
      fetchAssignedOrders(userId);

      // ২. রিয়েল-টাইম নোটিফিকেশন সাবস্ক্রিপশন
      channel = supabase
        .channel('delivery_updates')
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          filter: `delivery_person_id=eq.${userId}` 
        }, (payload) => {
          if (payload.new.status === 'shipped') {
            setNewOrderAlert(true);
            playAlertSound();
            fetchAssignedOrders(userId);
          }
        })
        .subscribe();
    };

    checkUserAndSubscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [router, fetchAssignedOrders]);

  // ২. ডেলিভারি সম্পন্ন করার লজিক (আপডেটেড: অটোমেটিক স্টক ডিডাকশনসহ)
  const handleComplete = async (order) => {
    if (!confirm("আপনি কি নিশ্চিত যে ডেলিভারিটি সম্পন্ন হয়েছে? এটি ইনভেন্টরি থেকে স্টক কমিয়ে দিবে।")) return;
    
    // ১. অর্ডারের স্ট্যাটাস আপডেট করা
    const { error: orderError } = await supabase
      .from('orders')
      .update({ 
        status: 'delivered', 
        delivery_date: new Date().toISOString() 
      })
      .eq('id', order.id);

    if (!orderError) {
      // ২. ইনভেন্টরি থেকে স্টক কমানো 
      const { data: productData } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', order.product_id)
        .single();

      if (productData) {
        const newStock = productData.quantity - (order.quantity || 1);
        await supabase
          .from('products')
          .update({ quantity: newStock })
          .eq('id', order.product_id);
      }

      alert("ডেলিভারি সফল এবং স্টক আপডেট করা হয়েছে!");
      const { data: { session } } = await supabase.auth.getSession();
      if (session) fetchAssignedOrders(session.user.id);
    } else {
        alert("ভুল হয়েছে: " + orderError.message);
    }
  };

  // ৩. গুগল ম্যাপ ডিরেকশন লজিক
  const openRoute = (address) => {
    if (!address) return alert("ঠিকানা পাওয়া যায়নি!");
    const encodedAddress = encodeURIComponent(address);
    const googleMapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
    window.open(googleMapUrl, '_blank');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      
      {newOrderAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in slide-in-from-top duration-500">
          <div className="bg-blue-600 p-5 rounded-[2rem] shadow-2xl border border-blue-400 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full animate-bounce">
                <BellRing size={20} className="text-white" />
              </div>
              <p className="font-black uppercase text-[10px] tracking-widest text-white leading-tight">নতুন অর্ডার এসাইন করা হয়েছে!</p>
            </div>
            <button onClick={() => setNewOrderAlert(false)} className="bg-slate-900/50 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-slate-900 transition-colors">বন্ধ করুন</button>
          </div>
        </div>
      )}

      <header className="max-w-4xl mx-auto mb-10 bg-slate-900 p-6 rounded-[2rem] shadow-2xl border border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-900/20">
            <Truck size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter text-blue-400 leading-none">Rider Portal</h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase mt-2 tracking-widest">স্বাগতম, {riderName || 'Rider'}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-3 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-lg">
          <LogOut size={20}/>
        </button>
      </header>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between px-2 mb-4">
          <h2 className="text-lg font-black uppercase flex items-center gap-2 text-green-400">
            <Package size={20} /> নির্ধারিত টাস্ক ({orders.length})
          </h2>
          <span className="text-[10px] font-bold bg-slate-800 px-3 py-1 rounded-full text-gray-400 uppercase">Live Update</span>
        </div>

        {orders.length > 0 ? orders.map((order) => (
          <div key={order.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-xl hover:border-blue-500/30 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h3 className="font-black text-blue-400 uppercase text-lg leading-tight group-hover:text-blue-300 transition-colors">
                  {order.product_name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] font-black bg-slate-800 text-gray-500 px-2 py-1 rounded-md uppercase">ID: #{order.id.slice(0, 8)}</span>
                  <span className="text-[9px] font-black bg-blue-600/10 text-blue-500 px-2 py-1 rounded-md uppercase">Qty: {order.quantity || 1}</span>
                </div>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-inner ${
                order.status === 'delivered' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500 animate-pulse'
              }`}>
                {order.status === 'delivered' ? 'পৌঁছেছে' : 'চলমান'}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-8">
              <div className="flex items-center justify-between bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-red-500 shrink-0 mt-1" />
                  <span className="text-sm font-medium text-gray-300 leading-snug">{order.address || 'ঠিকানা পাওয়া যায়নি'}</span>
                </div>
                <button onClick={() => openRoute(order.address)} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2">
                  <Navigation size={18} />
                  <span className="text-[10px] font-black uppercase hidden sm:inline">রুট ম্যাপ</span>
                </button>
              </div>

              <div className="flex items-center justify-between bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-green-500 shrink-0" />
                  <span className="text-sm font-bold tracking-widest text-gray-300">{order.phone || 'ফোন নম্বর নেই'}</span>
                </div>
                <a href={`tel:${order.phone}`} className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg">
                  <Phone size={18} />
                </a>
              </div>
            </div>

            {order.status !== 'delivered' ? (
              <button 
                onClick={() => handleComplete(order)} 
                className="w-full py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-black text-sm uppercase shadow-xl shadow-green-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <CheckCircle size={20} /> ডেলিভারি সম্পন্ন করুন
              </button>
            ) : (
              <div className="w-full py-5 bg-slate-800 text-gray-500 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-3 border border-slate-700">
                <CheckCircle size={20} className="text-green-500" /> ডেলিভারি সম্পন্ন হয়েছে
              </div>
            )}
          </div>
        )) : (
          <div className="text-center py-24 bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-800">
            <div className="bg-slate-800 w-20 h-20 rounded-full flex justify-center items-center mx-auto mb-6 shadow-inner">
              <AlertCircle className="text-gray-600" size={40} />
            </div>
            <p className="text-gray-500 font-black uppercase tracking-widest text-sm">আপাতত কোনো অর্ডার এসাইন করা নেই</p>
          </div>
        )}
      </div>
    </div>
  );
}