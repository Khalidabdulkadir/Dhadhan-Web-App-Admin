
import { Building2, Clock, CreditCard, Edit, MapPin, MessageCircle, Plus, Search, Store, Trash2, Truck } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import api, { BASE_URL } from '../api';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';

interface OpeningHour {
    day: number;
    day_display: string;
    opening_time: string;
    closing_time: string;
    is_closed: boolean;
}

interface Restaurant {
    id: number;
    name: string;
    logo: string;
    whatsapp_number: string;
    location: string;
    description: string;
    delivery_note: string;
    created_at: string;
    cover_image: string;
    campaign_image: string;
    is_verified: boolean;
    is_popular: boolean;
    discount_percentage: number;
    is_featured_campaign: boolean;
    slug: string;
    qr_code: string;
    delivery_mode: string;
    fixed_delivery_fee: string | null;
    free_delivery_threshold: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    paybill_number: string | null;
    till_number: string | null;
    is_open_now: boolean;
    opening_status_text: string;
    opening_hours: OpeningHour[];
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Restaurants() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'basic' | 'delivery' | 'payment' | 'hours'>('basic');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const ITEMS_PER_PAGE = 10;

    const [formData, setFormData] = useState({
        name: '',
        whatsapp_number: '',
        location: '',
        description: '',
        delivery_note: '',
        logo: '',
        is_verified: false,
        is_popular: false,
        discount_percentage: '',
        is_featured_campaign: false,
        delivery_mode: 'CONFIRM',
        fixed_delivery_fee: '',
        free_delivery_threshold: '',
        bank_name: '',
        bank_account_number: '',
        paybill_number: '',
        till_number: '',
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string>('');
    const [campaignFile, setCampaignFile] = useState<File | null>(null);
    const [campaignPreview, setCampaignPreview] = useState<string>('');
    const [openingHours, setOpeningHours] = useState<{ day: number; opening_time: string; closing_time: string; is_closed: boolean }[]>(
        WEEKDAYS.map((_, i) => ({ day: i, opening_time: '08:00', closing_time: '22:00', is_closed: false }))
    );
    const [isSavingHours, setIsSavingHours] = useState(false);

    useEffect(() => {
        fetchRestaurants(currentPage);
    }, [currentPage]);

    useEffect(() => {
        const results = restaurants.filter(restaurant =>
            restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            restaurant.location.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredRestaurants(results);
    }, [searchTerm, restaurants]);

    const fetchRestaurants = async (page: number = 1) => {
        setIsLoading(true);
        try {
            const response = await api.get(`/restaurants/?page=${page}`);
            if (response.data.results) {
                setRestaurants(response.data.results);
                setTotalCount(response.data.count);
            } else {
                setRestaurants(response.data);
                setTotalCount(response.data.length);
            }
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('whatsapp_number', formData.whatsapp_number);
            data.append('location', formData.location);
            data.append('description', formData.description);
            data.append('delivery_note', formData.delivery_note);
            data.append('is_verified', String(formData.is_verified));
            data.append('is_popular', String(formData.is_popular));
            data.append('discount_percentage', String(formData.discount_percentage || '0'));
            data.append('is_featured_campaign', String(formData.is_featured_campaign));
            data.append('delivery_mode', formData.delivery_mode);
            if (formData.fixed_delivery_fee) data.append('fixed_delivery_fee', formData.fixed_delivery_fee);
            if (formData.free_delivery_threshold) data.append('free_delivery_threshold', formData.free_delivery_threshold);
            if (formData.bank_name) data.append('bank_name', formData.bank_name);
            if (formData.bank_account_number) data.append('bank_account_number', formData.bank_account_number);
            if (formData.paybill_number) data.append('paybill_number', formData.paybill_number);
            if (formData.till_number) data.append('till_number', formData.till_number);
            if (logoFile) data.append('logo', logoFile);
            if (coverFile) data.append('cover_image', coverFile);
            if (campaignFile) data.append('campaign_image', campaignFile);

            const config = { headers: { 'Content-Type': 'multipart/form-data' } };

            let restaurantId;
            if (editingRestaurant) {
                const response = await api.patch(`/restaurants/${editingRestaurant.id}/`, data, config);
                restaurantId = editingRestaurant.id;
            } else {
                const response = await api.post('/restaurants/', data, config);
                restaurantId = response.data.id;
            }

            // Save opening hours
            if (restaurantId) {
                await api.post(`/restaurants/${restaurantId}/opening_hours/`, openingHours);
            }

            fetchRestaurants();
            closeModal();
            alert('Restaurant and opening hours saved successfully!');
        } catch (error) {
            console.error('Error saving restaurant:', error);
            alert('Error saving restaurant. Please check the logs.');
        }
    };

    const handleSaveHours = async () => {
        const id = editingRestaurant?.id;
        if (!id) return;
        setIsSavingHours(true);
        try {
            await api.post(`/restaurants/${id}/opening_hours/`, openingHours);
            alert('Opening hours updated successfully!');
            fetchRestaurants();
        } catch (error) {
            console.error('Error saving opening hours:', error);
            alert('Error saving hours. Please try again.');
        } finally {
            setIsSavingHours(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this restaurant? This will also delete all associated products and categories.')) {
            try {
                await api.delete(`/restaurants/${id}/`);
                fetchRestaurants();
            } catch (error) {
                console.error('Error deleting restaurant:', error);
            }
        }
    };

    const openModal = (restaurant?: Restaurant) => {
        setActiveTab('basic');
        if (restaurant) {
            setEditingRestaurant(restaurant);
            setFormData({
                name: restaurant.name,
                whatsapp_number: restaurant.whatsapp_number,
                location: restaurant.location,
                description: restaurant.description,
                delivery_note: restaurant.delivery_note || '',
                logo: restaurant.logo,
                is_verified: restaurant.is_verified,
                is_popular: restaurant.is_popular,
                discount_percentage: restaurant.discount_percentage ? String(restaurant.discount_percentage) : '',
                is_featured_campaign: restaurant.is_featured_campaign,
                delivery_mode: restaurant.delivery_mode || 'CONFIRM',
                fixed_delivery_fee: restaurant.fixed_delivery_fee || '',
                free_delivery_threshold: restaurant.free_delivery_threshold || '',
                bank_name: restaurant.bank_name || '',
                bank_account_number: restaurant.bank_account_number || '',
                paybill_number: restaurant.paybill_number || '',
                till_number: restaurant.till_number || '',
            });
            setLogoPreview(restaurant.logo ? getImageUrl(restaurant.logo) : '');
            setLogoFile(null);
            setCoverPreview(restaurant.cover_image ? getImageUrl(restaurant.cover_image) : '');
            setCoverFile(null);
            setCampaignPreview(restaurant.campaign_image ? getImageUrl(restaurant.campaign_image) : '');
            setCampaignFile(null);
            // Populate opening hours from restaurant data
            if (restaurant.opening_hours && restaurant.opening_hours.length > 0) {
                const hours = WEEKDAYS.map((_, i) => {
                    const existing = restaurant.opening_hours.find(h => h.day === i);
                    if (existing) {
                        return {
                            day: i,
                            opening_time: existing.opening_time.slice(0, 5),
                            closing_time: existing.closing_time.slice(0, 5),
                            is_closed: existing.is_closed,
                        };
                    }
                    return { day: i, opening_time: '08:00', closing_time: '22:00', is_closed: false };
                });
                setOpeningHours(hours);
            } else {
                setOpeningHours(WEEKDAYS.map((_, i) => ({ day: i, opening_time: '08:00', closing_time: '22:00', is_closed: false })));
            }
        } else {
            setEditingRestaurant(null);
            setFormData({
                name: '', whatsapp_number: '', location: '', description: '', delivery_note: '',
                logo: '', is_verified: false, is_popular: false, discount_percentage: '', is_featured_campaign: false,
                delivery_mode: 'CONFIRM', fixed_delivery_fee: '', free_delivery_threshold: '',
                bank_name: '', bank_account_number: '', paybill_number: '', till_number: '',
            });
            setLogoPreview(''); setLogoFile(null);
            setCoverPreview(''); setCoverFile(null);
            setCampaignPreview(''); setCampaignFile(null);
            setOpeningHours(WEEKDAYS.map((_, i) => ({ day: i, opening_time: '08:00', closing_time: '22:00', is_closed: false })));
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRestaurant(null);
        setActiveTab('basic');
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setCoverFile(file); setCoverPreview(URL.createObjectURL(file)); }
    };

    const handleCampaignChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setCampaignFile(file); setCampaignPreview(URL.createObjectURL(file)); }
    };

    const getImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${BASE_URL}${url}`;
    };

    const tabs = [
        { key: 'basic' as const, label: 'Basic Info', icon: Store },
        { key: 'delivery' as const, label: 'Delivery', icon: Truck },
        { key: 'payment' as const, label: 'Payment', icon: CreditCard },
        { key: 'hours' as const, label: 'Hours', icon: Clock },
    ];

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Restaurants</h1>
                    <p className="text-gray-500 mt-1 text-lg">Manage restaurants, vendors, and partners.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 animate-slideUp" style={{ animationDelay: '0.2s' }}>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search restaurants..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-72 bg-white border-2 border-gray-100 rounded-xl py-3 pl-10 pr-4 text-gray-700 outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-primary hover:bg-orange-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transform active:scale-95 transition-all font-semibold"
                    >
                        <Plus className="w-5 h-5" />
                        Add Restaurant
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-fadeIn">
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="bg-white rounded-2xl h-64 animate-pulse shadow-sm border border-gray-100"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
                    {filteredRestaurants.map((restaurant, index) => (
                        <div
                            key={restaurant.id}
                            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col animate-slideUp"
                            style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                        >
                            {/* Card Hero */}
                            <div className="relative h-32 bg-gray-50 overflow-hidden">
                                {restaurant.logo ? (
                                    <div className="w-full h-full relative">
                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-10 transition-opacity z-10" />
                                        <img src={getImageUrl(restaurant.logo)} alt={restaurant.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50/50">
                                        <Store className="w-16 h-16 mb-2 opacity-50" />
                                        <span className="text-sm font-medium">No Logo</span>
                                    </div>
                                )}

                                {/* Status Badges */}
                                <div className="absolute top-2 left-2 z-20 flex flex-col gap-1.5">
                                    {restaurant.discount_percentage > 0 && (
                                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm backdrop-blur-md">
                                            {Math.round(restaurant.discount_percentage)}% OFF
                                        </span>
                                    )}
                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm backdrop-blur-md ${restaurant.is_open_now ? 'bg-green-500 text-white' : 'bg-gray-600 text-white'}`}>
                                        {restaurant.is_open_now ? '● Open' : '● Closed'}
                                    </span>
                                </div>

                                {/* Overlay Actions */}
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-20">
                                    <button onClick={() => openModal(restaurant)} className="p-2.5 bg-white/95 backdrop-blur-md rounded-xl shadow-lg shadow-black/5 text-gray-700 hover:text-blue-600 hover:scale-110 active:scale-95 transition-all" title="Edit"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(restaurant.id)} className="p-2.5 bg-white/95 backdrop-blur-md rounded-xl shadow-lg shadow-black/5 text-gray-700 hover:text-red-600 hover:scale-110 active:scale-95 transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 flex items-center gap-2">
                                        {restaurant.name}
                                        {restaurant.is_verified && (
                                            <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </h3>
                                    <div className="flex items-center text-gray-500 text-sm">
                                        <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
                                        <span className="truncate">{restaurant.location}</span>
                                    </div>
                                </div>

                                {/* Info Badges */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${restaurant.delivery_mode === 'FREE' ? 'bg-green-50 text-green-700 border-green-100' : restaurant.delivery_mode === 'FIXED' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                        {restaurant.delivery_mode === 'FREE' ? '🚚 Free Delivery' : restaurant.delivery_mode === 'FIXED' ? `🚚 KSh ${restaurant.fixed_delivery_fee}` : '📞 Confirm Delivery'}
                                    </span>
                                    {restaurant.is_popular && (
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-orange-50 text-orange-700 border border-orange-100">🔥 Popular</span>
                                    )}
                                    {restaurant.is_featured_campaign && (
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100">⭐ Campaign</span>
                                    )}
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <MessageCircle className="w-4 h-4 text-green-600 mt-0.5 mr-2.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">WhatsApp</p>
                                            <p className="text-sm font-semibold text-gray-900">{restaurant.whatsapp_number}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 font-medium">{restaurant.opening_status_text || 'Hours not set'}</p>
                                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mt-1">
                                        {restaurant.description || <span className="text-gray-400 italic">No description provided.</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredRestaurants.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20 animate-fadeIn bg-white rounded-3xl border border-gray-100">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
                        <Store className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Restaurants Found</h3>
                    <p className="text-gray-500 max-w-sm text-center mb-8">
                        {searchTerm ? `No matches found for "${searchTerm}".` : "Get started by adding your first partner restaurant."}
                    </p>
                    <button onClick={() => openModal()} className="bg-primary hover:bg-orange-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 font-semibold transition-all">Add Restaurant</button>
                </div>
            )}

            <div className="mt-8 mb-12">
                <Pagination 
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)}
                    onPageChange={setCurrentPage}
                    totalItems={totalCount}
                    itemsPerPage={ITEMS_PER_PAGE}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingRestaurant ? 'Edit Restaurant' : 'New Restaurant'}
                maxWidth="2xl"
            >
                {/* Tab Navigation */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* === BASIC INFO TAB === */}
                    {activeTab === 'basic' && (
                        <>
                            {/* Cover Image Upload */}
                            <div className="w-full">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image</label>
                                <div className={`relative h-48 border-2 border-dashed rounded-2xl overflow-hidden transition-all cursor-pointer group ${coverPreview ? 'border-transparent' : 'border-gray-300 hover:border-primary hover:bg-gray-50'}`}>
                                    <input type="file" accept="image/*" onChange={handleCoverChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    {coverPreview ? (
                                        <>
                                            <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-medium">Change Cover Image</div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                            <Plus className="w-10 h-10 mb-2" />
                                            <p className="font-medium">Add Cover Image</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Campaign Image Upload */}
                            <div className="w-full">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Campaign Image (Hero Slider)</label>
                                <div className={`relative h-36 border-2 border-dashed rounded-2xl overflow-hidden transition-all cursor-pointer group ${campaignPreview ? 'border-transparent' : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'}`}>
                                    <input type="file" accept="image/*" onChange={handleCampaignChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    {campaignPreview ? (
                                        <>
                                            <img src={campaignPreview} alt="Campaign Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-medium">Change Campaign Image</div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                            <Building2 className="w-8 h-8 mb-2" />
                                            <p className="font-medium text-sm">Add Campaign Image</p>
                                            <p className="text-xs text-gray-400">Used in Hero Campaign Slider</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Toggles Row */}
                            <div className="flex flex-wrap gap-4">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={formData.is_featured_campaign} onChange={(e) => setFormData({ ...formData, is_featured_campaign: e.target.checked })} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    <span className="ml-2 text-sm font-medium text-gray-700">Hero Campaign</span>
                                </label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={formData.is_popular} onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                    <span className="ml-2 text-sm font-medium text-gray-700">Popular</span>
                                </label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={formData.is_verified} onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                    <span className="ml-2 text-sm font-medium text-gray-700">Verified</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Restaurant Name</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" placeholder="e.g. Burger King" required />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Discount (%)</label>
                                    <input type="number" min="0" max="100" value={formData.discount_percentage} onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="0" />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp Number</label>
                                    <div className="relative">
                                        <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="text" value={formData.whatsapp_number} onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="+254..." required />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="City, Street" required />
                                    </div>
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Instructions</label>
                                    <textarea value={formData.delivery_note} onChange={(e) => setFormData({ ...formData, delivery_note: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all min-h-[80px]" placeholder="Any specific delivery guidelines..." />
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all min-h-[100px]" placeholder="What makes this restaurant special?" />
                                </div>

                                {/* Logo Upload */}
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Restaurant Logo</label>
                                    <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group ${logoPreview ? 'border-primary/30 bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50'}`}>
                                        <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" required={!editingRestaurant && !logoPreview} />
                                        {logoPreview ? (
                                            <div className="relative h-40 flex items-center justify-center">
                                                <img src={logoPreview} alt="Preview" className="h-full object-contain drop-shadow-sm" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg text-white font-medium">Change Logo</div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-4">
                                                <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:text-primary group-hover:shadow-md transition-all"><Plus className="w-8 h-8" /></div>
                                                <p className="text-gray-900 font-medium">Click to upload logo</p>
                                                <p className="text-sm text-gray-500 mt-1">SVG, PNG, JPG or GIF</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* === DELIVERY TAB === */}
                    {activeTab === 'delivery' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Delivery Mode</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'FREE', label: 'Free Delivery', desc: 'Always free', color: 'green' },
                                        { value: 'FIXED', label: 'Fixed Fee', desc: 'Set delivery price', color: 'blue' },
                                        { value: 'CONFIRM', label: 'Confirm', desc: 'Via call/WhatsApp', color: 'orange' },
                                    ].map(mode => (
                                        <button
                                            key={mode.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, delivery_mode: mode.value })}
                                            className={`p-4 rounded-xl border-2 transition-all text-left ${formData.delivery_mode === mode.value ? `border-${mode.color}-500 bg-${mode.color}-50 ring-4 ring-${mode.color}-500/10` : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <p className="font-bold text-gray-900 text-sm">{mode.label}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{mode.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {formData.delivery_mode === 'FIXED' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Fixed Delivery Fee (KSh)</label>
                                        <input type="number" value={formData.fixed_delivery_fee} onChange={(e) => setFormData({ ...formData, fixed_delivery_fee: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="150" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Free Delivery Above (KSh)</label>
                                        <input type="number" value={formData.free_delivery_threshold} onChange={(e) => setFormData({ ...formData, free_delivery_threshold: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="2000 (optional)" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* === PAYMENT TAB === */}
                    {activeTab === 'payment' && (
                        <div className="space-y-6">
                            <p className="text-sm text-gray-500 bg-blue-50 p-4 rounded-xl border border-blue-100">💡 Payment details are shown to customers during checkout so they can pay directly.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
                                    <input type="text" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="e.g. KCB Bank" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
                                    <input type="text" value={formData.bank_account_number} onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="Account number" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Paybill Number</label>
                                    <input type="text" value={formData.paybill_number} onChange={(e) => setFormData({ ...formData, paybill_number: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="M-Pesa paybill" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Till Number</label>
                                    <input type="text" value={formData.till_number} onChange={(e) => setFormData({ ...formData, till_number: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="Buy Goods till number" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === OPENING HOURS TAB === */}
                    {activeTab === 'hours' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 bg-amber-50 p-4 rounded-xl border border-amber-100">🕐 Set opening and closing times for each day. Times persist when you save the restaurant.</p>
                            {openingHours.map((hour, index) => (
                                <div key={hour.day} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${hour.is_closed ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-100'}`}>
                                    <div className="w-28 flex-shrink-0">
                                        <p className="font-semibold text-gray-900 text-sm">{WEEKDAYS[hour.day]}</p>
                                    </div>
                                    <input type="time" value={hour.opening_time} onChange={(e) => { const newHours = [...openingHours]; newHours[index] = { ...newHours[index], opening_time: e.target.value }; setOpeningHours(newHours); }} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" disabled={hour.is_closed} />
                                    <span className="text-gray-400 text-sm">to</span>
                                    <input type="time" value={hour.closing_time} onChange={(e) => { const newHours = [...openingHours]; newHours[index] = { ...newHours[index], closing_time: e.target.value }; setOpeningHours(newHours); }} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" disabled={hour.is_closed} />
                                    <label className="ml-auto flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={hour.is_closed} onChange={(e) => { const newHours = [...openingHours]; newHours[index] = { ...newHours[index], is_closed: e.target.checked }; setOpeningHours(newHours); }} className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500" />
                                        <span className="text-xs font-medium text-gray-500">Closed</span>
                                    </label>
                                </div>
                            ))}
                             <button type="button" onClick={handleSaveHours} disabled={isSavingHours} className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50">
                                 {isSavingHours ? 'Saving Hours...' : 'Save Opening Hours'}
                             </button>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <button type="button" onClick={closeModal} className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors focus:ring-4 focus:ring-gray-100">Cancel</button>
                        <button type="submit" className="px-8 py-3 bg-primary hover:bg-orange-600 text-white rounded-xl shadow-lg shadow-primary/30 transform active:scale-95 transition-all font-semibold focus:ring-4 focus:ring-primary/20">
                            {editingRestaurant ? 'Save Changes' : 'Create Restaurant'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
