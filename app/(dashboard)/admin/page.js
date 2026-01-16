"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  PlusCircle, Package, Loader2, DollarSign, TrendingUp, 
  ShoppingBag, CheckCircle, Clock, Printer, FileDown, 
  FileText, LogOut, Search, LayoutDashboard, User
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function AdminDashboard() {
  const [product, setProduct] = useState({ name: '', price: '', buy_price: '', qty: '', min_qty: '1' });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalSales: 0, totalProfit: 0, orderCount: 0 });
  const [orders, setOrders] = useState([]);
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
  }, [router]);

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
      alert("পণ্য সেভ হয়েছে!");
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
    fetchStatsAndOrders();
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(orders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(wb, "Full_Report.xlsx");
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
        <head><title>Print Invoice</title><style>body{font-family:sans-serif;padding:30px;} .box{border:1px solid #eee;padding:20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #eee;padding:10px;text-align:left;}</style></head>
        <body>
          <div class="box">
            <h1 style="text-align:center">পাইকারি শপ ইনভয়েস</h1>
            <p>অর্ডার আইডি: #${order.id.slice(0,8)}</p>
            <table>
              <tr><th>পণ্য</th><th>পরিমাণ</th><th>মোট মূল্য</th></tr>
              <tr><td>${order.product_name}</td><td>${order.quantity} টি</td><td>${order.total_price} ৳</td></tr>
            </table>
            <h3 style="text-align:right">মোট: ${order.total_price} ৳</h3>
          </div>
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
      <div className="w-20 md:w-64 bg-blue-950 text-white p-4 md:p-6 flex flex-col justify-between shadow-2xl">
        <div>
          <h2 className="hidden md:block text-xl font-black mb-10 border-b border-blue-800 pb-4 uppercase">অ্যাডমিন কন্ট্রোল</h2>
          <nav className="space-y-4">
            <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-blue-600 shadow-lg' : 'hover:bg-blue-900'}`}>
              <LayoutDashboard size={20}/> <span className="hidden md:block font-bold">ড্যাশবোর্ড</span>
            </button>
            <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-blue-600 shadow-lg' : 'hover:bg-blue-900'}`}>
              <ShoppingBag size={20}/> <span className="hidden md:block font-bold">অর্ডারসমূহ</span>
            </button>
            <button onClick={downloadExcel} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-green-700 text-green-300 border border-green-900/30">
              <FileDown size={20}/> <span className="hidden md:block font-bold">রিপোর্ট</span>
            </button>
          </nav>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl font-bold transition-all border border-red-900/20">
          <LogOut size={20}/> <span className="hidden md:block">লগ-আউট</span>
        </button>
      </div>

      <div className="flex-1 p-4 md:p-10 overflow-y-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-green-500">
            <div className="flex justify-between items-center text-gray-400 mb-2 uppercase text-[10px] font-black">Total Sales <TrendingUp size={14}/></div>
            <div className="text-3xl font-black">{stats.totalSales} ৳</div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-blue-500">
            <div className="flex justify-between items-center text-gray-400 mb-2 uppercase text-[10px] font-black">Net Profit <DollarSign size={14}/></div>
            <div className="text-3xl font-black text-blue-600">{stats.totalProfit} ৳</div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-orange-500">
            <div className="flex justify-between items-center text-gray-400 mb-2 uppercase text-[10px] font-black">Orders <ShoppingBag size={14}/></div>
            <div className="text-3xl font-black text-orange-600">{stats.orderCount} টি</div>
          </div>
        </div>

        {activeTab === 'inventory' ? (
          /* Inventory Form */
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 max-w-2xl animate-in slide-in-from-bottom-5">
            <h2 className="text-2xl font-black mb-8 text-blue-950 uppercase flex items-center gap-3"><PlusCircle size={24}/> নতুন পণ্য যোগ</h2>
            <div className="space-y-5">
              <input type="text" placeholder="পণ্যের নাম" className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-blue-500 bg-gray-50/50" value={product.name} onChange={e => setProduct({...product, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="কেনা দাম ৳" className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-red-400 bg-red-50/20" value={product.buy_price} onChange={e => setProduct({...product, buy_price: e.target.value})} />
                <input type="number" placeholder="বিক্রয় দাম ৳" className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-green-400 bg-green-50/20" value={product.price} onChange={e => setProduct({...product, price: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="স্টক পরিমাণ" className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-blue-500 bg-gray-50/50" value={product.qty} onChange={e => setProduct({...product, qty: e.target.value})} />
                <input type="number" placeholder="মিনিমাম অর্ডার" className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-blue-500 bg-gray-50/50" value={product.min_qty} onChange={e => setProduct({...product, min_qty: e.target.value})} />
              </div>
              <button onClick={handleUpload} disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest">
                {loading ? <Loader2 className="animate-spin mx-auto"/> : "পণ্য সেভ করুন"}
              </button>
            </div>
          </div>
        ) : (
          /* Orders Table View */
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-black text-blue-950 uppercase flex items-center gap-3 self-start"><Clock size={24}/> সাম্প্রতিক অর্ডারসমূহ</h2>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-3.5 text-gray-300" size={18}/>
                    <input type="text" placeholder="সার্চ অর্ডার..." className="w-full pl-10 pr-4 py-3 bg-white border rounded-2xl outline-none focus:ring-2 ring-blue-500" onChange={e => setSearchTerm(e.target.value)}/>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.length > 0 ? filteredOrders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-all">
                  <div>
                    <h4 className="font-black text-gray-800 uppercase text-sm">{order.product_name}</h4>
                    <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase">{order.quantity} টি | {order.total_price} ৳</p>
                    <span className={`inline-block mt-2 text-[8px] font-black px-3 py-1 rounded-full uppercase ${order.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>{order.status}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => downloadPDFInvoice(order)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><FileText size={18}/></button>
                    <button onClick={() => printInvoice(order)} className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-800 hover:text-white transition-all"><Printer size={18}/></button>
                    {order.status !== 'delivered' && (
                      <button onClick={() => updateStatus(order, 'delivered')} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"><CheckCircle size={18}/></button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center py-20 text-gray-400 font-bold italic">কোনো অর্ডার পাওয়া যায়নি।</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}