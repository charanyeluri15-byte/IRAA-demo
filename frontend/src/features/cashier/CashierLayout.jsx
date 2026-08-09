import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import CashierView from './CashierView';
import { LogOut, IndianRupee } from 'lucide-react';

export default function CashierLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <IndianRupee size={28} className="text-blue-400" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">Cashier Portal</h1>
            <p className="text-gray-400 text-xs truncate max-w-[200px]">{user?.name} | {user?.role}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors"
        >
          <LogOut size={18} /> <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      <main className="flex-1 p-6 overflow-y-auto">
        <CashierView />
      </main>
    </div>
  );
}
