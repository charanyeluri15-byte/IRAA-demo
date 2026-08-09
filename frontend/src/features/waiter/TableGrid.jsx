import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';

export default function TableGrid() {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTables();

    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    socket.emit('joinRestaurantRoom', user.restaurantId);

    const refresh = () => fetchTables();
    socket.on('newOrder', refresh);
    socket.on('orderUpdated', refresh);

    return () => socket.disconnect();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await api.get('/waiter/tables');
      setTables(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Occupied': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Ordering': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Ready to Serve': return 'bg-green-100 text-green-800 border-green-300 animate-pulse';
      case 'Waiting for Bill': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) return <div className="text-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Tables</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tables.map(table => (
          <div 
            key={table._id}
            onClick={() => navigate(`/waiter/order/${table._id}`)}
            className={`aspect-square rounded-2xl flex flex-col items-center justify-center border-2 p-2 shadow-sm cursor-pointer active:scale-95 transition-transform ${getStatusColor(table.status)}`}
          >
            <span className="text-3xl font-black">{table.tableNumber}</span>
            <span className="text-[10px] font-bold uppercase mt-2 text-center break-words w-full">{table.status}</span>
          </div>
        ))}
      </div>
      
      {tables.length === 0 && (
        <div className="text-center p-8 text-gray-500">No tables found.</div>
      )}
    </div>
  );
}
