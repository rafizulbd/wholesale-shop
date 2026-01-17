"use client";
import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, Package, Info, AlertCircle, Clock, 
  CheckCircle2, LogOut, ListOrdered, User, ShoppingBag, 
  FileText, Truck, Phone, PlayCircle, Search, MapPin, Download,
  History, Box
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function UserCatalog() {
  // ১. সম্পূর্ণ স্টেট ম্যানেজমেন্ট
  const [products, setProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderTab, setOrderTab] = useState('active'); // নতুন ফিল্টার স্টেট: 'active' বা 'history'
  const router = useRouter();

  // ২. ডাটা ফেচিং এবং সেশন ম্যানেজমেন্ট (রিয়েল-টাইম)
  const fetchMyOrders = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        rider:profiles!orders_delivery_person_id_fkey (full_name, phone)
      `)
      .eq('user_id', userId)
      .order('id', { ascending: false });

    if (error) console.error("Order fetch error:", error.message);
    else setMyOrders(data || []);
  }, []);

  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile?.status === 'rejected' || profile?.status === 'blocked') {
        alert("আপনার একাউন্টটি সক্রিয় নয়।");
        await supabase.auth.signOut();
        router.push('/login');
        return;
      }

      setUser({ ...session.user, profile });
      await Promise.all([fetchProducts(), fetchMyOrders(session.user.id)]);
      setLoading(false);
    };
    initData();
  }, [router, fetchMyOrders]);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    if (data) setProducts(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // ৩. ইনভয়েস জেনারেশন (পেশাদার ডিজিটাল মেমো)
  const downloadInvoice = (order) => {
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("BIZ STORE - DIGITAL MEMO", 105, 25, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`INVOICE TO:`, 20, 55);
    doc.setFontSize(10);
    doc.text(`Name: ${user?.profile?.full_name}`, 20, 62);
    doc.text(`Phone: ${user?.profile?.phone}`, 20, 68);
    doc.text(`Address: ${user?.profile?.address || 'N/A'}`, 20, 74);
    
    doc.text(`DATE: ${new Date().toLocaleDateString()}`, 140, 62);
    doc.text(`ORDER ID: #${order.id.slice(0, 8)}`, 140, 68);
    doc.text(`STATUS: ${order.status.toUpperCase()}`, 140, 74);

    doc.autoTable({
      startY: 85,
      head: [['Product Name', 'Quantity', 'Price (Unit)', 'Total Price']],
      body: [[
        order.product_name, 
        order.quantity, 
        `${order.total_price / order.quantity} TK`, 
        `${order.total_price} TK`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
      styles: { halign: 'center' }
    });

    const finalY = doc.lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.text(`GRAND TOTAL: ${order.total_price} TK`, 140, finalY + 15);
    doc.save(`Invoice_${order.id.slice(0, 8)}.pdf`);
  };

  // ৪. ফিল্টার লজিক (প্রোডাক্ট সার্চ ও অর্ডার ট্যাব ফিল্টার)
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const filteredOrders = useMemo(() => {
    if (orderTab === 'active') {
      return myOrders.filter(o => o.status === 'pending' || o.status === 'shipped' || o.status === 'preorder');
    } else {
      return myOrders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
    }
  }, [myOrders, orderTab]);

  const handleOrder = async (product) => {
    const isOutOfStock = product.quantity <= 0;
    const actionText = isOutOfStock ? "প্রি-অর্ডার" : "অর্ডার";
    const orderQty = prompt(`${product.name}\nমিনিমাম ${product.min_order_qty} টি দিতে হবে। পরিমাণ দিন:`);
    
    if (!orderQty) return;
    const qty = parseInt(orderQty);

    if (isNaN(qty) || qty < product.min_order_qty) {
      alert(`কমপক্ষে ${product.min_order_qty} টি দিতে হবে।`);
      return;
    }

    try {
      const { error } = await supabase.from('orders').insert([{
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        total_price: qty * product.price,
        buy_price_at_time: product.buy_price,
        user_id: user.id,
        status: isOutOfStock ? 'preorder' : 'pending',
        phone: user.profile?.phone || '',
        address: user.profile?.address || ''
      }]);

      if (error) throw error;
      alert(`${actionText} সফল হয়েছে!`);
      fetchMyOrders(user.id);
    } catch (err) {
      alert("সমস্যা হয়েছে: " + err.message);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950">
      <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
      <p className="text-blue-500 font-black uppercase text-xs tracking-widest">LOAD STORE...</p>
    </div>
  );

  return (
    <div className="bg-slate-950 min-h-screen text-white font-sans pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/user/profile')} className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-900/20 hover:scale-105 transition-all">
              <User size={22} />
            </button>
            <div>
              <h1 className="text-sm font-black uppercase leading-none text-blue-400">
                {user?.profile?.full_name || 'ইউজার'}
              </h1>
              <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase tracking-tighter">Status: {user?.profile?.status}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2.5 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* ৫. পণ্য ক্যাটালগ (ভিডিও সাপোর্টসহ) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                <ShoppingBag className="text-blue-500" size={22} /> পাইকারি পণ্য ক্যাটালগ
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                <input 
                  type="text" 
                  placeholder="পণ্য খুঁজুন..." 
                  className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:border-blue-500 transition-all w-full md:w-64"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredProducts.map((item) => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden group hover:border-blue-500/50 transition-all shadow-2xl">
                  <div className="relative h-52 bg-slate-800 overflow-hidden">
                    {item.media_type === 'video' ? (
                      <video src={item.media_url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                    ) : (
                      <img src={item.media_url || 'https://via.placeholder.com/400x300'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                    )}
                    <div className="absolute top-3 right-3 bg-blue-600 px-3 py-1 rounded-full text-[12px] font-black shadow-xl">
                      {item.price} ৳
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="font-black text-white uppercase text-sm mb-3 line-clamp-1">{item.name}</h3>
                    <div className="flex items-center gap-2 mb-6">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${item.quantity > 0 ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'}`}>
                        {item.quantity > 0 ? `স্টক: ${item.quantity} টি` : 'আউট অফ স্টক'}
                      </span>
                      <span className="text-[9px] font-black bg-slate-800 text-gray-400 px-2 py-0.5 rounded-md uppercase">মিনিমাম: {item.min_order_qty} টি</span>
                    </div>
                    <button onClick={() => handleOrder(item)} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2">
                      <ShoppingCart size={16} /> {item.quantity > 0 ? 'অর্ডার করুন' : 'প্রি-অর্ডার করুন'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ৬. আমার অর্ডারসমূহ (ফিল্টার ট্যাবসহ)  */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
              <ListOrdered className="text-blue-500" size={22} /> আমার অর্ডারসমূহ
            </h2>

            {/* ফিল্টার ট্যাব */}
            <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
              <button 
                onClick={() => setOrderTab('active')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${orderTab === 'active' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Box size={14} /> চলমান
              </button>
              <button 
                onClick={() => setOrderTab('history')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${orderTab === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <History size={14} /> হিস্ট্রি
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-[2.5rem] space-y-5 max-h-[75vh] overflow-y-auto shadow-2xl custom-scrollbar">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-5 border border-slate-800 rounded-3xl bg-slate-950/50 hover:border-blue-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black text-[11px] text-blue-400 uppercase leading-tight">{order.product_name}</h4>
                      <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase">ID: #{order.id.slice(0,5)} | {order.total_price} ৳</p>
                    </div>
                    <span className={`text-[8px] px-2 py-1 rounded-full font-black uppercase ${
                      order.status === 'delivered' ? 'bg-green-600/20 text-green-500' : 
                      order.status === 'shipped' ? 'bg-blue-600/20 text-blue-500 animate-pulse' : 'bg-orange-600/20 text-orange-500'
                    }`}>
                      {order.status === 'shipped' ? 'পথে আছে' : order.status === 'delivered' ? 'পৌঁছেছে' : 'পেন্ডিং'}
                    </span>
                  </div>

                  {/* রাইডার কার্ড */}
                  {order.status === 'shipped' && order.rider && (
                    <div className="mb-4 p-3 bg-blue-600/10 rounded-xl border border-blue-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck size={16} className="text-blue-500"/>
                        <div>
                          <p className="text-[10px] font-black text-white uppercase leading-none">{order.rider.full_name}</p>
                          <p className="text-[9px] font-bold text-blue-500 mt-1">{order.rider.phone}</p>
                        </div>
                      </div>
                      <a href={`tel:${order.rider.phone}`} className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:scale-110 transition-all">
                        <Phone size={12}/>
                      </a>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                    <p className="text-[10px] font-black text-gray-500 uppercase">{order.quantity} টি পণ্য</p>
                    <button onClick={() => downloadInvoice(order)} className="text-blue-500 flex items-center gap-2 text-[10px] font-black uppercase hover:underline transition-all">
                      <Download size={14} /> মেমো ডাউনলোড
                    </button>
                  </div>
                </div>
              ))}
              {filteredOrders.length === 0 && (
                <div className="text-center py-10 opacity-20 font-black uppercase text-xs tracking-widest">
                  কোনো অর্ডার নেই
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}