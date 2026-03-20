
import { MessageCircle, Phone, Search, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../api';
import Pagination from '../components/Pagination';

interface DirectOrder {
    id: number;
    user: number;
    restaurant: number;
    restaurant_name: string;
    product: number | null;
    product_name: string | null;
    order_type: 'whatsapp' | 'call';
    status: string;
    created_at: string;
}

export default function DirectOrders() {
    const [orders, setOrders] = useState<DirectOrder[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<DirectOrder[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'whatsapp' | 'call'>('all');
    const [stats, setStats] = useState<any>(null);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        fetchOrders(currentPage);
        fetchStats();
    }, [currentPage]);

    useEffect(() => {
        let results = orders;
        if (filter !== 'all') {
            results = results.filter(o => o.order_type === filter);
        }
        if (searchTerm) {
            results = results.filter(order =>
                order.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.id.toString().includes(searchTerm)
            );
        }
        setFilteredOrders(results);
    }, [searchTerm, orders, filter]);

    const fetchOrders = async (page: number = 1) => {
        setIsLoading(true);
        try {
            const response = await api.get(`/direct-orders/?page=${page}`);
            if (response.data.results) {
                setOrders(response.data.results);
                setTotalCount(response.data.count);
            } else if (Array.isArray(response.data)) {
                setOrders(response.data);
                setTotalCount(response.data.length);
            } else {
                setOrders([]);
                setTotalCount(0);
            }
        } catch (error) {
            console.error('Error fetching direct orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/direct-orders/stats/');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Direct Orders</h1>
                    <p className="text-gray-500 mt-1 text-lg">Track WhatsApp and call order inquiries.</p>
                </div>

                <div className="flex items-center gap-3 animate-slideUp" style={{ animationDelay: '0.2s' }}>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                        <input type="text" placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-72 bg-white border-2 border-gray-100 rounded-xl py-3 pl-10 pr-4 text-gray-700 outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" />
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mb-8 animate-slideUp" style={{ animationDelay: '0.15s' }}>
                <div className="bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Inquiries</p>
                    <p className="text-2xl font-black text-gray-900">{stats?.total_inquiries || totalCount}</p>
                </div>
                <div className="bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">WhatsApp</p>
                    <p className="text-2xl font-black text-green-600">{stats?.whatsapp_total || '...'}</p>
                </div>
                <div className="bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone Calls</p>
                    <p className="text-2xl font-black text-blue-600">{stats?.call_total || '...'}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 animate-slideUp" style={{ animationDelay: '0.2s' }}>
                {[
                    { key: 'all' as const, label: 'All Orders', count: orders.length },
                    { key: 'whatsapp' as const, label: 'WhatsApp', count: orders.filter(o => o.order_type === 'whatsapp').length },
                    { key: 'call' as const, label: 'Phone Calls', count: orders.filter(o => o.order_type === 'call').length },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${filter === tab.key ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'}`}
                    >
                        {tab.label} <span className={`ml-1.5 text-xs ${filter === tab.key ? 'text-gray-300' : 'text-gray-400'}`}>({tab.count})</span>
                    </button>
                ))}
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex justify-center animate-fadeIn">
                    <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-gray-200 rounded w-3/4"></div><div className="space-y-2"><div className="h-4 bg-gray-200 rounded"></div><div className="h-4 bg-gray-200 rounded w-5/6"></div></div></div></div>
                </div>
            ) : filteredOrders.length > 0 ? (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-slideUp" style={{ animationDelay: '0.3s' }}>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Type</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Restaurant</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Product</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors group">
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <span className="font-bold text-gray-900">#{order.id}</span>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            {order.order_type === 'whatsapp' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-50 text-green-700 border border-green-100">
                                                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-100">
                                                    <Phone className="w-3.5 h-3.5" /> Phone Call
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <span className="font-semibold text-gray-900">{order.restaurant_name}</span>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <span className="text-gray-600 font-medium">{order.product_name || '—'}</span>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-[10px] uppercase font-bold tracking-wide rounded-full bg-amber-50 text-amber-700 border border-amber-100 shadow-sm">
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500 font-medium">
                                            {new Date(order.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 animate-fadeIn bg-white rounded-3xl border border-gray-100">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
                        <ShoppingBag className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Direct Orders Found</h3>
                    <p className="text-gray-500 max-w-sm text-center">
                        {searchTerm ? "No orders match your search criteria." : "Direct orders from WhatsApp and phone calls will appear here."}
                    </p>
                </div>
            )}

            <div className="mt-8">
                <Pagination 
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)}
                    onPageChange={setCurrentPage}
                    totalItems={totalCount}
                    itemsPerPage={ITEMS_PER_PAGE}
                />
            </div>

            {/* Restaurant-wise Breakdown */}
            <div className="mt-12 animate-slideUp" style={{ animationDelay: '0.4s' }}>
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Insights by Restaurant</h2>
                        <p className="text-gray-500 text-sm">Performance breakdown of WhatsApp and Phone Call clicks.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 pb-20">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Restaurant Name</th>
                                    <th className="px-8 py-5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">WhatsApp Clicks</th>
                                    <th className="px-8 py-5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Call Clicks</th>
                                    <th className="px-8 py-5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Top Interest (Item)</th>
                                    <th className="px-8 py-5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Total Interest</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {stats?.restaurant_breakdown?.map((item: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <span className="font-bold text-gray-900">{item.restaurant__name}</span>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-center">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 font-bold text-xs border border-green-100">{item.whatsapp_count}</span>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-center">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">{item.call_count}</span>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-center">
                                            <span className="font-medium text-gray-600 text-sm">N/A</span>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-center">
                                            <span className="text-lg font-black text-gray-900">{item.total_count}</span>
                                        </td>
                                    </tr>
                                ))}
                                {(!stats || stats.restaurant_breakdown?.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-10 text-center text-gray-400 font-medium">No data available for breakdown.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
