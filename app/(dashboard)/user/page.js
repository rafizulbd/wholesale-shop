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

      const currentUser = session.user;
      
      // ১ ঘণ্টা এক্সেস এবং ভেরিফিকেশন লজিক চেক
      const meta = currentUser.user_metadata;
      if (meta.status === 'rejected') {
        alert("আপনার একাউন্টটি রিজেক্ট করা হয়েছে। বিস্তারিত জানতে অ্যাডমিনের সাথে যোগাযোগ করুন।");
        handleLogout();
        return;
      }

      if (meta.status === 'pending') {
        const regDate = new Date(meta.registration_date || currentUser.created_at);
        const now = new Date();
        const diffHours = (now - regDate) / (1000 * 60 * 60);

        if (diffHours > 1) {
          alert("আপনার ১ ঘণ্টার ফ্রি ট্রায়াল শেষ। স্থায়ী এক্সেসের জন্য অ্যাডমিন ভেরিফিকেশন প্রয়োজন।");
          handleLogout();
          return;
        }
      }

      setUser(currentUser);
      await Promise.all([fetchProducts(), fetchMyOrders(currentUser.id)]);
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

  const handleOrder = async (product) => {
    const isOutOfStock = product.quantity <= 0;
    const actionText = isOutOfStock ? "প্রি-অর্ডার" : "অর্ডার";
    const orderQty = prompt(`কতটি "${product.name}" ${actionText} করবেন?\n(মিনিমাম: ${product.min_order_qty} টি)`);
    
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
        status: isOutOfStock ? 'preorder' : 'pending'
      }]);

      if (error) throw error;
      alert(`আপনার ${actionText} সফল হয়েছে!`);
      fetchMyOrders(user.id);
    } catch (err) {
      alert("সমস্যা হয়েছে: " + err.message);
    }
  };

  const downloadInvoice = (order) => {
    const doc = new jsPDF();
    doc.text("Business Order Memo", 105, 20, { align: "center" });
    doc.autoTable({
      startY: 40,
      head: [['Product Name', 'Quantity', 'Unit Price', 'Total']],
      body: [[order.product_name, order.quantity, `${order.total_price / order.quantity} TK`, `${order.total_price} TK`]],
    });
    doc.save(`Memo_${order.id.slice(0,5)}.pdf`);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-blue-600 font-bold uppercase text-xs">লোড হচ্ছে...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen text-black font-sans pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
            <User size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-blue-900 leading-tight">
                {user?.user_metadata?.full_name || 'ইউজার'}
              </h1>
              {/* স্ট্যাটাস ব্যাজ */}
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase border ${
                user?.user_metadata?.status === 'approved' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
              }`}>
                {user?.user_metadata?.status || 'Pending'}
              </span>
            </div>
            <p className="text-gray-500 font-medium text-xs md:text-sm italic">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all text-sm">
          <LogOut size={18} /> লগ-আউট
        </button>
      </header>

      {/* Trial Banner */}
      {user?.user_metadata?.status === 'pending' && (
        <div className="bg-blue-600 text-white p-4 mb-8 rounded-2xl shadow-xl flex items-center gap-3 animate-pulse">
          <Clock size={24} />
          <p className="text-sm font-bold uppercase tracking-tight">আপনি ১ ঘণ্টার ফ্রি ট্রায়ালে আছেন। স্থায়ী এক্সেসের জন্য ভেরিফিকেশন চলছে।</p>
        </div>
      )}

      {/* ক্যাটালগ এবং অর্ডারের গ্রিড (আপনার আগের ডিজাইনের মতোই থাকবে) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* আপনার আগের ক্যাটালগ রেন্ডারিং কোড এখানে থাকবে */}
          <div className="lg:col-span-2 space-y-6">
             <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 px-2 uppercase tracking-wide">
                <ShoppingBag className="text-blue-600" size={20} /> পাইকারি পণ্য তালিকা
             </h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {products.map((item) => (
                 <div key={item.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-all flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 line-clamp-1">{item.name}</h3>
                      <div className="text-2xl font-black text-blue-600 my-2">{item.price} ৳</div>
                      <div className="bg-gray-50 p-2 rounded-xl text-[10px] font-bold text-gray-500 mb-4 flex items-center gap-1">
                        <Info size={12}/> মিনিমাম অর্ডার: {item.min_order_qty} টি
                      </div>
                    </div>
                    <button onClick={() => handleOrder(item)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2">
                       <Package size={18} /> অর্ডার করুন
                    </button>
                 </div>
               ))}
             </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
             <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 px-2 uppercase tracking-wide">
                <ListOrdered className="text-blue-600" size={20} /> আমার অর্ডারসমূহ
             </h2>
             <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 space-y-4 max-h-[600px] overflow-y-auto">
                {myOrders.map((order) => (
                  <div key={order.id} className="p-4 border rounded-2xl bg-gray-50 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-xs text-gray-800 uppercase">{order.product_name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold">{order.quantity} টি | {order.total_price} ৳</p>
                    </div>
                    <button onClick={() => downloadInvoice(order)} className="text-blue-600 hover:scale-110 transition-transform">
                      <FileText size={18} />
                    </button>
                  </div>
                ))}
             </div>
          </div>
      </div>
    </div>
  );
}