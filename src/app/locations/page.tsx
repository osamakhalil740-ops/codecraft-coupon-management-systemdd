import React from 'react';
import { Metadata } from 'next';
import LocationSearch from '@/components/locations/LocationSearch';

export const metadata: Metadata = {
    title: 'Locations | Kobonz',
    description: 'Find coupons and deals in your local area',
};

// Mock Data for Categories
const CATEGORIES = [
    { id: 'food', name: 'Food & Dining', icon: '🍔', count: 120 },
    { id: 'fashion', name: 'Fashion', icon: '👗', count: 85 },
    { id: 'electronics', name: 'Electronics', icon: '📱', count: 45 },
    { id: 'beauty', name: 'Beauty & Spa', icon: '💅', count: 32 },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', count: 28 },
    { id: 'services', name: 'Services', icon: '🔧', count: 15 },
];

// Mock Data for Featured Stores
const FEATURED_STORES = [
    { id: 1, name: 'H&M', location: 'Dubai Mall', offer: 'Up to 50% Off', image: 'https://images.unsplash.com/photo-1579298245158-33e8f568f7d3?w=800&q=80', category: 'Fashion' },
    { id: 2, name: 'Starbucks', location: 'Downtown Cairo', offer: 'Buy 1 Get 1 Free', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80', category: 'Food & Dining' },
    { id: 3, name: 'Zara', location: 'London Oxford St', offer: 'Summer Sale', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80', category: 'Fashion' },
    { id: 4, name: 'Sephora', location: 'Paris', offer: 'Free Gift', image: 'https://images.unsplash.com/photo-1522335789203-abd7fe01d1f5?w=800&q=80', category: 'Beauty' },
];

export default function LocationsPage() {
    return (
        <main className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-brand-primary py-20 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 opacity-10 pattern-dots"></div>
                <div className="relative max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
                        Explore Local Deals
                    </h1>
                    <p className="text-xl text-white/90 max-w-2xl mx-auto mb-10">
                        Discover verified coupons and offers from thousands of businesses in cities worldwide.
                    </p>

                    <LocationSearch />
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {CATEGORIES.map((cat) => (
                        <div key={cat.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-primary/30 transition-all cursor-pointer group text-center">
                            <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform">{cat.icon}</span>
                            <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                            <p className="text-xs text-gray-500">{cat.count} locations</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Featured Stores Section */}
            <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white rounded-2xl shadow-sm my-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Featured Stores Near You</h2>
                    <a href="/stores" className="text-brand-primary font-semibold hover:underline">View All &rarr;</a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {FEATURED_STORES.map((store) => (
                        <div key={store.id} className="group relative bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                            <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                                {/* Using a colored div as placeholder for images to avoid broken links if specific Unsplash IDs change, though these are standard */}
                                <div
                                    className="w-full h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                                    style={{ backgroundImage: `url(${store.image})` }}
                                ></div>
                            </div>
                            <div className="p-4">
                                <div className="text-xs font-bold text-brand-primary mb-1 uppercase tracking-wide">{store.category}</div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{store.name}</h3>
                                <div className="flex items-center text-gray-500 text-sm mb-3">
                                    <span>📍 {store.location}</span>
                                </div>
                                <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold inline-block border border-green-100">
                                    {store.offer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Popular Destinations (Existing) */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Popular Destinations</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {['New York', 'London', 'Dubai', 'Cairo', 'Paris', 'Tokyo', 'Berlin', 'Sydney'].map((city) => (
                        <div key={city} className="group relative overflow-hidden rounded-xl aspect-[4/3] bg-gray-200 cursor-pointer hover:shadow-xl transition-all">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/80 to-purple-600/80 group-hover:scale-105 transition-transform duration-500"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white font-bold text-xl drop-shadow-md">{city}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
