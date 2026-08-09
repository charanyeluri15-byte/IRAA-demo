import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import WaiterDashboard from './WaiterDashboard';
import TableGrid from './TableGrid';
import OrderPad from './OrderPad';
import { LayoutDashboard, Grid2X2, LogOut, Bell } from 'lucide-react';

export default function WaiterLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.includes(path);

  return (
    <div className="bg-gray-50 min-h-screen pb-16 font-sans">
      {/* Mobile Top Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-50 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Waiter App</h1>
          <p className="text-blue-200 text-xs truncate max-w-[150px]">{user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 relative bg-blue-700 rounded-full text-white">
            <Bell size={20} />
            {/* Notification Badge placeholder */}
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-blue-700"></span>
          </button>
          <button onClick={handleLogout} className="p-2 bg-blue-700 rounded-full text-white">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 max-w-lg mx-auto">
        <Routes>
          <Route path="/" element={<WaiterDashboard />} />
          <Route path="/tables" element={<TableGrid />} />
          <Route path="/order/:tableId" element={<OrderPad />} />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
        <Link 
          to="/waiter" 
          className={`flex flex-col items-center p-2 min-w-[70px] ${isActive('/waiter') && !isActive('/tables') && !isActive('/order') ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <LayoutDashboard size={24} className="mb-1" />
          <span className="text-[10px] font-bold">Dashboard</span>
        </Link>
        <Link 
          to="/waiter/tables" 
          className={`flex flex-col items-center p-2 min-w-[70px] ${isActive('/tables') || isActive('/order') ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <Grid2X2 size={24} className="mb-1" />
          <span className="text-[10px] font-bold">Tables</span>
        </Link>
      </nav>
    </div>
  );
}
