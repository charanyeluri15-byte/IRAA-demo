import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ShoppingCart, Plus, Minus, Search, Trash2, Send } from 'lucide-react';

export default function NewOrderForm({ onOrderCreated }) {
  const [orderType, setOrderType] = useState('DINE_IN'); // DINE_IN, PARCEL, SWIGGY, ZOMATO
  
  // Data
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  
  // Form State
  const [tableId, setTableId] = useState('');
  const [externalOrderId, setExternalOrderId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID'); // Paid Online (PAID) or Cash on Delivery (PENDING)
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  
  // Cart State
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [menuRes, tablesRes] = await Promise.all([
        api.get('/menu/items'),
        api.get('/waiter/tables') // Assuming waiter/tables returns table list
      ]);
      setMenuItems(menuRes.data.filter(i => i.isAvailable));
      setTables(tablesRes.data);
    } catch (err) {
      console.error('Failed to fetch data for new order', err);
    }
  };

  const filteredMenu = menuItems.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item._id);
      if (existing) {
        return prev.map(i => i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItemId: item._id, name: item.name, price: item.sellingPrice, quantity: 1, notes: '' }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.menuItemId === id) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i.menuItemId !== id));
  };
  
  const updateNotes = (id, notes) => {
    setCart(prev => prev.map(i => i.menuItemId === id ? { ...i, notes } : i));
  };

  const handleOrderTypeChange = (type) => {
    setOrderType(type);
    if (type === 'DINE_IN') {
      setPaymentStatus('PENDING');
    } else {
      setPaymentStatus('PAID');
    }
  };

  const handleSubmit = async () => {
    if (cart.length === 0) return alert('Add items to the order');
    if (orderType === 'DINE_IN' && !tableId) return alert('Select a table');
    if ((orderType === 'SWIGGY' || orderType === 'ZOMATO') && !externalOrderId) return alert('External Order ID is required');

    let payloadOrderType = 'DINE_IN';
    let payloadOrderSource = 'DINE_IN';
    let externalPlatform = null;

    if (orderType === 'PARCEL') {
      payloadOrderType = 'PARCEL';
      payloadOrderSource = 'PARCEL';
    } else if (orderType === 'SWIGGY') {
      payloadOrderType = 'EXTERNAL';
      payloadOrderSource = 'SWIGGY';
      externalPlatform = 'SWIGGY';
    } else if (orderType === 'ZOMATO') {
      payloadOrderType = 'EXTERNAL';
      payloadOrderSource = 'ZOMATO';
      externalPlatform = 'ZOMATO';
    }

    try {
      await api.post('/staff/orders', {
        orderType: payloadOrderType,
        orderSource: payloadOrderSource,
        externalOrderId: orderType === 'SWIGGY' || orderType === 'ZOMATO' ? externalOrderId : undefined,
        externalPlatform,
        tableId: orderType === 'DINE_IN' ? tableId : undefined,
        customerName,
        customerPhone,
        paymentStatus,
        paymentMethod: paymentStatus === 'PAID' ? paymentMethod : undefined,
        items: cart
      });
      onOrderCreated();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create order');
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="h-full flex gap-6 p-4">
      {/* Left: Form & Menu */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Order Type Selector */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex-shrink-0">
          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Select Order Type</label>
          <div className="flex gap-4">
            {['DINE_IN', 'PARCEL', 'SWIGGY', 'ZOMATO'].map(type => (
              <button
                key={type}
                onClick={() => handleOrderTypeChange(type)}
                className={`flex-1 py-3 rounded-lg border-2 font-bold transition-all ${
                  orderType === type 
                    ? type === 'SWIGGY' ? 'border-orange-500 bg-orange-50 text-orange-700' :
                      type === 'ZOMATO' ? 'border-red-500 bg-red-50 text-red-700' :
                      'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {type.replace('_', '-')}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Fields */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 grid grid-cols-2 gap-4 flex-shrink-0">
          
          {orderType === 'DINE_IN' && (
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">Select Table *</label>
              <select 
                value={tableId} onChange={e => setTableId(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 focus:border-blue-500 outline-none"
              >
                <option value="">-- Choose Table --</option>
                {tables.map(t => <option key={t._id} value={t._id}>Table {t.tableNumber}</option>)}
              </select>
            </div>
          )}

          {(orderType === 'SWIGGY' || orderType === 'ZOMATO') && (
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">External Order ID *</label>
              <input 
                type="text" value={externalOrderId} onChange={e => setExternalOrderId(e.target.value)}
                placeholder={`e.g. ${orderType}-123456`}
                className="w-full border border-gray-300 rounded p-2 focus:border-blue-500 outline-none"
              />
            </div>
          )}

          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-bold text-gray-700 mb-1">Customer Name (Optional)</label>
            <input 
              type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
              placeholder="Name"
              className="w-full border border-gray-300 rounded p-2 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-bold text-gray-700 mb-1">Customer Phone (Optional)</label>
            <input 
              type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
              placeholder="Phone"
              className="w-full border border-gray-300 rounded p-2 focus:border-blue-500 outline-none"
            />
          </div>

          {orderType !== 'DINE_IN' && (
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Payment Status</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={paymentStatus === 'PAID'} onChange={() => setPaymentStatus('PAID')} className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-700">Paid (Cash / Online)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={paymentStatus === 'PENDING'} onChange={() => setPaymentStatus('PENDING')} className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-700">Pay on Delivery / Pickup (Pending)</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Menu Search */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col h-full min-h-[300px]">
          <div className="relative mb-4 flex-shrink-0">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search menu items..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex-1 overflow-auto grid grid-cols-2 lg:grid-cols-3 gap-3 pr-2">
            {filteredMenu.map(item => (
              <button 
                key={item._id}
                onClick={() => addToCart(item)}
                className="text-left p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-sm transition-all flex flex-col justify-between h-24 bg-gray-50"
              >
                <span className="font-bold text-gray-800 line-clamp-2">{item.name}</span>
                <span className="text-blue-600 font-black">₹{item.sellingPrice.toFixed(2)}</span>
              </button>
            ))}
            {filteredMenu.length === 0 && <div className="col-span-full text-center text-gray-500 py-8">No items found</div>}
          </div>
        </div>

      </div>

      {/* Right: Cart */}
      <div className="w-96 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full flex-shrink-0">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between rounded-t-xl flex-shrink-0">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart size={18} className="text-blue-600"/> Current Order
          </h2>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{cart.length} items</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart size={48} className="mb-2 text-gray-200" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.menuItemId} className="border border-gray-100 rounded-lg p-3 shadow-sm flex flex-col gap-2 bg-white">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-gray-800 pr-2 leading-tight">{item.name}</div>
                  <div className="font-black text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</div>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-3 bg-gray-100 rounded-lg border border-gray-200 p-1">
                    <button onClick={() => updateQuantity(item.menuItemId, -1)} className="p-1 hover:bg-white rounded text-gray-600"><Minus size={14}/></button>
                    <span className="font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.menuItemId, 1)} className="p-1 hover:bg-white rounded text-gray-600"><Plus size={14}/></button>
                  </div>
                  <button onClick={() => removeFromCart(item.menuItemId)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16}/></button>
                </div>
                <input 
                  type="text" 
                  placeholder="Special instructions (e.g. Less spicy)" 
                  value={item.notes}
                  onChange={(e) => updateNotes(item.menuItemId, e.target.value)}
                  className="w-full text-xs p-2 border border-gray-200 rounded bg-gray-50 mt-1 focus:border-blue-400 outline-none"
                />
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600 font-bold">Total Amount</span>
            <span className="text-2xl font-black text-green-600">₹{total.toFixed(2)}</span>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-lg shadow-sm hover:bg-blue-700 hover:shadow disabled:opacity-50 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            <Send size={20} />
            Send to Kitchen
          </button>
        </div>
      </div>
    </div>
  );
}
