import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { io } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';
import { Clock, CheckCircle, Bell, Utensils, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WaiterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assistanceRequests, setAssistanceRequests] = useState([]);

  useEffect(() => {
    fetchOrders();

    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    socket.emit('joinRestaurantRoom', user.restaurantId);

    socket.on('newOrder', (order) => {
      setActiveOrders(prev => [order, ...prev]);
    });

    socket.on('orderUpdated', (updatedOrder) => {
      setActiveOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    });

    socket.on('customerAssistance', (data) => {
      setAssistanceRequests(prev => [...prev, data]);
      // Also maybe play a sound or just show in UI
    });

    return () => socket.disconnect();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/waiter/orders/active');
      setActiveOrders(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleServe = async (orderId) => {
    try {
      await api.patch(`/waiter/order/${orderId}/serve`);
      fetchOrders(); // refresh
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to serve');
    }
  };

  if (loading) return <div className="text-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>;

  const readyOrders = activeOrders.filter(o => o.status === 'READY');
  const preparingOrders = activeOrders.filter(o => ['ACCEPTED', 'PREPARING'].includes(o.status));
  const newOrders = activeOrders.filter(o => o.status === 'PLACED');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <div className="bg-blue-100 text-blue-600 p-2 rounded-full mb-2"><Utensils size={24}/></div>
          <span className="text-3xl font-black text-gray-800">{activeOrders.length}</span>
          <span className="text-xs font-bold text-gray-500 uppercase">Active Orders</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
          {readyOrders.length > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 rounded-bl-full -z-0"></div>}
          <div className="bg-green-100 text-green-600 p-2 rounded-full mb-2 z-10"><CheckCircle size={24}/></div>
          <span className="text-3xl font-black text-gray-800 z-10">{readyOrders.length}</span>
          <span className="text-xs font-bold text-gray-500 uppercase z-10">Ready to Serve</span>
        </div>
      </div>

      <h2 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
        <AlertTriangle size={18} className="text-orange-500" /> Action Required
      </h2>

      {assistanceRequests.length > 0 && (
        <div className="space-y-3 mb-4">
          {assistanceRequests.map((req, idx) => (
            <div key={idx} className="bg-red-500 text-white p-4 rounded-xl shadow-sm flex justify-between items-center animate-bounce">
              <div>
                <p className="font-bold">Table {req.tableNumber} needs assistance!</p>
                <p className="text-xs text-red-100">{new Date(req.timestamp).toLocaleTimeString()}</p>
              </div>
              <button 
                onClick={() => setAssistanceRequests(prev => prev.filter((_, i) => i !== idx))}
                className="bg-white text-red-600 px-3 py-1.5 rounded-lg font-bold text-sm"
              >
                Clear
              </button>
            </div>
          ))}
        </div>
      )}
      
      {readyOrders.length === 0 && assistanceRequests.length === 0 && <div className="bg-gray-100 p-4 rounded-xl text-center text-sm text-gray-500">No orders ready to serve.</div>}

      <div className="space-y-3">
        {readyOrders.map(order => (
          <div key={order._id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded">Table {order.tableId?.tableNumber}</span>
                <p className="text-xs text-gray-500 mt-1">Order #{order._id.slice(-4).toUpperCase()}</p>
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded animate-pulse">READY</span>
            </div>
            <button 
              onClick={() => handleServe(order._id)}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-bold shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <CheckCircle size={20} /> MARK AS SERVED
            </button>
          </div>
        ))}
      </div>

      <h2 className="font-bold text-gray-800 mt-6 mb-2 flex items-center gap-2">
        <Clock size={18} className="text-blue-500" /> In Kitchen
      </h2>

      {preparingOrders.length === 0 && newOrders.length === 0 && <div className="bg-gray-100 p-4 rounded-xl text-center text-sm text-gray-500">No orders in kitchen.</div>}

      <div className="space-y-3">
        {[...newOrders, ...preparingOrders].map(order => (
          <div key={order._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <div>
                <p className="font-bold text-gray-800 text-lg">Table {order.tableId?.tableNumber}</p>
                <p className="text-xs text-gray-500">Order #{order._id.slice(-4).toUpperCase()}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full tracking-wide uppercase ${
                order.status === 'PLACED' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 
                order.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
                'bg-purple-100 text-purple-800 border border-purple-200'
              }`}>
                {order.status}
              </span>
            </div>
            
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="font-bold text-gray-700 bg-gray-100 px-2 rounded">{item.quantity}x</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800 leading-tight">{item.name}</p>
                    {item.notes && <p className="text-[11px] text-orange-600 mt-0.5 leading-tight italic">{item.notes}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-100">
               <button onClick={() => navigate(`/waiter/order/${order.tableId?._id}`)} className="w-full text-center text-sm font-bold text-blue-600 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                 Edit Order
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
