
import { Edit, Flame, Image as ImageIcon, Package, Plus, Search, Star, Trash2, X, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import api, { BASE_URL } from '../api';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';

interface ProductVariant {
    id?: number;
    name: string;
    price: string;
    is_default: boolean;
}

interface ProductAddOn {
    id?: number;
    name: string;
    price: string;
    is_available: boolean;
}

interface Product {
    id: number;
    name: string;
    description: string;
    price: string;
    image: string;
    category: number;
    restaurant: number | null;
    restaurant_data?: { id: number; name: string };
    discount_percentage: number;
    discounted_price?: number;
    is_promoted: boolean;
    is_hot: boolean;
    rating: string;
    calories: number;
    variants: ProductVariant[];
    addons: ProductAddOn[];
}

interface Category {
    id: number;
    name: string;
}

interface Restaurant {
    id: number;
    name: string;
}

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'basic' | 'variants' | 'addons'>('basic');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const ITEMS_PER_PAGE = 10;

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        restaurant: '',
        is_hot: false,
        is_promoted: false,
        image: '',
        discount_percentage: '',
        rating: '5.0',
        calories: '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [addons, setAddons] = useState<ProductAddOn[]>([]);

    useEffect(() => {
        fetchProducts(currentPage);
        fetchCategories();
        fetchRestaurants();
    }, [currentPage]);

    useEffect(() => {
        const results = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProducts(results);
    }, [searchTerm, products]);

    const fetchProducts = async (page: number = 1) => {
        setIsLoading(true);
        try {
            const response = await api.get(`/products/?page=${page}`);
            if (response.data.results) {
                setProducts(response.data.results);
                setTotalCount(response.data.count);
            } else {
                setProducts(response.data);
                setTotalCount(response.data.length);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories/');
            setCategories(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchRestaurants = async () => {
        try {
            const response = await api.get('/restaurants/');
            setRestaurants(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('price', formData.price);
            data.append('category', formData.category);
            if (formData.restaurant) data.append('restaurant', formData.restaurant);
            data.append('is_hot', String(formData.is_hot));
            data.append('is_promoted', String(formData.is_promoted));
            data.append('discount_percentage', String(formData.discount_percentage || '0'));
            data.append('rating', formData.rating || '5.0');
            data.append('calories', String(formData.calories || '0'));
            if (imageFile) data.append('image', imageFile);

            const config = { headers: { 'Content-Type': 'multipart/form-data' } };

            if (editingProduct) {
                await api.patch(`/products/${editingProduct.id}/`, data, config);
            } else {
                await api.post('/products/', data, config);
            }
            fetchProducts();
            closeModal();
        } catch (error) {
            console.error('Error saving product:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/products/${id}/`);
                fetchProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    };

    const openModal = (product?: Product) => {
        setActiveTab('basic');
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                description: product.description,
                price: product.price,
                category: product.category.toString(),
                restaurant: product.restaurant?.toString() || '',
                is_hot: product.is_hot,
                is_promoted: product.is_promoted,
                image: product.image,
                discount_percentage: product.discount_percentage ? String(product.discount_percentage) : '',
                rating: product.rating || '5.0',
                calories: product.calories ? String(product.calories) : '',
            });
            setImagePreview(product.image ? getImageUrl(product.image) : '');
            setImageFile(null);
            setVariants(product.variants || []);
            setAddons(product.addons || []);
        } else {
            setEditingProduct(null);
            setFormData({
                name: '', description: '', price: '', category: categories[0]?.id.toString() || '',
                restaurant: '', is_hot: false, is_promoted: false, image: '',
                discount_percentage: '', rating: '5.0', calories: '',
            });
            setImagePreview('');
            setImageFile(null);
            setVariants([]);
            setAddons([]);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setActiveTab('basic');
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
    };

    const getImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${BASE_URL}${url}`;
    };

    // Variant helpers
    const addVariant = () => setVariants([...variants, { name: '', price: '', is_default: variants.length === 0 }]);
    const removeVariant = (index: number) => setVariants(variants.filter((_, i) => i !== index));
    const updateVariant = (index: number, field: string, value: any) => {
        const updated = [...variants];
        (updated[index] as any)[field] = value;
        if (field === 'is_default' && value) {
            updated.forEach((v, i) => { if (i !== index) v.is_default = false; });
        }
        setVariants(updated);
    };

    // Addon helpers
    const addAddon = () => setAddons([...addons, { name: '', price: '', is_available: true }]);
    const removeAddon = (index: number) => setAddons(addons.filter((_, i) => i !== index));
    const updateAddon = (index: number, field: string, value: any) => {
        const updated = [...addons];
        (updated[index] as any)[field] = value;
        setAddons(updated);
    };

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Products</h1>
                    <p className="text-gray-500 mt-1 text-lg">Manage food items, variants, and add-ons.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 animate-slideUp" style={{ animationDelay: '0.2s' }}>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                        <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-72 bg-white border-2 border-gray-100 rounded-xl py-3 pl-10 pr-4 text-gray-700 outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" />
                    </div>
                    <button onClick={() => openModal()} className="bg-primary hover:bg-orange-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transform active:scale-95 transition-all font-semibold">
                        <Plus className="w-5 h-5" />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-fadeIn">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n} className="bg-white rounded-2xl h-[280px] animate-pulse shadow-sm border border-gray-100"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
                    {filteredProducts.map((product, index) => (
                        <div key={product.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col animate-slideUp" style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
                            {/* Product Image */}
                            <div className="relative h-40 bg-gray-50 overflow-hidden">
                                {product.image ? (
                                    <div className="w-full h-full relative">
                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-10 transition-opacity z-10" />
                                        <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50/50">
                                        <ImageIcon className="w-16 h-16 mb-2 opacity-50" />
                                        <span className="text-sm font-medium">No Image</span>
                                    </div>
                                )}

                                {/* Status Badges */}
                                <div className="absolute top-2 left-2 z-20 flex flex-col gap-1.5">
                                    {Number(product.discount_percentage) > 0 && (
                                        <span className="bg-orange-500/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm backdrop-blur-md w-fit">
                                            {Math.round(product.discount_percentage)}% OFF
                                        </span>
                                    )}
                                    {product.is_hot && (
                                        <span className="bg-red-500/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm backdrop-blur-md w-fit flex items-center gap-1">
                                            <Flame className="w-3 h-3" /> Hot
                                        </span>
                                    )}
                                    {product.is_promoted && (
                                        <span className="bg-purple-500/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm backdrop-blur-md w-fit flex items-center gap-1">
                                            <Zap className="w-3 h-3" /> Promoted
                                        </span>
                                    )}
                                </div>

                                {/* Overlay Actions */}
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-20">
                                    <button onClick={() => openModal(product)} className="p-2.5 bg-white/95 backdrop-blur-md rounded-xl shadow-lg shadow-black/5 text-gray-700 hover:text-blue-600 hover:scale-110 active:scale-95 transition-all" title="Edit"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(product.id)} className="p-2.5 bg-white/95 backdrop-blur-md rounded-xl shadow-lg shadow-black/5 text-gray-700 hover:text-red-600 hover:scale-110 active:scale-95 transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                </div>

                                {/* Price Tag */}
                                <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-md px-3 py-1 bg-white/90 rounded-lg shadow-sm font-bold text-gray-900 border border-gray-100 flex flex-col items-end">
                                    {Number(product.discount_percentage) > 0 ? (
                                        <>
                                            <span className="text-orange-600 text-sm">KSh {Math.round(Number(product.discounted_price || product.price))}</span>
                                            <span className="text-gray-400 text-xs line-through">KSh {product.price}</span>
                                        </>
                                    ) : (
                                        <span>KSh {product.price}</span>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="mb-2">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1" title={product.name}>{product.name}</h3>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-medium border border-orange-100">
                                            {categories.find(c => c.id === product.category)?.name || 'Uncategorized'}
                                        </span>
                                        {product.restaurant && (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100 truncate max-w-[150px]">
                                                {restaurants.find(r => r.id === product.restaurant)?.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Rating, Calories & Variants/Addons badges */}
                                <div className="flex items-center gap-3 mt-2 mb-3">
                                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {product.rating}
                                    </span>
                                    {product.calories > 0 && (
                                        <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                            {product.calories} cal
                                        </span>
                                    )}
                                    {product.variants?.length > 0 && (
                                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                            {product.variants.length} sizes
                                        </span>
                                    )}
                                    {product.addons?.length > 0 && (
                                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                                            {product.addons.length} add-ons
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mt-auto">
                                    {product.description || <span className="text-gray-400 italic">No description provided.</span>}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredProducts.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20 animate-fadeIn bg-white rounded-3xl border border-gray-100">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
                        <Package className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Found</h3>
                    <p className="text-gray-500 max-w-sm text-center mb-8">
                        {searchTerm ? `No matches found for "${searchTerm}".` : "Get started by adding your first product to the menu."}
                    </p>
                    <button onClick={() => openModal()} className="bg-primary hover:bg-orange-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 font-semibold transition-all">Add Product</button>
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
                title={editingProduct ? 'Edit Product' : 'Add New Product'}
                maxWidth="2xl"
            >
                {/* Tab Navigation */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
                    {[
                        { key: 'basic' as const, label: 'Product Info' },
                        { key: 'variants' as const, label: `Variants (${variants.length})` },
                        { key: 'addons' as const, label: `Add-ons (${addons.length})` },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* === BASIC TAB === */}
                    {activeTab === 'basic' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" placeholder="e.g. Double Cheeseburger" required />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price (KSh)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">KSh</span>
                                        <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" placeholder="0.00" required />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Discount (%)</label>
                                    <input type="number" min="0" max="100" value={formData.discount_percentage} onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" placeholder="0" />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all" required>
                                        <option value="">Select Category</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Restaurant (Optional)</label>
                                    <select value={formData.restaurant} onChange={(e) => setFormData({ ...formData, restaurant: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all">
                                        <option value="">Select Restaurant</option>
                                        {restaurants.map(rest => <option key={rest.id} value={rest.id}>{rest.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                                    <div className="relative">
                                        <Star className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" size={18} />
                                        <input type="number" min="0" max="5" step="0.1" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" placeholder="5.0" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Calories</label>
                                    <input type="number" min="0" value={formData.calories} onChange={(e) => setFormData({ ...formData, calories: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" placeholder="0 kcal" />
                                </div>

                                {/* Toggles */}
                                <div className="flex flex-wrap gap-4 col-span-1 md:col-span-2">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={formData.is_hot} onChange={(e) => setFormData({ ...formData, is_hot: e.target.checked })} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                        <span className="ml-2 text-sm font-medium text-gray-700 flex items-center gap-1"><Flame className="w-4 h-4 text-red-500" /> Hot Product</span>
                                    </label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={formData.is_promoted} onChange={(e) => setFormData({ ...formData, is_promoted: e.target.checked })} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                        <span className="ml-2 text-sm font-medium text-gray-700 flex items-center gap-1"><Zap className="w-4 h-4 text-orange-500" /> Promoted</span>
                                    </label>
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all min-h-[100px]" placeholder="Describe the ingredients and flavors..." />
                                </div>

                                {/* Image Upload */}
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product Image</label>
                                    <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group ${imagePreview ? 'border-primary/30 bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50'}`}>
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" required={!editingProduct && !imagePreview} />
                                        {imagePreview ? (
                                            <div className="relative h-64 flex items-center justify-center">
                                                <img src={imagePreview} alt="Preview" className="h-full object-contain drop-shadow-sm rounded-lg" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg text-white font-medium">Change Image</div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-4">
                                                <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:text-primary group-hover:shadow-md transition-all"><ImageIcon className="w-8 h-8" /></div>
                                                <p className="text-gray-900 font-medium">Click to upload image</p>
                                                <p className="text-sm text-gray-500 mt-1">PNG, JPG or GIF</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* === VARIANTS TAB === */}
                    {activeTab === 'variants' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900">Size Variants</h3>
                                    <p className="text-sm text-gray-500">e.g. Small, Medium, Large with different prices</p>
                                </div>
                                <button type="button" onClick={addVariant} className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all">
                                    <Plus className="w-4 h-4" /> Add Variant
                                </button>
                            </div>
                            {variants.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No variants added yet</p>
                                    <p className="text-sm text-gray-400">Variants let customers choose sizes like Small, Medium, Large</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {variants.map((variant, index) => (
                                        <div key={index} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl">
                                            <input type="text" value={variant.name} onChange={(e) => updateVariant(index, 'name', e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Size name (e.g. Large)" />
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">KSh</span>
                                                <input type="number" value={variant.price} onChange={(e) => updateVariant(index, 'price', e.target.value)} className="w-28 pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0" />
                                            </div>
                                            <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                                                <input type="radio" name="default_variant" checked={variant.is_default} onChange={() => updateVariant(index, 'is_default', true)} className="text-primary" />
                                                <span className="text-xs font-medium text-gray-600">Default</span>
                                            </label>
                                            <button type="button" onClick={() => removeVariant(index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><X className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">💡 Variants are read-only in the admin for now. Use Django Admin to manage them on existing products.</p>
                        </div>
                    )}

                    {/* === ADD-ONS TAB === */}
                    {activeTab === 'addons' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900">Add-ons</h3>
                                    <p className="text-sm text-gray-500">e.g. Extra Cheese, Extra Sauce</p>
                                </div>
                                <button type="button" onClick={addAddon} className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all">
                                    <Plus className="w-4 h-4" /> Add Add-on
                                </button>
                            </div>
                            {addons.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                                    <Plus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No add-ons added yet</p>
                                    <p className="text-sm text-gray-400">Add-ons let customers add extras to their order</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {addons.map((addon, index) => (
                                        <div key={index} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl">
                                            <input type="text" value={addon.name} onChange={(e) => updateAddon(index, 'name', e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Add-on name" />
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">KSh</span>
                                                <input type="number" value={addon.price} onChange={(e) => updateAddon(index, 'price', e.target.value)} className="w-28 pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0" />
                                            </div>
                                            <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                                                <input type="checkbox" checked={addon.is_available} onChange={(e) => updateAddon(index, 'is_available', e.target.checked)} className="w-4 h-4 text-green-500 rounded border-gray-300" />
                                                <span className="text-xs font-medium text-gray-600">Available</span>
                                            </label>
                                            <button type="button" onClick={() => removeAddon(index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><X className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">💡 Add-ons are read-only in the admin for now. Use Django Admin to manage them on existing products.</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <button type="button" onClick={closeModal} className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors focus:ring-4 focus:ring-gray-100">Cancel</button>
                        <button type="submit" className="px-8 py-3 bg-primary hover:bg-orange-600 text-white rounded-xl shadow-lg shadow-primary/30 transform active:scale-95 transition-all font-semibold focus:ring-4 focus:ring-primary/20">
                            {editingProduct ? 'Save Changes' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
