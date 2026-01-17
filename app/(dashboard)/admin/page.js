"use client";
import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../../../lib/supabase'; 
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import { 
  PlusCircle, Package, Loader2, DollarSign, TrendingUp, 
  ShoppingBag, CheckCircle, Clock, Printer, FileDown, 
  FileText, LogOut, Search, LayoutDashboard, Phone, MapPin, 
  Users, UserCheck, UserX, Truck, Trash2, Edit, BarChart3, 
  Wallet, BookOpen, AlertCircle, Moon, Sun, Image as ImageIcon, 
  Video, UserPlus, ShieldAlert, XCircle, RefreshCcw, Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function AdminDashboard() {
  // ১. সম্পূর্ণ স্টেট ম্যানেজমেন্ট
  const [product, setProduct] = useState({ name: '', price: '', buy_price: '', qty: '', min_qty: '1', media_url: '', media_type: 'image' });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalSales: 0, totalProfit: 0, orderCount: 0 });
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [pendingUsers, setPendingUsers] = useState([]); 
  const [deliveryRiders, setDeliveryRiders] = useState([]); 
  const [riderStats, setRiderStats] = useState([]); 
  const [stockLogs, setStockLogs] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('inventory'); 
  const [isDarkMode, setIsDarkMode] = useState(true);
  const router = useRouter();

  // ২. ডাটা ফেচিং ফাংশনসমূহ (রিয়েল-টাইম)
  const fetchAllUsers = useCallback(async () => {
    // সরাসরি profiles টেবিল থেকে সব ডাটা নেওয়া হচ্ছে
    const { data, error } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
    if (error) {
      console.error("User fetch error:", error.message);
    } else if (data) {
      setAllUsers(data);
      setPendingUsers(data.filter(u => u.status === 'pending'));
    }
  }, []);

  const fetchStatsAndOrders = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*').order('id', { ascending: false });
    if (data) {
      setOrders(data);
      let sales = 0, profit = 0;
      data.filter(o => o.status === 'delivered').forEach(o => {
        sales += (o.total_price || 0);
        profit += ((o.total_price || 0) - (o.buy_price_at_time || 0) * (o.quantity || 0));
      });
      setStats({ totalSales: sales, totalProfit: profit, orderCount: data.length });
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    if (data) setInventory(data);
  }, []);

  const fetchStockLogs = useCallback(async () => {
    const { data } = await supabase.from('stock_logs').select('*').order('id', { ascending: false }).limit(20);
    if (data) setStockLogs(data);
  }, []);

  const fetchRiderPerformance = useCallback(async () => {
    const { data: riders } = await supabase.from('profiles').select('id, full_name, phone').eq('status', 'approved');
    if (riders) {
      const performance = riders.map(rider => {
        const tasks = orders.filter(o => o.delivery_person_id === rider.id && o.status === 'delivered');
        const totalCash = tasks.reduce((sum, o) => sum + (o.total_price || 0), 0);
        return { ...rider, count: tasks.length, cash: totalCash };
      });
      setRiderStats(performance);
      setDeliveryRiders(riders);
    }
  }, [orders]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStatsAndOrders(),
      fetchInventory(),
      fetchAllUsers(),
      fetchStockLogs()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');
    };
    checkUser();
    fetchAllData();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setIsDarkMode(savedTheme === 'dark');
  }, [router]);

  useEffect(() => {
    if (activeTab === 'users') fetchAllUsers();
    if (activeTab === 'inventory') { fetchInventory(); fetchStockLogs(); }
    if (activeTab === 'orders') fetchStatsAndOrders();
    if (activeTab === 'reports') fetchRiderPerformance();
  }, [activeTab, fetchAllUsers, fetchInventory, fetchStatsAndOrders, fetchRiderPerformance, fetchStockLogs]);

  // ৩. অ্যাকশন ফাংশনসমূহ
  const updateUserStatus = async (userId, newStatus) => {
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
    if (!error) {
      alert(`User status updated to: ${newStatus}`);
      fetchAllUsers(); 
    }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        fileToUpload = await imageCompression(file, { maxSizeMB: 0.7, maxWidthOrHeight: 1024 });
      }
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(`products/${fileName}`, fileToUpload);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(`products/${fileName}`);
      setProduct({ ...product, media_url: publicUrl, media_type: file.type.startsWith('video/') ? 'video' : 'image' });
      alert("মিডিয়া আপলোড সফল!");
    } catch (err) { alert(err.message); } finally { setUploading(false); }
  };

  const handleUpload = async () => {
    if (!product.name || !product.price || !product.buy_price) return alert("সব ঘর পূরণ করুন!");
    setLoading(true);
    const { data: newProd, error } = await supabase.from('products').insert([{ 
      ...product, price: parseFloat(product.price), buy_price: parseFloat(product.buy_price), 
      quantity: parseInt(product.qty || 0), min_order_qty: parseInt(product.min_qty || 1)
    }]).select().single();

    if (!error && newProd) {
      await supabase.from('stock_logs').insert([{
        product_id: newProd.id,
        product_name: newProd.name,
        added_quantity: parseInt(product.qty || 0),
        new_total_stock: parseInt(product.qty || 0)
      }]);
      alert("পণ্য ও স্টক লগ সেভ হয়েছে!");
      setProduct({ name: '', price: '', buy_price: '', qty: '', min_qty: '1', media_url: '', media_type: 'image' });
      fetchInventory();
      fetchStockLogs();
    }
    setLoading(false);
  };

  // ৪. ফিল্টার ও মেমো লজিক (ইউজার লিস্ট লোড হওয়ার জন্য গুরুত্বপূর্ণ)
  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const matchesSearch = u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                            u.phone?.includes(userSearchTerm) || 
                            u.id?.slice(0, 8).includes(userSearchTerm);
      // পেন্ডিং লিস্ট আলাদা দেখানোর জন্য এখানে সেভ করা হয়েছে
      return u.status !== 'pending' && matchesSearch;
    });
  }, [allUsers, userSearchTerm]);

  const customerLedger = useMemo(() => {
    return allUsers.filter(u => u.status === 'approved').map(u => {
      const uOrders = orders.filter(o => o.user_id === u.id && o.status === 'delivered');
      const spent = uOrders.reduce((s, o) => s + (o.total_price || 0), 0);
      const prof = uOrders.reduce((s, o) => s + ((o.total_price || 0) - (o.buy_price_at_time || 0) * (o.quantity || 0)), 0);
      return { ...u, orderCount: uOrders.length, totalSpent: spent, totalProfit: prof };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [allUsers, orders]);

  const chartData = useMemo(() => {
    const days = [...Array(7)].map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
    return days.map(d => ({
      date: d.split('-')[2] + '/' + d.split('-')[1],
      sales: orders.filter(o => o.status === 'delivered' && o.created_at?.startsWith(d)).reduce((s, o) => s + o.total_price, 0),
      profit: orders.filter(o => o.status === 'delivered' && o.created_at?.startsWith(d)).reduce((s, o) => s + (o.total_price - (o.buy_price_at_time || 0) * o.quantity), 0)
    }));
  }, [orders]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); };
  const toggleDarkMode = () => { const mode = !isDarkMode; setIsDarkMode(mode); localStorage.setItem('theme', mode ? 'dark' : 'light'); };

  // ৫. ট্যাব কন্টেন্ট রেন্ডারিং
  const renderTabContent = () => {
    switch (activeTab) {
      case 'inventory':
        return (
          <div className="space-y-8 animate-in fade-in">
            <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white text-black'} p-8 rounded-3xl shadow-xl border ${isDarkMode ? 'border-slate-700' : 'border-gray-100'} max-w-2xl`}>
              <h2 className="text-xl font-black mb-6 uppercase flex items-center gap-3 text-blue-400"><PlusCircle /> নতুন পণ্য যোগ</h2>
              <div className="space-y-4">
                <div className={`border-2 border-dashed p-4 rounded-2xl text-center cursor-pointer ${product.media_url ? 'border-blue-500' : 'border-gray-600'}`}>
                   {product.media_url ? (
                     <div className="relative h-32">
                       {product.media_type === 'image' ? <img src={product.media_url} className="h-full mx-auto rounded-lg" alt="Preview" /> : <video src={product.media_url} className="h-full mx-auto rounded-lg" controls />}
                       <button onClick={() => setProduct({...product, media_url: ''})} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full font-bold">×</button>
                     </div>
                   ) : (
                     <label className="cursor-pointer">
                       <ImageIcon className="mx-auto text-gray-400" size={30} />
                       <p className="text-[10px] uppercase font-bold text-gray-400 mt-2">{uploading ? "অপেক্ষা করুন..." : "ছবি/ভিডিও আপলোড"}</p>
                       <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
                     </label>
                   )}
                </div>
                <input type="text" placeholder="পণ্যের নাম" className={`w-full p-3 rounded-xl border bg-transparent ${isDarkMode ? 'text-white border-slate-600' : 'text-black border-gray-200'}`} value={product.name} onChange={e => setProduct({...product, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="কেনা দাম ৳" className={`p-3 rounded-xl border bg-transparent font-bold ${isDarkMode ? 'text-red-400 border-slate-600' : 'text-red-600 border-gray-200'}`} value={product.buy_price} onChange={e => setProduct({...product, buy_price: e.target.value})} />
                  <input type="number" placeholder="বিক্রয় দাম ৳" className={`p-3 rounded-xl border bg-transparent font-bold ${isDarkMode ? 'text-green-400 border-slate-600' : 'text-green-600 border-gray-200'}`} value={product.price} onChange={e => setProduct({...product, price: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="স্টক" className={`p-3 rounded-xl border bg-transparent ${isDarkMode ? 'text-white border-slate-600' : 'text-black border-gray-200'}`} value={product.qty} onChange={e => setProduct({...product, qty: e.target.value})} />
                  <input type="number" placeholder="মিনিমাম অর্ডার" className={`p-3 rounded-xl border bg-transparent ${isDarkMode ? 'text-white border-slate-600' : 'text-black border-gray-200'}`} value={product.min_qty} onChange={e => setProduct({...product, min_qty: e.target.value})} />
                </div>
                <button onClick={handleUpload} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold uppercase shadow-lg hover:bg-blue-700 transition-all">পণ্য সেভ করুন</button>
              </div>
            </div>
            {/* ইনভেন্টরি তালিকা */}
            <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white text-black'} p-8 rounded-3xl shadow-lg border ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
               <h2 className="text-xl font-black mb-6 uppercase flex items-center gap-3"><Package /> ইনভেন্টরি তালিকা</h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {inventory.map(item => (
                    <div key={item.id} className={`p-4 border rounded-2xl ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-100'}`}>
                       {item.media_url && (item.media_type === 'video' ? <video src={item.media_url} className="h-32 w-full object-cover rounded-xl mb-3" /> : <img src={item.media_url} className="h-32 w-full object-cover rounded-xl mb-3" alt={item.name} />)}
                       <h4 className="font-black text-sm uppercase truncate">{item.name}</h4>
                       <p className="text-[10px] text-gray-400 font-bold uppercase">স্টক: {item.quantity} | {item.price} ৳</p>
                    </div>
                  ))}
               </div>
            </div>
            {/* স্টক লগ */}
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} p-8 rounded-[3rem] border shadow-2xl overflow-hidden`}>
              <h2 className="text-xl font-black mb-8 uppercase flex items-center gap-3 text-orange-400"><Clock size={24} /> রিসেন্ট স্টক হিস্ট্রি</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase text-gray-500 border-b border-slate-700"><th className="pb-4 px-2">তারিখ</th><th className="pb-4 px-2">পণ্যের নাম</th><th className="pb-4 px-2">যোগ করা হয়েছে</th><th className="pb-4 px-2">মোট স্টক</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {stockLogs.map(log => (
                      <tr key={log.id} className="text-xs font-bold hover:bg-slate-700/30 transition-colors">
                        <td className="py-4 px-2 text-gray-400">{new Date(log.created_at).toLocaleDateString()}</td>
                        <td className="py-4 px-2 text-blue-400 uppercase">{log.product_name}</td>
                        <td className="py-4 px-2 text-green-500">+{log.added_quantity} টি</td>
                        <td className="py-4 px-2 text-white">{log.new_total_stock} টি</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-10 animate-in fade-in">
            <section>
              <h2 className="text-xl font-black text-green-500 uppercase flex items-center gap-3 mb-6"><UserPlus /> ভেরিফিকেশন ({pendingUsers.length})</h2>
              <div className="grid grid-cols-1 gap-4">
                {pendingUsers.map(u => (
                  <div key={u.id} className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white text-black'} p-6 rounded-3xl border flex justify-between items-center shadow-sm`}>
                    <div><p className="font-black uppercase text-sm">{u.full_name}</p><p className="text-xs text-gray-400 font-bold">{u.phone}</p></div>
                    <div className="flex gap-2">
                      <button onClick={() => updateUserStatus(u.id, 'approved')} className="p-3 bg-green-600 text-white rounded-xl hover:scale-110 transition-all shadow-md"><UserCheck size={20}/></button>
                      <button onClick={() => updateUserStatus(u.id, 'rejected')} className="p-3 bg-red-600 text-white rounded-xl hover:scale-110 transition-all shadow-md"><UserX size={20}/></button>
                    </div>
                  </div>
                ))}
                {pendingUsers.length === 0 && <p className="opacity-50 italic font-bold">কোনো পেন্ডিং রিকোয়েস্ট নেই।</p>}
              </div>
            </section>
            <section className="pt-10 border-t border-slate-800">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <h2 className="text-xl font-black text-blue-500 uppercase flex items-center gap-3"><Users /> সব ইউজার তালিকা ({filteredUsers.length})</h2>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                  <input type="text" placeholder="নাম, ফোন বা আইডি..." className={`w-full pl-10 pr-4 py-3 rounded-2xl border outline-none ${isDarkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white border-gray-200 text-black'}`} value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {/* ফিল্টার করা ইউজাররা এখানে রেন্ডার হবে */}
                {filteredUsers.map(u => (
                  <div key={u.id} className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} p-6 rounded-3xl border flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-all shadow-lg`}>
                    <div className="flex-1 text-white">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${u.status === 'approved' ? 'bg-green-500' : u.status === 'blocked' ? 'bg-red-500' : 'bg-orange-500'}`}></span>
                        <h4 className="font-black uppercase text-sm leading-none">{u.full_name}</h4>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 tracking-tighter uppercase">ID: #{u.id.slice(0,8)} | PHONE: {u.phone} | STATUS: {u.status}</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button onClick={() => updateUserStatus(u.id, u.status === 'blocked' ? 'approved' : 'blocked')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-md ${u.status==='blocked'?'bg-green-600 text-white':'bg-red-600 text-white'}`}>{u.status==='blocked'?'Unblock User':'Block User'}</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        );

      case 'orders':
        return (
          <div className="space-y-6 animate-in fade-in text-white pb-20">
            <div className="flex justify-between items-center mb-6 px-2">
              <h2 className="text-2xl font-black uppercase flex items-center gap-3 text-blue-500"><ShoppingBag /> অর্ডার কন্ট্রোল সেন্টার ({orders.length})</h2>
              <button onClick={fetchStatsAndOrders} className="p-3 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-all"><RefreshCcw size={20} /></button>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {orders.map(order => (
                <div key={order.id} className="bg-slate-800 border border-slate-700 p-8 rounded-[3rem] shadow-2xl hover:border-blue-500/30 transition-all group">
                  <div className="flex flex-col lg:flex-row justify-between gap-8">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500"><Package size={24} /></div>
                        <div>
                          <h4 className="font-black uppercase text-xl leading-none">{order.product_name}</h4>
                          <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-tighter">ID: #{order.id.slice(0, 8)} | কাস্টমার: {order.name || 'অজানা'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/50 p-5 rounded-2xl border border-slate-700/50">
                        <div><p className="text-[8px] uppercase text-gray-500 mb-1">পরিমাণ</p><p className="font-black text-lg">{order.quantity} টি</p></div>
                        <div><p className="text-[8px] uppercase text-gray-500 mb-1">মোট বিল</p><p className="font-black text-lg text-green-500">{order.total_price} ৳</p></div>
                        <div className="col-span-2"><p className="text-[8px] uppercase text-gray-500 mb-1">ডেলিভারি ঠিকানা</p><p className="text-xs font-bold leading-snug">{order.address}</p></div>
                      </div>
                    </div>
                    <div className="w-full md:w-80 space-y-4">
                      <select className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-xs font-black outline-none focus:border-blue-500 text-white" onChange={(e) => supabase.from('orders').update({ delivery_person_id: e.target.value, status: 'shipped' }).eq('id', order.id).then(()=>fetchStatsAndOrders())} value={order.delivery_person_id || ""}><option value="">রাইডার বেছে নিন</option>{deliveryRiders.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}</select>
                      <div className="flex gap-2"><button onClick={()=>window.open(`tel:${order.phone}`)} className="flex-1 py-4 bg-blue-600 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg"><Phone size={16}/> কল করুন</button><button onClick={()=>{if(confirm("Delete?")) supabase.from('orders').delete().eq('id', order.id).then(()=>fetchStatsAndOrders())}} className="p-4 bg-red-600/20 text-red-500 rounded-2xl"><Trash2 size={20}/></button></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-10 animate-in fade-in text-white pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-800 border border-slate-700 p-8 rounded-[3rem] shadow-2xl h-[450px]">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-xs font-black uppercase text-gray-500 flex items-center gap-2"><BarChart3 size={16} /> বিক্রয় ও মুনাফা विश्लेषण</h3>
                   <div className="flex gap-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-400"><div className="w-2 h-2 rounded-full bg-blue-400" /> বিক্রয়</div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-green-400"><div className="w-2 h-2 rounded-full bg-green-400" /> মুনাফা</div>
                   </div>
                </div>
                <ResponsiveContainer width="100%" height="80%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                    <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '15px'}} />
                    <Area type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" strokeWidth={4} />
                    <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-slate-800 border border-slate-700 p-8 rounded-[3rem] shadow-2xl overflow-y-auto max-h-[450px]">
                <h3 className="text-xs font-black uppercase text-gray-500 mb-8 flex items-center gap-2"><Truck size={16} className="text-blue-500" /> রাইডার পারফরম্যান্স ও ক্যাশ</h3>
                <div className="space-y-4">
                  {riderStats.map(rider => (
                    <div key={rider.id} className="bg-slate-950/50 border border-slate-800 p-5 rounded-3xl flex justify-between items-center group hover:border-blue-500/30 transition-all">
                      <div><h4 className="font-black uppercase text-white text-sm leading-none mb-2">{rider.full_name}</h4><p className="text-[9px] text-gray-500 font-bold uppercase">{rider.phone}</p></div>
                      <div className="flex gap-6 text-right">
                        <div><p className="text-[8px] uppercase text-gray-500 mb-1">ডেলিভারি</p><p className="font-black text-blue-400">{rider.count} টি</p></div>
                        <div><p className="text-[8px] uppercase text-gray-500 mb-1">সংগ্রহ</p><p className="font-black text-green-500">{rider.cash} ৳</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'ledger':
        return (
          <div className="space-y-6 animate-in slide-in-from-bottom text-white pb-20">
            <h2 className="text-2xl font-black text-orange-500 uppercase flex items-center gap-3"><BookOpen /> কাস্টমার আর্থিক লেজার</h2>
            <div className="grid grid-cols-1 gap-4">
              {customerLedger.map(c => (
                <div key={c.id} className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white text-black border-gray-100'} p-6 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl hover:border-orange-500/50 transition-all group`}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform"><Users size={24}/></div>
                    <div><h4 className="font-black uppercase text-lg text-blue-400 leading-none mb-1">{c.full_name}</h4><p className="text-[10px] opacity-60 font-bold uppercase tracking-tighter">{c.phone} | {c.address || 'ঠিকানা নেই'}</p></div>
                  </div>
                  <div className="flex gap-8 bg-slate-900/50 p-5 rounded-[1.5rem] border border-slate-700/50">
                    <div className="text-center min-w-[80px]"><p className="text-[8px] uppercase opacity-50 font-black">কেনাকাটা</p><p className="font-black text-blue-500">{c.totalSpent} ৳</p></div>
                    <div className="text-center min-w-[80px]"><p className="text-[8px] uppercase opacity-50 font-black">মুনাফা</p><p className="font-black text-green-500">+{c.totalProfit} ৳</p></div>
                  </div>
                  <button onClick={() => window.open(`tel:${c.phone}`)} className="w-full md:w-auto px-6 py-3 bg-slate-700 hover:bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase transition-all shadow-lg flex items-center justify-center gap-2"><Phone size={14} /> যোগাযোগ</button>
                </div>
              ))}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className={`flex min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-black'}`}>
      <div className={`w-20 md:w-72 p-6 flex flex-col justify-between shadow-2xl transition-all ${isDarkMode ? 'bg-slate-900 border-r border-slate-800 text-white' : 'bg-blue-950 text-white'}`}>
        <div>
          <div className="mb-12 flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl"><ShieldAlert size={24}/></div>
            <h2 className="hidden md:block text-2xl font-black tracking-tighter text-blue-500 uppercase">BIZ ADMIN</h2>
          </div>
          <nav className="space-y-3">
            {[ { id: 'inventory', icon: LayoutDashboard, label: 'ইনভেন্টরি' }, { id: 'orders', icon: ShoppingBag, label: 'অর্ডারসমূহ' }, { id: 'users', icon: Users, label: 'ইউজার' }, { id: 'reports', icon: BarChart3, label: 'রিপোর্ট' }, { id: 'ledger', icon: BookOpen, label: 'লেজার' } ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'bg-blue-600 shadow-xl translate-x-2 text-white' : 'hover:bg-slate-800 text-gray-500 hover:text-gray-300'}`}><tab.icon size={22} /> <span className="hidden md:block font-black text-xs uppercase tracking-widest">{tab.label}</span></button>
            ))}
          </nav>
        </div>
        <div className="space-y-4">
          <button onClick={toggleDarkMode} className="w-full flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl font-bold uppercase text-[10px]">
            {isDarkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
            <span className="hidden md:block uppercase tracking-widest">{isDarkMode ? 'Light' : 'Dark'} Mode</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-5 bg-red-600/10 text-red-500 rounded-[1.5rem] font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-all shadow-lg"><LogOut size={20}/> <span className="hidden md:block">লগ-আউট</span></button>
        </div>
      </div>
      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group"><DollarSign className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" /><p className="text-[10px] font-black uppercase opacity-60 mb-2 text-green-100">মোট বিক্রয়</p><p className="text-4xl font-black text-white">{stats.totalSales} ৳</p></div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group"><TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" /><p className="text-[10px] font-black uppercase opacity-60 mb-2 text-blue-100">মোট মুনাফা</p><p className="text-4xl font-black text-white">{stats.totalProfit} ৳</p></div>
          <div className="bg-gradient-to-br from-orange-600 to-red-700 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group"><Package className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" /><p className="text-[10px] font-black uppercase opacity-60 mb-2 text-orange-100">মোট অর্ডার</p><p className="text-4xl font-black text-white">{stats.orderCount} টি</p></div>
        </div>
        <div className="pb-20">{renderTabContent()}</div>
      </div>
    </div>
  );
}