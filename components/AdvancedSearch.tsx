import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'shop' | 'category' | 'location' | 'coupon';
  icon?: React.ReactNode;
}

interface AdvancedSearchProps {
  placeholder?: string;
  onSearch: (query: string, filters: SearchFilters) => void;
  suggestions?: SearchSuggestion[];
  showFilters?: boolean;
  className?: string;
}

export interface SearchFilters {
  category?: string;
  location?: string;
  discountRange?: [number, number];
  sortBy?: 'relevance' | 'discount' | 'popular' | 'recent' | 'expiring';
  availability?: 'all' | 'active' | 'expiring';
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  placeholder = "Search shops, coupons, or categories...",
  onSearch,
  suggestions = [],
  showFilters = true,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'relevance',
    availability: 'all'
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kobonz_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowFilterPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      // Save to recent searches
      const updated = [finalQuery, ...recentSearches.filter(s => s !== finalQuery)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('kobonz_recent_searches', JSON.stringify(updated));
      
      onSearch(finalQuery, filters);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(value.length > 0 || recentSearches.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setShowFilterPanel(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setFilters({ sortBy: 'relevance', availability: 'all' });
    onSearch('', { sortBy: 'relevance', availability: 'all' });
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('kobonz_recent_searches');
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (query) {
      onSearch(query, newFilters);
    }
  };

  const filteredSuggestions = suggestions.filter(s => 
    s.text.toLowerCase().includes(query.toLowerCase())
  );

  const hasActiveFilters = filters.category || filters.location || 
    filters.discountRange || filters.sortBy !== 'relevance' || 
    filters.availability !== 'all';

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Main Search Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="form-input pl-12 pr-24 w-full text-base"
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={clearSearch}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              type="button"
            >
              <XMarkIcon className="h-4 w-4 text-gray-400" />
            </button>
          )}
          
          {showFilters && (
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`p-2 rounded-full transition-colors ${
                hasActiveFilters 
                  ? 'bg-brand-primary text-white hover:bg-brand-primary-dark' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              type="button"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto animate-fadeIn">
          {/* Recent Searches */}
          {recentSearches.length > 0 && query === '' && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Recent Searches</span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-brand-primary hover:text-brand-primary-dark"
                >
                  Clear All
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setQuery(search);
                    handleSearch(search);
                  }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-md cursor-pointer text-sm text-gray-700"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                  <span>{search}</span>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {filteredSuggestions.length > 0 && (
            <div className="p-3">
              <span className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Suggestions</span>
              {filteredSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => {
                    setQuery(suggestion.text);
                    handleSearch(suggestion.text);
                  }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-md cursor-pointer text-sm"
                >
                  {suggestion.icon || <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />}
                  <span className="text-gray-700">{suggestion.text}</span>
                  <span className="ml-auto text-xs text-gray-400 capitalize">{suggestion.type}</span>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {query && filteredSuggestions.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No suggestions found</p>
              <p className="text-xs mt-1">Press Enter to search</p>
            </div>
          )}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilterPanel && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <button
              onClick={() => setShowFilterPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="form-input w-full"
              >
                <option value="relevance">Most Relevant</option>
                <option value="discount">Highest Discount</option>
                <option value="popular">Most Popular</option>
                <option value="recent">Recently Added</option>
                <option value="expiring">Expiring Soon</option>
              </select>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateFilter('availability', 'all')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    filters.availability === 'all'
                      ? 'bg-brand-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => updateFilter('availability', 'active')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    filters.availability === 'active'
                      ? 'bg-brand-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => updateFilter('availability', 'expiring')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    filters.availability === 'expiring'
                      ? 'bg-brand-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Expiring Soon
                </button>
              </div>
            </div>

            {/* Discount Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Discount: {filters.discountRange?.[0] || 0}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={filters.discountRange?.[0] || 0}
                onChange={(e) => updateFilter('discountRange', [parseInt(e.target.value), 100])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setFilters({ sortBy: 'relevance', availability: 'all' });
                  onSearch(query, { sortBy: 'relevance', availability: 'all' });
                }}
                className="w-full py-2 text-sm text-brand-primary hover:text-brand-primary-dark font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
