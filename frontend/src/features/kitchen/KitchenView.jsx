import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../auth/AuthContext';
import { io } from 'socket.io-client';
import { Clock, AlertCircle } from 'lucide-react';

export default function KitchenView() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    fetchOrders();
    
    // Timer to trigger re-renders every 30 seconds for live order timers
    const timerInterval = setInterval(() => {
      setNow(Date.now());
    }, 30000);

    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    socket.emit('joinRestaurantRoom', user.restaurantId);

    socket.on('newOrder', (order) => {
      setOrders(prev => [...prev, order]);
    });

    socket.on('orderUpdated', (updatedOrder) => {
      setOrders(prev => {
        if (updatedOrder.status === 'COMPLETED' || updatedOrder.status === 'CANCELLED') {
           return prev.filter(o => o._id !== updatedOrder._id);
        }
        return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
      });
    });

    return () => {
      clearInterval(timerInterval);
      socket.disconnect();
    };
  }, [user.restaurantId]);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/staff/orders/active');
      setOrders(data);
    } catch (err) { console.error(err); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/staff/orders/${id}/status`, { status });
    } catch (err) { console.error(err); }
  };

  const kitchenOrders = orders.filter(o => ['PLACED', 'ACCEPTED', 'PREPARING'].includes(o.status));

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-bold text-gray-800">Kitchen Display System</h2>
         <div className="flex gap-4">
           <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-3 h-3 rounded-full bg-red-100 border border-red-400 inline-block"></span> &gt; 15 mins</div>
           <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-3 h-3 rounded-full bg-orange-100 border border-orange-400 inline-block"></span> &gt; 10 mins</div>
           <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-3 h-3 rounded-full bg-white border border-gray-200 inline-block"></span> On time</div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
         {kitchenOrders.map(order => {
           const orderTime = new Date(order.createdAt).getTime();
           const elapsedMinutes = Math.floor((now - orderTime) / 60000);
           
           let delayClass = 'bg-white border-gray-200';
           if (elapsedMinutes >= 15) {
             delayClass = 'bg-red-50 border-red-300 ring-2 ring-red-200 shadow-md';
           } else if (elapsedMinutes >= 10) {
             delayClass = 'bg-orange-50 border-orange-300 shadow-sm';
           }

           return (
             <div key={order._id} className={`rounded-xl shadow-sm border overflow-hidden flex flex-col transition-colors ${delayClass}`}>
                <div className={`p-4 border-b flex justify-between items-center ${elapsedMinutes >= 15 ? 'bg-red-100 border-red-200' : elapsedMinutes >= 10 ? 'bg-orange-100 border-orange-200' : 'bg-gray-50 border-gray-100'}`}>
                   <div>
                     <h3 className="font-bold text-gray-900 text-lg">
                       {order.orderType === 'EXTERNAL' ? `Delivery: ${order.externalPlatform}` : order.orderType === 'PARCEL' ? 'Takeaway / Parcel' : `Table ${order.tableId?.tableNumber}`}
                     </h3>
                     <p className="text-xs text-gray-600 font-mono">
                        #{order._id.slice(-4).toUpperCase()}
                        {order.externalOrderId && ` • Ext ID: ${order.externalOrderId}`}
                     </p>
                   </div>
                   <div className="text-right flex flex-col items-end gap-1">
                     <span className={`px-2 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${
                       order.status === 'PLACED' ? 'bg-yellow-200 text-yellow-900' :
                       order.status === 'ACCEPTED' ? 'bg-blue-200 text-blue-900' :
                       'bg-purple-200 text-purple-900'
                     }`}>
                       {order.status}
                     </span>
                     
                     {order.orderType === 'EXTERNAL' && (
                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${order.externalPlatform === 'SWIGGY' ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                           {order.externalPlatform}
                        </div>
                     )}
                     {order.orderType === 'PARCEL' && (
                        <div className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-purple-100 text-purple-800 border border-purple-200">
                           PARCEL
                        </div>
                     )}
                     <div className={`text-xs font-bold flex items-center gap-1 ${elapsedMinutes >= 15 ? 'text-red-700' : elapsedMinutes >= 10 ? 'text-orange-700' : 'text-gray-500'}`}>
                       <Clock size={12} /> {elapsedMinutes} min{elapsedMinutes !== 1 && 's'}
                     </div>
                   </div>
                </div>
                <div className="p-5 flex-1">
                   {elapsedMinutes >= 15 && (
                     <div className="mb-4 text-xs font-bold text-red-600 flex items-center gap-1 bg-red-100 px-3 py-1.5 rounded-md">
                       <AlertCircle size={14} /> This order is heavily delayed!
                     </div>
                   )}
                   <ul className="space-y-4">
                     {order.items.map((item, idx) => (
                       <li key={idx} className="flex text-gray-800 font-medium items-start gap-3">
                         <span className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-md text-gray-800 font-bold shrink-0">{item.quantity}</span> 
                         <span className="flex-1 pt-1 text-lg">{item.name}</span>
                       </li>
                     ))}
                   </ul>
                </div>
                <div className={`p-4 border-t flex gap-2 ${elapsedMinutes >= 15 ? 'bg-red-50 border-red-200' : elapsedMinutes >= 10 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'}`}>
                   {order.status === 'PLACED' && (
                     <button onClick={() => updateStatus(order._id, 'ACCEPTED')} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold shadow-sm hover:bg-blue-700 transition-colors text-lg">Accept Order</button>
                   )}
                   {order.status === 'ACCEPTED' && (
                     <button onClick={() => updateStatus(order._id, 'PREPARING')} className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-bold shadow-sm hover:bg-purple-700 transition-colors text-lg">Start Cooking</button>
                   )}
                   {order.status === 'PREPARING' && (
                     <button onClick={() => updateStatus(order._id, 'READY')} className="flex-1 bg-green-500 text-white py-3 rounded-lg font-bold shadow-sm hover:bg-green-600 transition-colors text-lg">Mark Ready to Serve</button>
                   )}
                </div>
             </div>
           );
         })}
         {kitchenOrders.length === 0 && (
           <div className="col-span-full flex flex-col items-center justify-center py-32 text-gray-400">
              <Clock size={64} className="mb-4 text-gray-300" />
              <p className="text-xl font-medium">No active kitchen orders</p>
           </div>
         )}
      </div>
    </div>
  );
}
