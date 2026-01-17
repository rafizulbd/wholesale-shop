"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase'; 
import { useRouter } from 'next/navigation';
import { 
  PlusCircle, Package, Loader2, DollarSign, TrendingUp, 
  ShoppingBag, CheckCircle, Clock, Printer, FileDown, 
  FileText, LogOut, Search, LayoutDashboard, Phone, MapPin, 
  Users, UserCheck, UserX
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function AdminDashboard() {
  const [product, setProduct] = useState({ name: '', price: '', buy_price: '', qty: '', min_qty: '1' });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalSales: 0, totalProfit: 0, orderCount: 0 });
  const [orders, setOrders] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('inventory'); 
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
    };
    checkUser();
    fetchStatsAndOrders();
    if (activeTab === 'users') fetchPendingUsers();
  }, [router, activeTab]);

  const fetchStatsAndOrders = async () => {
    const { data: orderData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (orderData) {
      setOrders(orderData);
      let sales = 0;
      let profit = 0;
      orderData.forEach(order => {
        if(order.status === 'delivered') {
            sales += order.total_price;
            const costPrice = order.buy_price_at_time * order.quantity;
            profit += (order.total_price - costPrice);
        }
      });
      setStats({ totalSales: sales, totalProfit: profit, orderCount: orderData.length });
    }
  };

  // ডাটাবেজ টেবিল থেকে পেন্ডিং ইউজারদের ডাটা আনার ফাংশন
  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending');
      
      if (error) throw error;
      setPendingUsers(data || []);
    } catch (err) {
      console.error("ইউজার লিস্ট আনতে সমস্যা:", err.message);
    }
    setLoading(false);
  };

  // ইউজার ভেরিফাই বা রিজেক্ট করার লজিক
  const handleUserAction = async (user, action) => {
    const status = action === 'verify' ? 'approved' : 'rejected';
    let feedback = "";

    if (action === 'reject') {
      feedback = prompt("রিজেক্ট করার কারণ লিখুন (এটি কাস্টমারকে হোয়াটসঅ্যাপে পাঠানো হবে):");
      if (!feedback) return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: status })
        .eq('id', user.id);

      if (!error) {
        alert(`ইউজার সফলভাবে ${status === 'approved' ? 'ভেরিফাই' : 'রিজেক্ট'} করা হয়েছে।`);
        
        if (action === 'reject') {
          const waLink = `https://wa.me/${user.phone}?text=দুঃখিত, আপনার একাউন্ট রিজেক্ট করা হয়েছে। কারণ: ${feedback}`;
          window.open(waLink, '_blank');
        }
        fetchPendingUsers();
      } else {
        throw error;
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleUpload = async () => {
    if (!product.name || !product.price || !product.qty || !product.buy_price) {
      alert("সবগুলো ঘর পূরণ করুন!");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('products').insert([{ 
      name: product.name, price: parseFloat(product.price), buy_price: parseFloat(product.buy_price), 
      quantity: parseInt(product.qty), min_order_qty: parseInt(product.min_qty)
    }]);
    if (!error) {
      alert("পণ্য সেভ হয়েছে!");
      setProduct({ name: '', price: '', buy_price: '', qty: '', min_qty: '1' });
      fetchStatsAndOrders();
    }
    setLoading(false);
  };

  const updateStatus = async (order, newStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
    if (newStatus === 'delivered' && !error) {
      const { data: pData } = await supabase.from('products').select('quantity').eq('id', order.product_id).single();
      if (pData) await supabase.from('products').update({ quantity: pData.quantity - order.quantity }).eq('id', order.product_id);
    }
    alert(`অর্ডারটি ${newStatus} হয়েছে।`);
    fetchStatsAndOrders();
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(orders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(wb, "Business_Report.xlsx");
  };

  const downloadPDFInvoice = (order) => {
    const doc = new jsPDF();
    doc.text("Wholesale Invoice", 105, 20, { align: "center" });
    doc.autoTable({
      startY: 40,
      head: [['Product', 'Qty', 'Unit Price', 'Total']],
      body: [[order.product_name, order.quantity, `${order.total_price / order.quantity} TK`, `${order.total_price} TK`]],
    });
    doc.save(`Invoice_${order.id.slice(0,5)}.pdf`);
  };

  const printInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Print Invoice</title><style>body{font-family:sans-serif;padding:20px;}</style></head>
        <body>
          <h1 style="text-align:center">মেমো</h1>
          <p>অর্ডার আইডি: #${order.id.slice(0,8)}</p>
          <hr/>
          <p>পণ্য: ${order.product_name}</p>
          <p>পরিমাণ: ${order.quantity}</p>
          <p>মোট: ${order.total_price} ৳</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredOrders = orders.filter(o => o.product_name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-gray-50 text-black font-sans">
      {/* Sidebar */}
      <div className="w-20 md:w-64 bg-blue-950 text-white p-4 md:p-6 flex flex-col justify-between shadow-2xl transition-all">
        <div>
          <h2 className="hidden md:block text-xl font-black mb-10 border-b border-blue-800 pb-4 uppercase tracking-tighter">Business Admin</h2>
          <nav className="space-y-4">
            <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-blue-600 shadow-lg' : 'hover:bg-blue-900'}`}>
              <LayoutDashboard size={20}/> <span className="hidden md:block font-bold text-sm uppercase">ইনভেন্টরি</span>
            </button>
            <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-blue-600 shadow-lg' : 'hover:bg-blue-900'}`}>
              <ShoppingBag size={20}/> <span className="hidden md:block font-bold text-sm uppercase">অর্ডারসমূহ</span>
            </button>
            <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-blue-600 shadow-lg' : 'hover:bg-blue-900'}`}>
              <Users size={20}/> <span className="hidden md:block font-bold text-sm uppercase">User Requests</span>
            </button>
            <button onClick={downloadExcel} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-green-700 text-green-300 border border-green-900/30 transition-all">
              <FileDown size={20}/> <span className="hidden md:block font-bold text-sm uppercase">Sales Report</span>
            </button>
          </nav>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl font-bold transition-all border border-red-900/20 uppercase text-xs">
          <LogOut size={20}/> <span className="hidden md:block">লগ-আউট</span>
        </button>
      </div>

      <div className="flex-1 p-4 md:p-10 overflow-y-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-green-500">
            <div className="text-[10px] font-black uppercase text-gray-400 mb-1">Total Sales</div>
            <div className="text-3xl font-black">{stats.totalSales} ৳</div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-blue-500">
            <div className="text-[10px] font-black uppercase text-gray-400 mb-1">Net Profit</div>
            <div className="text-3xl font-black text-blue-600">{stats.totalProfit} ৳</div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-orange-500">
            <div className="text-[10px] font-black uppercase text-gray-400 mb-1">Total Orders</div>
            <div className="text-3xl font-black text-orange-600">{stats.orderCount} টি</div>
          </div>
        </div>

        {activeTab === 'inventory' && (
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 max-w-2xl">
            <h2 className="text-2xl font-black mb-8 text-blue-950 uppercase flex items-center gap-3"><PlusCircle size={24}/> নতুন পণ্য যোগ</h2>
            <div className="space-y-5">
                <input type="text" placeholder="পণ্যের নাম" className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-blue-500 bg-gray-50/50" value={product.name} onChange={e => setProduct({...product, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="কেনা দাম ৳" className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-red-400 bg-red-50/20" value={product.buy_price} onChange={e => setProduct({...product, buy_price: e.target.value})} />
                  <input type="number" placeholder="বিক্রয় দাম ৳" className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-green-400 bg-green-50/20" value={product.price} onChange={e => setProduct({...product, price: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="স্টক পরিমাণ" className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-blue-500 bg-gray-50/50" value={product.qty} onChange={e => setProduct({...product, qty: e.target.value})} />
                  <input type="number" placeholder="মিনিমাম অর্ডার" className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-blue-500 bg-gray-50/50" value={product.min_qty} onChange={e => setProduct({...product, min_qty: e.target.value})} />
                </div>
                <button onClick={handleUpload} disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest">{loading ? <Loader2 className="animate-spin mx-auto"/> : "পণ্য সেভ করুন"}</button>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-blue-950 uppercase flex items-center gap-3"><Clock size={24}/> অর্ডার তালিকা</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex justify-between mb-4">
                    <h4 className="font-black text-gray-800 uppercase text-sm">{order.product_name}</h4>
                    <span className="text-[10px] font-black px-3 py-1 bg-blue-50 text-blue-600 rounded-full">{order.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                    <p>{order.quantity} টি | {order.total_price} ৳</p>
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(order, 'delivered')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"><CheckCircle size={16}/></button>
                      <button onClick={() => downloadPDFInvoice(order)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><FileText size={16}/></button>
                      <button onClick={() => printInvoice(order)} className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-800 hover:text-white transition-all"><Printer size={16}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-black text-blue-950 uppercase flex items-center gap-3"><Users size={24}/> User Verification Requests</h2>
            
            <div className="grid grid-cols-1 gap-4">
              {loading ? (
                <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-600" size={40}/></div>
              ) : pendingUsers.length > 0 ? pendingUsers.map(user => (
                <div key={user.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex-1">
                    <h4 className="font-black text-gray-800 uppercase text-base">{user.full_name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs font-bold text-gray-500">
                      <div className="flex items-center gap-2"><Phone size={14} className="text-blue-500"/> {user.phone}</div>
                      <div className="flex items-center gap-2"><MapPin size={14} className="text-red-500"/> {user.address}</div>
                      <div className="flex items-center gap-2 uppercase tracking-tighter"><Clock size={14}/> Joined: {new Date(user.registration_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => handleUserAction(user, 'verify')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg">
                      <UserCheck size={18}/> Approve
                    </button>
                    <button onClick={() => handleUserAction(user, 'reject')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all border border-red-100">
                      <UserX size={18}/> Reject
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 text-gray-400 font-bold italic border-2 border-dashed border-gray-200 rounded-3xl uppercase tracking-widest">কোনো নতুন রেজিস্ট্রেশন রিকোয়েস্ট নেই।</div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}