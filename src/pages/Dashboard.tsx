
import { DollarSign, Loader2, PhoneCall, ShoppingBag, Store, TrendingUp, Users, UtensilsCrossed, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRestaurants: 0,
    totalReels: 0,
    totalDirectOrders: 0,
  });
  const [period, setPeriod] = useState('weekly');
  const [revenueData, setRevenueData] = useState([]);
  const [directOrderData, setDirectOrderData] = useState([]);
  const [restaurantData, setRestaurantData] = useState([]);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get(`/dashboard/stats/?period=${period}`);
      const data = statsRes.data;

      setStats({
        totalOrders: data.orders.total,
        totalRevenue: data.orders.revenue,
        totalProducts: data.summary.total_products,
        totalUsers: data.summary.total_users,
        totalRestaurants: data.summary.total_restaurants,
        totalReels: data.summary.total_reels,
        totalDirectOrders: data.direct_orders.total,
      });

      // Direct Order Data
      setDirectOrderData([
        { name: 'WhatsApp', count: data.direct_orders.whatsapp },
        { name: 'Phone Call', count: data.direct_orders.call }
      ] as any);

      // Restaurant Order Data (Combining direct and regular if needed, but here based on regular orders)
      const restData = data.orders.by_restaurant.map((item: any) => ({
        name: item.product__restaurant__name || 'Unknown',
        orders: item.count
      }));
      setRestaurantData(restData as any);

      // Revenue Trend Data
      setRevenueData(data.orders.revenue_trend as any);

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, gradient, subtitle }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden">
      {/* Background Decoration */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-xl ${gradient}`}></div>

      <div>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-black text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1 font-medium">{subtitle}</p>}
      </div>
      <div className={`p-4 rounded-xl ${gradient} text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 animate-slideUp">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1 text-lg">Real-time insights and performance metrics.</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-100 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none cursor-pointer transition-all hover:border-orange-200"
          >
            <option value="daily">Daily View</option>
            <option value="weekly">Weekly View</option>
            <option value="monthly">Monthly View</option>
            <option value="yearly">Yearly View</option>
          </select>
          <div className="bg-white px-5 py-2.5 rounded-xl shadow-sm border border-gray-100 text-sm font-semibold text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slideUp" style={{ animationDelay: '0.1s' }}>
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Total Revenue"
          value={`KSh ${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={UtensilsCrossed}
          gradient="bg-gradient-to-br from-orange-500 to-orange-600"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slideUp" style={{ animationDelay: '0.15s' }}>
        <StatCard
          title="Restaurants"
          value={stats.totalRestaurants}
          icon={Store}
          gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
          subtitle="Active partners"
        />
        <StatCard
          title="Reels"
          value={stats.totalReels}
          icon={Video}
          gradient="bg-gradient-to-br from-pink-500 to-pink-600"
          subtitle="Video content"
        />
        <StatCard
          title="Direct Orders"
          value={stats.totalDirectOrders}
          icon={PhoneCall}
          gradient="bg-gradient-to-br from-teal-500 to-teal-600"
          subtitle="WhatsApp & Calls"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slideUp" style={{ animationDelay: '0.2s' }}>
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              Revenue Trends
            </h2>
            <select className="text-sm bg-gray-50 border-none rounded-lg text-gray-500 font-medium py-1 px-3 focus:ring-0 cursor-pointer hover:bg-gray-100 transition-colors">
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="h-80 w-full min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF4500" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FF4500" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} itemStyle={{ color: '#1F2937', fontWeight: 600 }} labelStyle={{ color: '#6B7280', marginBottom: '4px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#FF4500" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0, fill: '#FF4500' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Direct Order Distribution Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
                <PhoneCall className="w-5 h-5" />
              </div>
              Direct Order Distribution
            </h2>
          </div>
          <div className="h-80 w-full min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={directOrderData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }} />
                <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} itemStyle={{ color: '#1F2937', fontWeight: 600 }} labelStyle={{ color: '#6B7280', marginBottom: '4px' }} />
                <Bar dataKey="count" fill="#0D9488" radius={[6, 6, 0, 0]} barSize={60} animationDuration={1500}>
                  {
                    directOrderData.map((entry: any, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'WhatsApp' ? '#10B981' : '#3B82F6'} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders per Restaurant Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Store className="w-5 h-5" />
              </div>
              Orders per Restaurant
            </h2>
          </div>
          <div className="h-80 w-full min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={restaurantData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 11, fontWeight: 600 }} width={100} />
                <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="orders" fill="#3B82F6" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
