import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../auth/AuthContext';
import { io } from 'socket.io-client';
import { IndianRupee, CheckCircle, Printer, XCircle, Clock, History, PlusCircle } from 'lucide-react';
import NewOrderForm from './NewOrderForm';

export default function CashierView() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [restaurantProfile, setRestaurantProfile] = useState(null);

  // Modal States
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  
  // Cancel State
  const [cancelingOrder, setCancelingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const receiptRef = useRef();

  useEffect(() => {
    fetchOrders();
    fetchProfile();
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    socket.emit('joinRestaurantRoom', user.restaurantId);

    socket.on('newOrder', (order) => setOrders(prev => [...prev, order]));
    socket.on('orderUpdated', (updatedOrder) => {
      setOrders(prev => {
        if (updatedOrder.status === 'COMPLETED' || updatedOrder.status === 'CANCELLED') {
           // Also fetch history if tab is history
           if (activeTab === 'history') fetchHistory();
           return prev.filter(o => o._id !== updatedOrder._id);
        }
        return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
      });
    });

    return () => socket.disconnect();
  }, [user.restaurantId, activeTab]);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/staff/orders/active');
      setOrders(data);
    } catch (err) { console.error(err); }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/staff/orders/history');
      setHistoryOrders(data);
    } catch (err) { console.error(err); }
  };

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/restaurant/profile');
      setRestaurantProfile(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const completeOrder = async () => {
    if (!checkoutOrder) return;
    try {
      const { data } = await api.patch(`/staff/orders/${checkoutOrder._id}/status`, { 
        status: 'COMPLETED', 
        paymentStatus: 'PAID',
        paymentMethod: paymentMethod 
      });
      
      // Print receipt immediately after checkout
      window.open(`/receipt/${checkoutOrder._id}`, '_blank');
      setCheckoutOrder(null);

    } catch (err) { console.error(err); alert('Failed to settle bill'); }
  };

  const dispatchOrder = async (orderId) => {
    try {
      await api.patch(`/staff/orders/${orderId}/status`, {
        status: 'COMPLETED'
      });
      window.open(`/receipt/${orderId}`, '_blank');
    } catch (err) { console.error(err); alert('Failed to dispatch order'); }
  };

  const cancelOrder = async () => {
    if (!cancelingOrder) return;
    try {
      await api.patch(`/staff/orders/${cancelingOrder._id}/cancel`, {
        cancellationReason: cancelReason
      });
      setCancelingOrder(null);
      setCancelReason('');
    } catch (err) { console.error(err); alert(err.response?.data?.message || 'Failed to cancel order'); }
  };

  const printReceipt = (order) => {
    window.open(`/receipt/${order._id}`, '_blank');
  };



  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full print:hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><IndianRupee className="text-blue-600" /> Cashier Desk</h2>
          <div className="flex bg-gray-100 p-1 rounded-md">
            <button 
              onClick={() => setActiveTab('new')} 
              className={`px-4 py-1.5 text-sm font-medium rounded flex items-center gap-2 ${activeTab === 'new' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <PlusCircle size={16} /> New Order
            </button>
            <button 
              onClick={() => setActiveTab('active')} 
              className={`px-4 py-1.5 text-sm font-medium rounded ${activeTab === 'active' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Active Orders
            </button>
            <button 
              onClick={() => setActiveTab('history')} 
              className={`px-4 py-1.5 text-sm font-medium rounded ${activeTab === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Order History
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {activeTab === 'new' && (
            <NewOrderForm onOrderCreated={() => setActiveTab('active')} />
          )}
          
          {activeTab === 'active' && (
            <div className="h-full overflow-auto p-4">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold rounded-t-lg sticky top-0">
                <tr>
                  <th className="px-4 py-4 rounded-tl-lg">Order ID</th>
                  <th className="px-4 py-4">Table</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Total</th>
                  <th className="px-4 py-4 rounded-tr-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 font-mono text-gray-600">#{order._id.slice(-4).toUpperCase()}</td>
                    <td className="px-4 py-4 font-bold text-gray-900">
                      {order.orderType === 'DINE_IN' ? `Table ${order.tableId?.tableNumber}` : order.orderType}
                    </td>
                    <td className="px-4 py-4">
                       <span className={`px-2 py-1 rounded text-xs font-bold tracking-wide uppercase ${
                         ['READY', 'SERVED'].includes(order.status) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                       }`}>{order.status}</span>
                       
                       {order.orderType === 'EXTERNAL' && (
                          <div className={`mt-1 text-[10px] font-bold px-1 py-0.5 rounded inline-block ${order.externalPlatform === 'SWIGGY' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                             {order.externalPlatform}
                          </div>
                       )}
                       {order.orderType === 'PARCEL' && (
                          <div className="mt-1 text-[10px] font-bold px-1 py-0.5 rounded inline-block bg-purple-100 text-purple-800">
                             PARCEL
                          </div>
                       )}
                    </td>
                    <td className="px-4 py-4 font-black text-gray-900 text-base">₹{order.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => setCancelingOrder(order)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors" title="Cancel Order">
                        <XCircle size={18} />
                      </button>
                      {['READY', 'SERVED'].includes(order.status) && order.paymentStatus === 'PENDING' && (
                        <button 
                          onClick={() => setCheckoutOrder(order)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 hover:shadow transition-all font-bold flex items-center gap-2"
                        >
                          <CheckCircle size={18}/> Checkout
                        </button>
                      )}
                      {['READY', 'SERVED'].includes(order.status) && order.paymentStatus === 'PAID' && (
                        <button 
                          onClick={() => dispatchOrder(order._id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 hover:shadow transition-all font-bold flex items-center gap-2"
                        >
                          <CheckCircle size={18}/> Dispatch / Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan="5" className="px-4 py-12 text-center text-gray-500 text-lg">No active orders</td></tr>}
              </tbody>
            </table>
            </div>
          )}
          
          {activeTab === 'history' && (
            <div className="h-full overflow-auto p-4">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold rounded-t-lg sticky top-0">
                <tr>
                  <th className="px-4 py-4 rounded-tl-lg">Date</th>
                  <th className="px-4 py-4">Order ID</th>
                  <th className="px-4 py-4">Table</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Total</th>
                  <th className="px-4 py-4 rounded-tr-lg text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyOrders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-gray-500">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-4 font-mono text-gray-600">#{order._id.slice(-4).toUpperCase()}</td>
                    <td className="px-4 py-4 font-bold text-gray-900">{order.tableId?.tableNumber}</td>
                    <td className="px-4 py-4">
                       <span className={`px-2 py-1 rounded text-xs font-bold tracking-wide uppercase ${
                         order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                       }`}>{order.status}</span>
                       {order.orderType === 'EXTERNAL' && (
                          <div className={`mt-1 text-[10px] font-bold px-1 py-0.5 rounded inline-block ${order.externalPlatform === 'SWIGGY' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                             {order.externalPlatform}
                          </div>
                       )}
                       {order.orderType === 'PARCEL' && (
                          <div className="mt-1 text-[10px] font-bold px-1 py-0.5 rounded inline-block bg-purple-100 text-purple-800">
                             PARCEL
                          </div>
                       )}
                    </td>
                    <td className="px-4 py-4 font-black text-gray-900 text-base">₹{order.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right">
                      {order.status === 'COMPLETED' && (
                        <button 
                          onClick={() => printReceipt(order)}
                          className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                          title="Reprint Receipt"
                        >
                          <Printer size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {historyOrders.length === 0 && <tr><td colSpan="6" className="px-4 py-12 text-center text-gray-500 text-lg">No history found</td></tr>}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Checkout Modal */}
        {checkoutOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Checkout {checkoutOrder.orderType === 'DINE_IN' ? `Table ${checkoutOrder.tableId?.tableNumber}` : checkoutOrder.orderType}
              </h3>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="text-2xl font-black text-green-600">₹{checkoutOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-3">
                  {['CASH', 'UPI', 'CARD'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-3 rounded-lg border-2 font-bold transition-all ${
                        paymentMethod === method 
                          ? 'border-blue-600 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setCheckoutOrder(null)} 
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={completeOrder} 
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-sm flex justify-center items-center gap-2"
                >
                  <CheckCircle size={18} /> Settle & Print
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {cancelingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 border-t-4 border-red-500">
              <h3 className="text-xl font-bold mb-2 text-gray-800 flex items-center gap-2">
                <XCircle className="text-red-500" /> Cancel Order
              </h3>
              <p className="text-gray-600 mb-4 text-sm">Are you sure you want to cancel the order for Table {cancelingOrder.tableId?.tableNumber}?</p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Reason *</label>
                <textarea
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer changed mind, Kitchen out of stock..."
                  className="w-full border border-gray-300 rounded-md p-3 outline-none focus:border-red-500 resize-none h-24"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => { setCancelingOrder(null); setCancelReason(''); }} 
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Go Back
                </button>
                <button 
                  disabled={!cancelReason.trim()}
                  onClick={cancelOrder} 
                  className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 shadow-sm disabled:opacity-50"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
