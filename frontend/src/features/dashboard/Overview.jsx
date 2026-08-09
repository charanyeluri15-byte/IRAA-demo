import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Activity, ShoppingBag, IndianRupee, Calendar, TrendingDown, Star, Users, Clock, CheckCircle, XCircle, ChefHat, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOperationalMetricsOpen, setIsOperationalMetricsOpen] = useState(false);
  const currency = 'INR';

  useEffect(() => {
    const fetchStatsAndProfile = async () => {
      try {
        const [statsRes, profileRes] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/restaurant/profile')
        ]);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatsAndProfile();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  const sym = '₹';

  const formatMoney = (val) => `${sym}${val?.toFixed(2) || '0.00'}`;

  const topCards = [
    { title: "Today's Revenue", value: formatMoney(stats?.todaySales), icon: IndianRupee, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Today's Expense", value: formatMoney(stats?.todayExpense), icon: TrendingDown, color: "text-red-500", bg: "bg-red-50" },
    { title: "Today's Profit", value: formatMoney(stats?.todayProfit), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { title: "This Week's Profit", value: formatMoney(stats?.weeklyProfit), icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Total Profit", value: formatMoney(stats?.totalProfit), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  const orderCards = [
    { title: "Pending Orders", value: stats?.pendingOrders || 0, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
    { title: "Kitchen Orders", value: stats?.kitchenOrders || 0, icon: ChefHat, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Completed Orders", value: stats?.completedOrders || 0, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { title: "Cancelled Orders", value: stats?.cancelledOrders || 0, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    { title: "Tables Occupied", value: stats?.tablesOccupied || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Tables Available", value: stats?.tablesAvailable || 0, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  const secondaryCards = [
    { title: "Monthly Sales", value: formatMoney(stats?.monthlySales), icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Monthly Profit", value: formatMoney(stats?.monthlyProfit), icon: Activity, color: "text-green-500", bg: "bg-green-50" },
  ];

  const formattedChartData = stats?.chartData?.map(d => ({
    ...d,
    date: format(new Date(d.date), 'MMM dd')
  })) || [];

  return (
    <div className="space-y-6">
      {/* Top row - Today's numbers & Total Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
         {topCards.map((card, idx) => (
           <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
             <div className={`p-4 rounded-full ${card.bg}`}>
               <card.icon className={`w-8 h-8 ${card.color}`} />
             </div>
             <div>
               <p className="text-sm font-medium text-gray-500">{card.title}</p>
               <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
             </div>
           </div>
         ))}
      </div>
      
      {/* Second row - Operational numbers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <button 
          onClick={() => setIsOperationalMetricsOpen(!isOperationalMetricsOpen)}
          className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
        >
          <h3 className="font-bold text-gray-800 tracking-tight">Operational Metrics</h3>
          {isOperationalMetricsOpen ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
        </button>
        
        {isOperationalMetricsOpen && (
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
               {orderCards.map((card, idx) => (
                 <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
                   <div className={`p-3 rounded-full mb-3 ${card.bg}`}>
                     <card.icon className={`w-6 h-6 ${card.color}`} />
                   </div>
                   <h3 className="text-xl font-bold text-gray-900">{card.value}</h3>
                   <p className="text-xs font-medium text-gray-500 uppercase mt-1">{card.title}</p>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800 tracking-tight">Revenue & Profit Analytics</h3>
              <div className="flex gap-4">
                 {secondaryCards.map((sc, idx) => (
                   <div key={idx} className="text-right">
                     <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{sc.title}</p>
                     <p className={`text-lg font-bold ${sc.color}`}>{sc.value}</p>
                   </div>
                 ))}
              </div>
           </div>
           
           <div className="h-80 w-full">
              {formattedChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${sym}${value}`} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`${sym}${value.toFixed(2)}`]}
                    />
                    <Legend iconType="circle" />
                    <Area type="monotone" dataKey="Sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    <Area type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                   No completed orders yet to generate charts.
                </div>
              )}
           </div>
        </div>

        {/* Best Selling Items Column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-6 tracking-tight flex items-center gap-2">
            <Star className="text-yellow-500" fill="currentColor" /> Best Selling Items
          </h3>
          
          <div className="flex-1 flex flex-col justify-start">
            {stats?.bestSellingItems && stats.bestSellingItems.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {stats.bestSellingItems.map((item, index) => (
                  <li key={item._id} className="py-4 flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        index === 1 ? 'bg-gray-100 text-gray-600' :
                        index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.totalQuantity} sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatMoney(item.totalRevenue)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200 p-6 text-center">
                <p>No sales data available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
