import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ShoppingCart, Plus, Minus, ArrowRight, Bell } from 'lucide-react';

export default function CustomerMenu() {
  const { restaurantId, tableNumber } = useParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [table, setTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [callingWaiter, setCallingWaiter] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tableRes, menuRes] = await Promise.all([
          api.get(`/customer/table/${restaurantId}/${tableNumber}`),
          api.get(`/customer/menu/${restaurantId}`)
        ]);
        setTable(tableRes.data);
        setMenu(menuRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading menu. Please check QR code.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [restaurantId, tableNumber]);

  const addToCart = (item) => {
    const existing = cart.find(c => c.menuItemId === item._id);
    if (existing) {
      setCart(cart.map(c => c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { menuItemId: item._id, name: item.name, price: item.sellingPrice, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existing = cart.find(c => c.menuItemId === itemId);
    if (existing.quantity === 1) {
      setCart(cart.filter(c => c.menuItemId !== itemId));
    } else {
      setCart(cart.map(c => c.menuItemId === itemId ? { ...c, quantity: c.quantity - 1 } : c));
    }
  };

  const getQuantity = (itemId) => {
    const item = cart.find(c => c.menuItemId === itemId);
    return item ? item.quantity : 0;
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    try {
      const { data } = await api.post('/customer/order', {
        restaurantId,
        tableId: table._id,
        items: cart,
        customerName: 'Guest'
      });
      setCart([]);
      navigate(`/order/${data._id}/status`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order');
    }
  };

  const handleCallWaiter = async () => {
    try {
      setCallingWaiter(true);
      await api.post(`/customer/call-waiter/${restaurantId}/${tableNumber}`);
      alert("Waiter has been notified. Someone will be with you shortly.");
    } catch (err) {
      alert("Failed to call waiter.");
    } finally {
      setTimeout(() => setCallingWaiter(false), 3000);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (error) return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-white shadow-sm p-5 sticky top-0 z-10 text-center border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Table {tableNumber}</h1>
        <p className="text-sm text-gray-500 mt-1">Tap items to add to your order</p>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6 mt-2">
        {menu.map(category => (
          <div key={category._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">{category.name}</h2>
             </div>
             <div className="divide-y divide-gray-50">
               {category.items.length === 0 && <p className="p-5 text-gray-400 text-sm italic">No items available.</p>}
               {category.items.map(item => (
                 <div key={item._id} className="p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div className="flex-1 pr-4">
                      <h3 className="font-semibold text-gray-900 text-lg leading-tight">{item.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                      <p className="text-green-600 font-bold mt-2 text-lg">₹{item.sellingPrice}</p>
                    </div>
                    <div className="flex items-center gap-3">
                       {getQuantity(item._id) > 0 ? (
                         <div className="flex items-center bg-gray-100 rounded-full shadow-inner border border-gray-200">
                           <button onClick={() => removeFromCart(item._id)} className="p-3 text-gray-600 hover:text-black transition-colors"><Minus size={18}/></button>
                           <span className="font-bold w-6 text-center text-gray-900">{getQuantity(item._id)}</span>
                           <button onClick={() => addToCart(item)} className="p-3 text-gray-600 hover:text-black transition-colors"><Plus size={18}/></button>
                         </div>
                       ) : (
                         <button onClick={() => addToCart(item)} className="bg-white border border-blue-200 text-blue-600 px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm">
                           Add
                         </button>
                       )}
                    </div>
                 </div>
               ))}
             </div>
          </div>
        ))}
      </div>

      {/* Call Waiter Floating Button */}
      <button 
        onClick={handleCallWaiter}
        disabled={callingWaiter}
        className="fixed bottom-24 right-4 z-40 bg-gray-800 text-white p-3 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform disabled:bg-gray-400"
      >
        <Bell size={24} />
      </button>

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
           <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div>
                 <p className="text-sm font-medium text-gray-500">{cartCount} {cartCount === 1 ? 'item' : 'items'}</p>
                 <p className="text-2xl font-black text-gray-900">₹{cartTotal.toFixed(2)}</p>
              </div>
              <button 
                onClick={placeOrder}
                className="bg-blue-600 text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all flex items-center gap-2 transform active:scale-95"
              >
                Place Order <ArrowRight size={20} />
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
