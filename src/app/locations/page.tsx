import React from 'react';
import { Metadata } from 'next';
import LocationSearch from '@/components/locations/LocationSearch';

export const metadata: Metadata = {
    title: 'Locations | Kobonz',
    description: 'Find coupons and deals in your local area',
};

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

            {/* Featured Locations (Placeholder/Static for initial launch) */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Popular Destinations</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {['New York', 'London', 'Dubai', 'Cairo', 'Paris', 'Tokyo', 'Berlin', 'Sydney'].map((city) => (
                        <div key={city} className="group relative overflow-hidden rounded-xl aspect-[4/3] bg-gray-200 cursor-pointer hover:shadow-xl transition-all">
                            {/* Fallback pattern/color since we might not have images yet */}
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
