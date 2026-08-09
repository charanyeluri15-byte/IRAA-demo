import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import TablesManagement from './TablesManagement';
import MenuBuilder from './MenuBuilder';
import Overview from './Overview';
import StaffManagement from './StaffManagement';
import RestaurantProfile from './RestaurantProfile';
import KitchenView from '../kitchen/KitchenView';
import CashierView from '../cashier/CashierView';
import WaiterDashboard from '../waiter/WaiterDashboard';
import { LayoutDashboard, UtensilsCrossed, Grid2X2, Settings, Users, ChefHat, IndianRupee, Bell, Menu, X } from 'lucide-react';

export default function OwnerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState('Loading...');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/restaurant/profile');
        setRestaurantName(data.name || 'ERP SaaS');
      } catch (error) {
        console.error('Failed to fetch restaurant profile:', error);
        setRestaurantName('ERP SaaS');
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'menu', name: 'Menu Builder', icon: UtensilsCrossed },
    { id: 'tables', name: 'Tables Management', icon: Grid2X2 },
    { id: 'kitchen', name: 'Kitchen Display', icon: ChefHat },
    { id: 'cashier', name: 'Cashier Desk', icon: IndianRupee },
    { id: 'waiter', name: 'Waiter Dashboard', icon: Bell },
    { id: 'staff', name: 'Staff Management', icon: Users },
    { id: 'profile', name: 'Restaurant Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center z-30 shadow-md">
        <h1 className="text-xl font-bold tracking-tight truncate max-w-[200px]" title={restaurantName}>
          {restaurantName}
        </h1>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 text-gray-300 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 bg-gray-900 text-white flex flex-col md:min-h-screen
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-bold text-white tracking-tight truncate" title={restaurantName}>{restaurantName}</h1>
          <p className="text-gray-400 text-sm mt-1">Owner Portal</p>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm font-medium ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.name}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
           <div className="mb-4 px-2">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Logged in as</p>
              <p className="text-sm font-semibold truncate">{user?.name}</p>
           </div>
           <button
            onClick={handleLogout}
            className="w-full bg-gray-800 text-gray-300 px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
           >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] md:h-screen overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center z-10 hidden md:flex">
           <h2 className="text-xl font-semibold text-gray-800">
             {tabs.find(t => t.id === activeTab)?.name}
           </h2>
        </header>
        {/* Mobile active tab title (optional, adds context) */}
        <div className="md:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
           <h2 className="text-lg font-semibold text-gray-800">
             {tabs.find(t => t.id === activeTab)?.name}
           </h2>
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
           <div className="max-w-7xl mx-auto h-full">
             {activeTab === 'tables' && <TablesManagement />}
             {activeTab === 'menu' && <MenuBuilder />}
             {activeTab === 'kitchen' && <KitchenView />}
             {activeTab === 'cashier' && <CashierView />}
             {activeTab === 'waiter' && (
               <div className="max-w-md mx-auto">
                 <WaiterDashboard />
               </div>
             )}
             { activeTab === 'staff' && <StaffManagement />}
             { activeTab === 'overview' && <Overview />}
             {activeTab === 'profile' && <RestaurantProfile />}
           </div>
        </main>
      </div>
    </div>
  );
}
