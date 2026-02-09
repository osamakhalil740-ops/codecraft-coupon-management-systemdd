
import React, { useState, useEffect, useMemo } from 'react';
import { logger } from '../utils/logger';
import { api } from '../services/api';
import { Shop, Coupon } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Link } from 'react-router-dom';
import { 
    MapPinIcon, 
    PhoneIcon, 
    GlobeAltIcon, 
    TagIcon,
    StarIcon,
    TicketIcon,
    EyeIcon,
    ArrowLeftIcon,
    MagnifyingGlassIcon,
    BuildingStorefrontIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { getAllCountries, getCitiesForCountry } from '../services/locationService';
import AdvancedSearch, { SearchFilters } from '../components/AdvancedSearch';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

type ViewMode = 'marketplace' | 'shop-details';

const MarketplacePage: React.FC = () => {
    const { t } = useTranslation();
    const [shops, setShops] = useState<Shop[]>([]);
    const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    const [shopCoupons, setShopCoupons] = useState<Coupon[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('marketplace');
    const [loading, setLoading] = useState(true);
    const [shopLoading, setShopLoading] = useState(false);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [countryFilter, setCountryFilter] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
    
    // All available locations from system
    const [allSystemCountries, setAllSystemCountries] = useState<Array<{code: string, name: string}>>([]);
    const [allSystemCities, setAllSystemCities] = useState<Array<{id: string | number, name: string}>>([]);

    useEffect(() => {
        const initializeData = async () => {
            try {
                setLoading(true);
                
                // Load countries from global location service
                const countries = await getAllCountries();
                setAllSystemCountries(countries);
                
                // Fetch shops
                const allShops = await api.getAllShops();
                // Only show shops that are publicly visible and have shop-owner role
                const publicShops = allShops.filter(shop => 
                    shop.roles.includes('shop-owner') && 
                    shop.country && 
                    shop.city
                );
                setShops(publicShops);
                setFilteredShops(publicShops);
            } catch (error) {
                logger.error('Failed to fetch shops:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeData();
    }, []);

    // Load cities when country filter changes
    useEffect(() => {
        const loadCities = async () => {
            if (countryFilter) {
                // Load ALL cities for selected country from GeoNames
                const cities = await getCitiesForCountry(countryFilter);
                setAllSystemCities(cities);
                // Reset city filter if it's not valid for the new country
                const cityNames = cities.map(c => c.name);
                if (cityFilter && !cityNames.includes(cityFilter)) {
                    setCityFilter('');
                }
            } else {
                setAllSystemCities([]);
            }
        };
        
        loadCities();
    }, [countryFilter, cityFilter]);

    useEffect(() => {
        let filtered = shops;

        if (searchQuery) {
            filtered = filtered.filter(shop => 
                shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                shop.shopDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                shop.category?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (countryFilter) {
            filtered = filtered.filter(shop => 
                shop.country?.toLowerCase().includes(countryFilter.toLowerCase())
            );
        }

        if (cityFilter) {
            filtered = filtered.filter(shop => 
                shop.city?.toLowerCase().includes(cityFilter.toLowerCase())
            );
        }

        if (categoryFilter) {
            filtered = filtered.filter(shop => 
                shop.category?.toLowerCase().includes(categoryFilter.toLowerCase())
            );
        }

        setFilteredShops(filtered);
    }, [countryFilter, cityFilter, categoryFilter, searchQuery, shops]);

    const handleShopClick = async (shop: Shop) => {
        setShopLoading(true);
        setSelectedShop(shop);
        setViewMode('shop-details');
        
        try {
            const coupons = await api.getCouponsForShop(shop.id);
            // Filter to only active coupons
            const activeCoupons = coupons.filter(coupon => 
                coupon.usesLeft > 0 && 
                (!coupon.expiryDate || new Date(coupon.expiryDate) > new Date())
            );
            setShopCoupons(activeCoupons);
        } catch (error) {
            logger.error('Failed to fetch shop coupons:', error);
            setShopCoupons([]);
        } finally {
            setShopLoading(false);
        }
    };

    const handleBackToMarketplace = () => {
        setViewMode('marketplace');
        setSelectedShop(null);
        setShopCoupons([]);
    };

    const getFullAddress = (shop: Shop) => {
        return [shop.addressLine1, shop.addressLine2, shop.city, shop.state, shop.postalCode, shop.country]
            .filter(Boolean)
            .join(', ');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
                <div className="glass-panel p-8 text-center animate-bounceIn">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mx-auto mb-4 animate-float"></div>
                    <p className="text-lg text-gray-600 font-medium">Discovering amazing shops...</p>
                </div>
            </div>
        );
    }

    // Get unique values for filters
    const categories = [...new Set(shops.map(shop => shop.category).filter(Boolean))];

    if (viewMode === 'shop-details' && selectedShop) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 animate-fadeIn">
                {/* Shop Details Header */}
                <div className="bg-white shadow-soft border-b">
                    <div className="max-w-7xl mx-auto px-4 py-6">
                        <div className="flex items-center gap-4 mb-6">
                            <button 
                                onClick={handleBackToMarketplace}
                                className="flex items-center gap-2 text-gray-600 hover:text-brand-primary transition-colors btn-secondary"
                            >
                                <ArrowLeftIcon className="h-5 w-5" />
                                Back to Marketplace
                            </button>
                        </div>
                        
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <BuildingStorefrontIcon className="h-8 w-8 text-brand-primary" />
                                    <h1 className="text-4xl font-bold marketplace-shop-name">{selectedShop.name}</h1>
                                </div>
                                
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                                    {selectedShop.city && selectedShop.country && (
                                        <div className="flex items-center gap-1">
                                            <MapPinIcon className="h-4 w-4" />
                                            {selectedShop.city}, {selectedShop.country}
                                        </div>
                                    )}
                                    {selectedShop.category && (
                                        <div className="flex items-center gap-1">
                                            <TagIcon className="h-4 w-4" />
                                            {selectedShop.category}
                                        </div>
                                    )}
                                </div>
                                
                                {selectedShop.shopDescription && (
                                    <p className="text-gray-700 text-lg leading-relaxed max-w-2xl">
                                        {selectedShop.shopDescription}
                                    </p>
                                )}
                            </div>
                            
                            <div className="flex flex-col items-center gap-3">
                                <div className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-6 py-3 rounded-2xl shadow-soft">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold">{shopCoupons.length}</div>
                                        <div className="text-sm opacity-90">Active Deals</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-amber-500">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <StarIcon key={star} className="h-4 w-4 fill-current" />
                                    ))}
                                    <span className="text-sm text-gray-600 ml-1">Featured Shop</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Shop Information Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="glass-panel p-6 animate-slideInLeft">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <BuildingStorefrontIcon className="h-6 w-6 text-brand-primary" />
                                    Shop Details
                                </h3>
                                
                                <div className="space-y-4">
                                    {getFullAddress(selectedShop) && (
                                        <div className="flex items-start gap-3">
                                            <MapPinIcon className="h-5 w-5 text-brand-success mt-1" />
                                            <div>
                                                <p className="font-medium text-gray-800">Address</p>
                                                <p className="text-gray-600 text-sm leading-relaxed">{getFullAddress(selectedShop)}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {selectedShop.phone && (
                                        <div className="flex items-center gap-3">
                                            <PhoneIcon className="h-5 w-5 text-brand-success" />
                                            <div>
                                                <p className="font-medium text-gray-800">Phone</p>
                                                <a href={`tel:${selectedShop.phone}`} className="text-brand-primary hover:underline text-sm">
                                                    {selectedShop.phone}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {selectedShop.website && (
                                        <div className="flex items-center gap-3">
                                            <GlobeAltIcon className="h-5 w-5 text-brand-success" />
                                            <div>
                                                <p className="font-medium text-gray-800">Website</p>
                                                <a 
                                                    href={selectedShop.website} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-brand-primary hover:underline text-sm"
                                                >
                                                    Visit Website
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {selectedShop.category && (
                                        <div className="flex items-center gap-3">
                                            <TagIcon className="h-5 w-5 text-brand-success" />
                                            <div>
                                                <p className="font-medium text-gray-800">Category</p>
                                                <span className="badge-success">{selectedShop.category}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Shop Coupons */}
                        <div className="lg:col-span-3">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-3xl font-bold flex items-center gap-3">
                                    <SparklesIcon className="h-8 w-8 text-amber-500" />
                                    Available Deals
                                </h2>
                                <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-full shadow-soft">
                                    {shopCoupons.length} exclusive offers
                                </div>
                            </div>
                            
                            {shopLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="glass-panel p-6 animate-pulse">
                                            <div className="h-6 bg-gray-200 rounded mb-3"></div>
                                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                                            <div className="h-10 bg-gray-200 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : shopCoupons.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {shopCoupons.map((coupon, index) => (
                                        <div 
                                            key={coupon.id} 
                                            className="glass-panel p-6 card-hover animate-slideInUp"
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-xl font-bold text-gray-800 flex-1 mr-4 line-clamp-2">{coupon.title}</h3>
                                                <div className="text-right">
                                                    <div className="text-3xl font-bold gradient-text-2">
                                                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-medium">OFF</div>
                                                </div>
                                            </div>
                                            
                                            <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{coupon.description}</p>
                                            
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-5">
                                                <div className="flex items-center gap-1">
                                                    <TicketIcon className="h-4 w-4" />
                                                    <span className="font-medium">{coupon.usesLeft} remaining</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <EyeIcon className="h-4 w-4" />
                                                    <span>{coupon.clicks} views</span>
                                                </div>
                                                {coupon.customerRewardPoints > 0 && (
                                                    <div className="flex items-center gap-1 text-amber-600">
                                                        <SparklesIcon className="h-4 w-4" />
                                                        <span>+{coupon.customerRewardPoints} pts</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <Link
                                                to={`/coupon/${coupon.id}`}
                                                className="btn-calm w-full text-center block"
                                            >
                                                Get This Deal
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="glass-panel p-12 text-center animate-bounceIn">
                                    <TicketIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-gray-700 mb-2">No Active Deals</h3>
                                    <p className="text-gray-600">This shop doesn't have any active coupons at the moment. Check back soon for new offers!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="marketplace-container min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 animate-fadeIn">
            {/* Marketplace Header */}
            <div className="bg-white shadow-soft border-b">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-6 text-balance">Discover Local Shops</h1>
                        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Explore amazing deals from trusted local businesses in your area and save money while supporting your community
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Enhanced Search and Filters */}
                <div className="glass-panel p-6 mb-8 animate-slideInUp">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2 lg:col-span-1 relative">
                            <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search shops..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="form-input pl-12 w-full"
                            />
                        </div>

                        {/* Country Filter */}
                        <div className="relative">
                            <MapPinIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <select 
                                value={countryFilter} 
                                onChange={(e) => setCountryFilter(e.target.value)}
                                className="form-input pl-12 w-full appearance-none cursor-pointer"
                            >
                                <option value="">All Countries</option>
                                {allSystemCountries.map(country => (
                                    <option key={country.code} value={country.code}>{country.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* City Filter */}
                        <div className="relative">
                            <MapPinIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <select 
                                value={cityFilter} 
                                onChange={(e) => setCityFilter(e.target.value)}
                                className="form-input pl-12 w-full appearance-none cursor-pointer"
                                disabled={allSystemCities.length === 0}
                            >
                                <option value="">
                                    {allSystemCities.length === 0 ? 'Loading cities...' : 'All Cities'}
                                </option>
                                {allSystemCities.map(city => (
                                    <option key={city.id} value={city.name}>{city.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div className="relative">
                            <TagIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <select 
                                value={categoryFilter} 
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="form-input pl-12 w-full appearance-none cursor-pointer"
                            >
                                <option value="">All Categories</option>
                                {categories.sort().map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Summary */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                        {filteredShops.length} {filteredShops.length === 1 ? 'Shop' : 'Shops'} Found
                    </h2>
                    <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-full shadow-soft border border-gray-100">
                        💡 Click on any shop to explore their exclusive deals
                    </div>
                </div>

                {/* Shop Grid */}
                <div className="marketplace-grid">
                    {filteredShops.map((shop, index) => (
                        <div 
                            key={shop.id} 
                            className="marketplace-shop-card cursor-pointer group animate-slideInUp"
                            onClick={() => handleShopClick(shop)}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="marketplace-shop-title text-xl font-bold text-gray-800 flex-1 mr-4">
                                    {shop.name}
                                </h3>
                                {shop.category && (
                                    <span className="marketplace-category-pill text-xs shrink-0">
                                        {shop.category}
                                    </span>
                                )}
                            </div>

                            {shop.shopDescription && (
                                <p className="text-gray-600 text-sm mb-5 line-clamp-3 leading-relaxed">{shop.shopDescription}</p>
                            )}

                            <div className="space-y-3 mb-6">
                                {shop.city && shop.country && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPinIcon className="h-4 w-4 text-brand-primary" />
                                        {shop.city}, {shop.country}
                                    </div>
                                )}
                                {shop.phone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <PhoneIcon className="h-4 w-4 text-brand-primary" />
                                        Contact Available
                                    </div>
                                )}
                                {shop.website && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <GlobeAltIcon className="h-4 w-4 text-brand-primary" />
                                        Website Available
                                    </div>
                                )}
                            </div>

                            <button className="marketplace-view-btn w-full">
                                <BuildingStorefrontIcon className="h-5 w-5" />
                                Explore Shop & Deals
                            </button>
                        </div>
                    ))}
                </div>

                {filteredShops.length === 0 && (
                    <div className="text-center py-16">
                        <div className="glass-panel p-12 max-w-md mx-auto animate-bounceIn">
                            <MagnifyingGlassIcon className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-gray-700 mb-3">No Shops Found</h3>
                            <p className="text-gray-600 leading-relaxed">
                                We couldn't find any shops matching your criteria. Try adjusting your search or filters to discover more local businesses.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketplacePage;