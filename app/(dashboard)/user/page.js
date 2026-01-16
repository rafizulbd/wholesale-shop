"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, Package, Info, AlertCircle, Clock, 
  CheckCircle, LogOut, ListOrdered, User, ShoppingBag, FileText 
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function UserCatalog() {
  const [products, setProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkUserAndData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      
      await Promise.all([
        fetchProducts(),
        fetchMyOrders(session.user.id)
      ]);
      
      setLoading(false);
    };

    checkUserAndData();
  }, [router]);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*');
    if (data) setProducts(data);
  };

  const fetchMyOrders = async (userId) => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setMyOrders(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const downloadInvoice = (order) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Business Order Memo", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Order ID: ${order.id.slice(0,8)}`, 20, 40);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 20, 45);
    doc.text(`Customer: ${user?.user_metadata?.full_name}`, 20, 50);

    doc.autoTable({
      startY: 60,
      head: [['Product Name', 'Quantity', 'Unit Price', 'Total']],
      body: [[
        order.product_name, 
        order.quantity, 
        `${order.total_price / order.quantity} TK`, 
        `${order.total_price} TK`
      ]],
    });
    
    doc.text(`Grand Total: ${order.total_price} TK`, 150, doc.lastAutoTable.finalY + 10);
    doc.save(`Memo_${order.id.slice(0,5)}.pdf`);
  };

  const handleOrder = async (product) => {
    const isOutOfStock = product.quantity <= 0;
    const actionText = isOutOfStock ? "প্রি-অর্ডার" : "অর্ডার";
    const orderQty = prompt(`কতটি "${product.name}" ${actionText} করবেন?\n(মিনিমাম: ${product.min_order_qty} টি)`);
    
    if (!orderQty) return;
    const qty = parseInt(orderQty);

    if (isNaN(qty) || qty < product.min_order_qty) {
      alert(`ভুল ইনপুট! কমপক্ষে ${product.min_order_qty} টি দিতে হবে।`);
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
        status: isOutOfStock ? 'preorder' : 'pending'
      }]);

      if (error) throw error;
      alert(`আপনার ${actionText} সফল হয়েছে! পেমেন্ট ইনস্ট্রাকশন ফলো করুন।`);
      fetchMyOrders(user.id);
    } catch (err) {
      alert("সমস্যা হয়েছে: " + err.message);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-blue-600 font-bold tracking-widest uppercase text-xs">অপেক্ষা করুন...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen text-black font-sans pb-20">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
            <User size={28} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-blue-900 leading-tight">
              {user?.user_metadata?.full_name || 'ইউজার'}
            </h1>
            <p className="text-gray-500 font-medium text-xs md:text-sm italic">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="hidden md:flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all border border-red-100">
          <LogOut size={20} /> লগ-আউট
        </button>
      </header>

      {/* Payment Instruction Notice */}
      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-8 rounded-2xl shadow-sm animate-pulse">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="text-orange-600" size={18} />
          <h3 className="font-bold text-orange-800 uppercase text-xs tracking-wider">পেমেন্ট ইনস্ট্রাকশন:</h3>
        </div>
        <p className="text-orange-700 text-sm leading-relaxed">
          অর্ডার কনফার্ম করতে মোট টাকার <strong>২৫% অগ্রিম</strong> প্রদান করুন। 
          বিকাশ/নগদ (পার্সোনাল): <strong>০১৭XXXXXXXX</strong>। রেফারেন্সে আপনার নাম লিখুন।
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 px-2 uppercase tracking-wide">
            <ShoppingBag className="text-blue-600" size={20} /> পাইকারি পণ্য তালিকা
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {products.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 relative flex flex-col justify-between group">
                <div className="absolute top-0 right-0 p-2">
                   <span className={`text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter shadow-sm ${item.quantity > 0 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {item.quantity > 0 ? 'স্টকে আছে' : 'প্রি-অর্ডার'}
                  </span>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-gray-800 mb-1 mt-2 line-clamp-1">{item.name}</h3>
                  <div className="text-2xl font-black text-blue-600 mb-4">{item.price} ৳ <span className="text-[10px] text-gray-400 font-bold">/ পিস</span></div>
                  <div className="bg-blue-50/50 p-2 rounded-xl mb-4 flex items-center gap-2 text-[10px] font-bold text-blue-700">
                    <Info size={14} /> মিনিমাম অর্ডার: {item.min_order_qty} টি
                  </div>
                </div>
                <button onClick={() => handleOrder(item)} className={`w-full py-4 rounded-2xl font-black transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 ${item.quantity > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-100'}`}>
                  <Package size={18} /> {item.quantity > 0 ? 'অর্ডার করুন' : 'প্রি-অর্ডার দিন'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* My Orders Section */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 px-2 uppercase tracking-wide">
            <ListOrdered className="text-blue-600" size={20} /> আমার অর্ডারসমূহ
          </h2>
          <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
            {myOrders.length > 0 ? (
              myOrders.map((order) => (
                <div key={order.id} className="p-4 border rounded-2xl bg-gray-50 hover:bg-white transition-all border-gray-100 relative group">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-800 text-xs md:text-sm line-clamp-1">{order.product_name}</h4>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg uppercase shadow-sm ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                      order.status === 'preorder' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 mt-2 border-t pt-2">
                    <div>{order.quantity} টি | {order.total_price} ৳</div>
                    <button 
                      onClick={() => downloadInvoice(order)} 
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                      title="মেমো ডাউনলোড"
                    >
                      <FileText size={14} /> মেমো
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20">
                <AlertCircle className="mx-auto text-gray-300 mb-2" size={40} />
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">এখনো কোনো অর্ডার নেই</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Logout (Sticky Footer) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:hidden flex justify-center shadow-2xl z-50">
        <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-10 py-3 bg-red-600 text-white rounded-2xl font-bold shadow-lg w-full">
          <LogOut size={18} /> লগ-আউট
        </button>
      </div>
    </div>
  );
}