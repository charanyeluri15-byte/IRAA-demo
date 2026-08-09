import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { Clock, ChefHat, CheckCircle2, Utensils, Bell } from 'lucide-react';

export default function OrderStatus() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [callingWaiter, setCallingWaiter] = useState(false);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/customer/order/${orderId}`);
      setOrder(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCallWaiter = async () => {
    try {
      setCallingWaiter(true);
      await api.post(`/customer/call-waiter/${order.restaurantId}/${order.tableId.tableNumber}`);
      alert("Waiter has been notified. Someone will be with you shortly.");
    } catch (err) {
      alert("Failed to call waiter.");
    } finally {
      setTimeout(() => setCallingWaiter(false), 3000);
    }
  };

  if (!order) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  const steps = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'];
  const currentStepIndex = steps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-lg border border-gray-100 p-8 mt-10">
         <div className="text-center mb-10 pb-6 border-b border-gray-100">
            <div className="inline-block bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-sm font-bold tracking-wide mb-3">Table {order.tableId?.tableNumber}</div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Order #{order._id.slice(-4).toUpperCase()}</h1>
         </div>

         <div className="space-y-8 pl-4">
            <div className={`flex items-center gap-6 ${currentStepIndex >= 0 ? 'text-blue-600' : 'text-gray-300'}`}>
               <Clock size={36} className={currentStepIndex === 0 ? 'animate-pulse text-blue-500' : ''} />
               <div>
                 <p className="font-bold text-lg text-gray-900">Order Placed</p>
                 <p className="text-sm text-gray-500">Waiting for restaurant to accept</p>
               </div>
            </div>
            
            <div className={`flex items-center gap-6 ${currentStepIndex >= 1 ? 'text-blue-600' : 'text-gray-300'}`}>
               <CheckCircle2 size={36} className={currentStepIndex === 1 ? 'text-blue-500' : ''} />
               <div>
                 <p className="font-bold text-lg text-gray-900">Accepted</p>
               </div>
            </div>

            <div className={`flex items-center gap-6 ${currentStepIndex >= 2 ? 'text-blue-600' : 'text-gray-300'}`}>
               <ChefHat size={36} className={currentStepIndex === 2 ? 'animate-pulse text-blue-500' : ''} />
               <div>
                 <p className="font-bold text-lg text-gray-900">Preparing</p>
                 <p className="text-sm text-gray-500">Your food is being cooked</p>
               </div>
            </div>

            <div className={`flex items-center gap-6 ${currentStepIndex >= 3 ? 'text-green-500' : 'text-gray-300'}`}>
               <Utensils size={36} className={currentStepIndex === 3 ? 'animate-bounce text-green-500' : ''} />
               <div>
                 <p className="font-bold text-lg text-gray-900">Ready!</p>
                 <p className="text-sm text-gray-500">Your order is being served.</p>
               </div>
            </div>

            <div className={`flex items-center gap-6 ${currentStepIndex >= 4 ? 'text-green-600' : 'text-gray-300'}`}>
               <CheckCircle2 size={36} className={currentStepIndex === 4 ? 'animate-bounce text-green-600' : ''} />
               <div>
                 <p className="font-bold text-lg text-gray-900">Served</p>
                 <p className="text-sm text-gray-500">Enjoy your meal!</p>
               </div>
            </div>
         </div>

         <div className="mt-12 bg-gray-50 p-6 rounded-2xl border border-gray-100">
           <h3 className="font-bold text-gray-900 mb-4 tracking-tight">Receipt Summary</h3>
           <div className="space-y-3 text-sm text-gray-600">
             {order.items.map((item, idx) => (
               <div key={idx} className="flex justify-between font-medium">
                 <span><span className="text-gray-400 mr-2">{item.quantity}x</span> {item.name}</span>
                 <span className="text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
               </div>
             ))}
             <div className="flex justify-between font-black text-gray-900 text-lg border-t border-gray-200 pt-3 mt-4">
               <span>Total</span>
               <span>₹{order.totalAmount.toFixed(2)}</span>
             </div>
             <div className="flex justify-between font-medium text-xs mt-3 bg-white p-2 rounded-lg border border-gray-200">
               <span className="text-gray-500">Payment Status</span>
               <span className={order.paymentStatus === 'PAID' ? 'text-green-600 font-bold' : 'text-orange-500 font-bold'}>{order.paymentStatus}</span>
             </div>
           </div>
         </div>
      </div>

      <button 
        onClick={handleCallWaiter}
        disabled={callingWaiter}
        className="fixed bottom-6 right-4 z-40 bg-gray-800 text-white p-4 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform disabled:bg-gray-400"
      >
        <Bell size={24} />
      </button>
    </div>
  );
}
