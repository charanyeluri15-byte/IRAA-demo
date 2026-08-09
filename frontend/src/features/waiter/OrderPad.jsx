import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../auth/AuthContext';
import { ArrowLeft, Search, Plus, Minus, FileText, Send, Trash2, Edit } from 'lucide-react';

export default function OrderPad() {
  const { tableId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [table, setTable] = useState(null);
  const [menu, setMenu] = useState([]);
  const [order, setOrder] = useState(null); // Existing order if any
  const [cart, setCart] = useState([]); // Current items being added/edited
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  
  const [notesModal, setNotesModal] = useState({ isOpen: false, itemIndex: null, notes: '' });

  useEffect(() => {
    fetchData();
  }, [tableId]);

  const fetchData = async () => {
    try {
      // Fetch table status to see if there's an active order
      const tableRes = await api.get('/waiter/tables');
      const currentTable = tableRes.data.find(t => t._id === tableId);
      setTable(currentTable);

      // Fetch Menu
      const menuRes = await api.get(`/customer/menu/${user.restaurantId}`);
      setMenu(menuRes.data);

      if (currentTable?.currentOrderId) {
        // Fetch existing active order
        const orderRes = await api.get(`/customer/order/${currentTable.currentOrderId}`);
        setOrder(orderRes.data);
        
        // If order is PLACED, we can edit it directly in cart.
        if (orderRes.data.status === 'PLACED') {
          setCart(orderRes.data.items.map(i => ({
            ...i,
            _id: i.menuItemId,
            sellingPrice: i.price
          })));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === item._id && (i.notes || '') === '');
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, notes: '' }];
    });
  };

  const updateQuantity = (index, delta) => {
    setCart(prev => {
      const newCart = [...prev];
      if (newCart[index].quantity + delta > 0) {
        newCart[index].quantity += delta;
      } else {
        newCart.splice(index, 1);
      }
      return newCart;
    });
  };

  const saveNotes = () => {
    setCart(prev => {
      const newCart = [...prev];
      newCart[notesModal.itemIndex].notes = notesModal.notes;
      return newCart;
    });
    setNotesModal({ isOpen: false, itemIndex: null, notes: '' });
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    
    const payload = {
      tableId,
      items: cart.map(i => ({ menuItemId: i._id, quantity: i.quantity, notes: i.notes || '' }))
    };

    try {
      if (order && order.status === 'PLACED') {
        // Edit existing order
        await api.put(`/waiter/order/${order._id}`, payload);
      } else if (!order) {
        // New order
        await api.post('/waiter/order', payload);
      } else {
        alert("Cannot modify this order anymore. It's already in the kitchen.");
        return;
      }
      navigate('/waiter');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit order');
    }
  };

  const handleRequestBill = async () => {
    if (!order) return;
    try {
      await api.post(`/waiter/order/${order._id}/bill`);
      alert("Bill requested!");
      navigate('/waiter');
    } catch (err) {
      alert("Failed to request bill");
    }
  };

  if (loading) return <div className="text-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>;

  const total = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const isEditingLocked = order && !['PLACED'].includes(order.status);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/waiter/tables')} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-bold text-gray-800">Table {table?.tableNumber}</h2>
        {order && <span className="ml-auto text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">{order.status}</span>}
      </div>

      {!isEditingLocked && (
        <>
          {/* Menu Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Categories */}
          <div className="flex overflow-x-auto gap-2 pb-2 mb-2 scrollbar-hide">
            <button 
              onClick={() => setActiveCategory('All')}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors ${activeCategory === 'All' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
              All
            </button>
            {menu.map(cat => (
              <button 
                key={cat._id}
                onClick={() => setActiveCategory(cat._id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors ${activeCategory === cat._id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Menu Items List */}
          <div className="flex-1 overflow-y-auto mb-4 bg-white rounded-xl shadow-sm border border-gray-100 p-2 space-y-2">
            {menu.map(cat => {
              if (activeCategory !== 'All' && activeCategory !== cat._id) return null;
              const items = cat.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
              if (items.length === 0) return null;
              
              return (
                <div key={cat._id} className="mb-4">
                  <h3 className="font-bold text-gray-800 px-2 mb-2 sticky top-0 bg-white/90 backdrop-blur-sm z-10 py-1">{cat.name}</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {items.map(item => (
                      <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 active:bg-gray-100 transition-colors" onClick={() => addToCart(item)}>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">₹{item.sellingPrice}</p>
                        </div>
                        <button className="p-1.5 bg-blue-100 text-blue-600 rounded-md"><Plus size={16}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Cart View */}
      <div className={`bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-gray-200 flex flex-col transition-all duration-300 ${isEditingLocked ? 'flex-1' : 'h-64'}`}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl">
          <h3 className="font-bold text-gray-800">Current Order {isEditingLocked && '(Locked)'}</h3>
          <span className="font-black text-blue-600 text-lg">₹{isEditingLocked && order ? order.totalAmount : total}</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isEditingLocked && order ? (
            order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800 text-sm"><span className="text-gray-500 mr-2">{item.quantity}x</span> {item.name}</p>
                  {item.notes && <p className="text-xs text-orange-500 ml-6 flex items-center gap-1"><FileText size={12}/> {item.notes}</p>}
                </div>
                <p className="font-medium text-sm text-gray-600">₹{item.price * item.quantity}</p>
              </div>
            ))
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex flex-col items-center bg-gray-100 rounded-lg border border-gray-200">
                  <button onClick={() => updateQuantity(idx, 1)} className="p-1 text-gray-600 active:text-blue-600"><Plus size={14}/></button>
                  <span className="font-bold text-sm py-1 w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(idx, -1)} className="p-1 text-gray-600 active:text-red-600"><Minus size={14}/></button>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm leading-tight">{item.name}</p>
                  <p className="font-medium text-blue-600 text-xs">₹{item.sellingPrice}</p>
                  {item.notes && <p className="text-[10px] text-orange-500 mt-0.5 leading-tight line-clamp-1">{item.notes}</p>}
                </div>
                <button 
                  onClick={() => setNotesModal({ isOpen: true, itemIndex: idx, notes: item.notes || '' })}
                  className={`p-2 rounded-full ${item.notes ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}
                >
                  <Edit size={16}/>
                </button>
              </div>
            ))
          )}
          {!isEditingLocked && cart.length === 0 && <p className="text-center text-sm text-gray-400 py-4">No items added yet</p>}
        </div>

        <div className="p-4 bg-white border-t border-gray-100 flex gap-3 pb-safe">
          {isEditingLocked ? (
            <button 
              onClick={handleRequestBill}
              className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <FileText size={20} /> Request Bill
            </button>
          ) : (
            <button 
              onClick={handleSubmitOrder}
              disabled={cart.length === 0}
              className="flex-1 bg-blue-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Send size={20} /> {order ? 'Update Order' : 'Send to Kitchen'}
            </button>
          )}
        </div>
      </div>

      {/* Notes Modal */}
      {notesModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-6 pb-12">
            <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2"><FileText size={20}/> Special Instructions</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {['No Onion', 'Less Spicy', 'Extra Cheese', 'Less Oil', 'No Garlic'].map(note => (
                <button 
                  key={note}
                  onClick={() => setNotesModal(prev => ({ ...prev, notes: prev.notes ? `${prev.notes}, ${note}` : note }))}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 text-sm rounded-full font-medium transition-colors"
                >
                  + {note}
                </button>
              ))}
            </div>
            <textarea
              value={notesModal.notes}
              onChange={(e) => setNotesModal({...notesModal, notes: e.target.value})}
              placeholder="Type any other instructions..."
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 min-h-[100px] mb-4 text-sm"
            ></textarea>
            <div className="flex gap-3">
              <button onClick={() => setNotesModal({ isOpen: false, itemIndex: null, notes: '' })} className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={saveNotes} className="flex-1 py-3 text-white font-bold bg-blue-600 rounded-xl">Save Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
