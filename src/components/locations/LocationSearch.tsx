'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/context/I18nContext';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface GeonameResult {
    geonameId: number;
    name: string;
    countryName: string;
    countryCode: string;
    adminName1: string;
    fcodeName: string;
}

export default function LocationSearch() {
    const { t, language } = useTranslation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GeonameResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const searchLocations = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError('');

        try {
            const username = process.env.NEXT_PUBLIC_GEONAMES_USERNAME;
            if (!username) {
                throw new Error('Geonames username not configured');
            }

            // Geonames Search API
            const response = await fetch(
                `http://api.geonames.org/searchJSON?q=${encodeURIComponent(query)}&maxRows=10&username=${username}&style=FULL&lang=${language}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch locations');
            }

            const data = await response.json();

            if (data.geonames) {
                setResults(data.geonames);
            } else {
                setResults([]);
            }
        } catch (err) {
            console.error('Search error:', err);
            setError(t('common.error') || 'An error occurred while searching');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Search Bar */}
            <form onSubmit={searchLocations} className="relative mb-8">
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('search.placeholder') || "Search for a city or country..."}
                        className="w-full px-6 py-4 pl-14 text-lg bg-white border border-gray-200 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                    />
                    <MagnifyingGlassIcon className={`absolute top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 ${language === 'ar' ? 'right-5' : 'left-5'}`} />
                    <button
                        type="submit"
                        disabled={loading}
                        className={`absolute top-2 bottom-2 px-6 bg-brand-primary text-white font-semibold rounded-full hover:bg-brand-primary/90 transition-colors disabled:opacity-50 ${language === 'ar' ? 'left-2' : 'right-2'}`}
                    >
                        {loading ? (t('common.loading') || 'Searching...') : (t('common.search') || 'Search')}
                    </button>
                </div>
            </form>

            {/* Results Grid */}
            {error && (
                <div className="text-center p-4 text-red-600 bg-red-50 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {results.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
                    {results.map((place) => (
                        <Link
                            key={place.geonameId}
                            href={`/locations/${place.countryCode}/${place.name}`}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-primary/30 transition-all group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-brand-primary/5 rounded-lg text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                    <MapPinIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-brand-primary transition-colors">
                                        {place.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {place.adminName1 ? `${place.adminName1}, ` : ''}{place.countryName}
                                    </p>
                                    <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                        {place.fcodeName}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {!loading && query && results.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <p>{t('common.no_results') || 'No locations found'}</p>
                </div>
            )}
        </div>
    );
}
