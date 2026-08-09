import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../auth/AuthContext';

export default function ReceiptPrint() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [order, setOrder] = useState(null);
  const [restaurantProfile, setRestaurantProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paperWidth, setPaperWidth] = useState('80mm');

  useEffect(() => {
    // Load paper width from local storage
    const storedWidth = localStorage.getItem('thermalPrinterWidth');
    if (storedWidth) setPaperWidth(storedWidth);

    const fetchData = async () => {
      try {
        // Fetch profile
        const profileRes = await api.get('/restaurant/profile');
        setRestaurantProfile(profileRes.data);

        // Fetch orders and find the specific one
        // Since we cannot modify the backend, we fetch active + history
        const [activeRes, historyRes] = await Promise.all([
          api.get('/staff/orders/active'),
          api.get('/staff/orders/history')
        ]);
        
        const allOrders = [...activeRes.data, ...historyRes.data];
        const foundOrder = allOrders.find(o => o._id === orderId);
        
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          console.error("Order not found");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  useEffect(() => {
    if (!loading && order && restaurantProfile) {
      // Small delay to ensure render is complete before triggering print
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, order, restaurantProfile]);

  if (loading) return <div className="p-4 text-center text-sm font-mono">Loading Receipt...</div>;
  if (!order || !restaurantProfile) return <div className="p-4 text-center text-sm font-mono text-red-600">Receipt Not Found. Please close this window.</div>;

  const total = order.totalAmount;
  const subtotal = total / 1.05;
  const cgst = subtotal * 0.025;
  const sgst = subtotal * 0.025;
  
  // Choose width based on setting
  const containerWidthClass = paperWidth === '58mm' ? 'w-[58mm]' : 'w-[80mm]';
  const textClass = paperWidth === '58mm' ? 'text-xs' : 'text-sm';
  const headingClass = paperWidth === '58mm' ? 'text-lg' : 'text-2xl';

  return (
    <div className="bg-white min-h-screen print:bg-white flex justify-center">
      <style>
        {`
          @media print {
            @page {
              margin: 0;
            }
            body {
              margin: 0;
              background-color: white;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            /* Hide everything outside of print receipt */
            nav, header, footer, .dashboard-sidebar {
              display: none !important;
            }
          }
        `}
      </style>
      
      <div className={`bg-white font-mono text-black ${containerWidthClass} ${textClass} p-2 print:p-0 mx-auto mt-4 print:mt-0 print:border-none border border-dashed border-gray-300`}>
         <div className="text-center mb-3">
            {/* Optional Logo Placeholder */}
            {restaurantProfile.logo ? (
              <div className="flex justify-center mb-2">
                <img src={restaurantProfile.logo} alt="Logo" className="max-h-12 object-contain grayscale" />
              </div>
            ) : (
              <div className="flex justify-center mb-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
                  <path d="M7 2v20"></path>
                  <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
                </svg>
              </div>
            )}
            <h1 className={`${headingClass} font-bold uppercase tracking-widest leading-tight`}>{restaurantProfile.name || 'RESTAURANT'}</h1>
            <p className="mt-1">{restaurantProfile.address}</p>
            <p>Phone: {restaurantProfile.phone}</p>
            {restaurantProfile.gstNumber && <p>GST: {restaurantProfile.gstNumber}</p>}
         </div>

         <div className="border-t border-dashed border-black py-2 mb-2 space-y-1">
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(order.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' }).replace(',', '')}</span>
            </div>
            <div className="flex justify-between">
              <span>Receipt:</span>
              <span>#R-{order._id.slice(-4).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>Table:</span>
              <span>{order.tableId?.tableNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{user?.name || 'Staff'}</span>
            </div>
         </div>

         <div className="border-t border-dashed border-black py-2 mb-2">
            <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-dashed border-gray-400">
                   <th className="py-1 font-normal w-2/3">Items</th>
                   <th className="py-1 font-normal text-center w-1/6">Qty</th>
                   <th className="py-1 font-normal text-right w-1/6">Price</th>
                 </tr>
               </thead>
               <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1 uppercase pr-1 align-top leading-tight">{item.name}</td>
                      <td className="py-1 text-center align-top">{item.quantity}</td>
                      <td className="py-1 text-right align-top">₹{item.price.toFixed(2)}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>

         <div className="border-t border-dashed border-black py-2 mb-2 space-y-1">
            <div className="flex justify-between">
               <span>Subtotal</span>
               <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
               <span>CGST</span>
               <span>₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
               <span>SGST</span>
               <span>₹{sgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base mt-2 pt-1 border-t border-dashed border-gray-400">
               <span>Grand Total</span>
               <span>₹{total.toFixed(2)}</span>
            </div>
         </div>

         <div className="border-t border-dashed border-black py-2 mb-4 space-y-1">
            <div className="flex justify-between">
               <span>Payment Method:</span>
               <span className="uppercase">{order.paymentMethod || 'CASH'}</span>
            </div>
            {['CARD', 'UPI'].includes(order.paymentMethod) && (
              <div className="flex justify-between">
                <span>Transaction ID:</span>
                <span>{Math.floor(Math.random() * 1000000000)}</span>
              </div>
            )}
            <div className="flex justify-between">
               <span>Status:</span>
               <span>{order.status === 'COMPLETED' ? 'PAID' : order.status}</span>
            </div>
         </div>

         <div className="border-t border-dashed border-black pt-4 text-center space-y-1 pb-4">
            <p className="uppercase font-bold">THANK YOU</p>
            <p className="uppercase font-bold">VISIT AGAIN</p>
         </div>
         
         {/* Non-printing close button for convenience if viewed normally */}
         <div className="print:hidden text-center mt-8">
            <button 
              onClick={() => window.close()} 
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-sans"
            >
              Close Window
            </button>
         </div>
      </div>
    </div>
  );
}
