import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

interface SearchFilter {
    key: string;
    label: string;
    type: 'select' | 'date' | 'number' | 'text';
    options?: { value: string; label: string; }[];
    value?: any;
}

interface EnhancedSearchProps {
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    onSearch?: (query: string, filters: Record<string, any>) => void;
    filters?: SearchFilter[];
    suggestions?: string[];
    showFilters?: boolean;
    className?: string;
}

const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
    placeholder = 'Search...',
    value,
    onChange,
    onSearch,
    filters = [],
    suggestions = [],
    showFilters = false,
    className = ''
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filterValues, setFilterValues] = useState<Record<string, any>>({});
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (value && suggestions.length > 0) {
            const filtered = suggestions.filter(suggestion =>
                suggestion.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 5);
            setFilteredSuggestions(filtered);
            setShowSuggestions(filtered.length > 0 && isFocused);
        } else {
            setShowSuggestions(false);
        }
    }, [value, suggestions, isFocused]);

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

    const handleSearch = () => {
        if (onSearch) {
            onSearch(value, filterValues);
        }
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setShowFilterPanel(false);
            inputRef.current?.blur();
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        onChange(suggestion);
        setShowSuggestions(false);
        handleSearch();
    };

    const clearSearch = () => {
        onChange('');
        setFilterValues({});
        if (onSearch) {
            onSearch('', {});
        }
        inputRef.current?.focus();
    };

    const updateFilter = (key: string, filterValue: any) => {
        const newFilters = { ...filterValues, [key]: filterValue };
        setFilterValues(newFilters);
    };

    const activeFiltersCount = Object.values(filterValues).filter(v => v && v !== '').length;

    return (
        <div ref={searchRef} className={`enhanced-search relative ${className}`}>
            {/* Main Search Input */}
            <div className="relative">
                <div className="relative flex items-center">
                    <MagnifyingGlassIcon className="absolute left-4 h-5 w-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="search-input w-full pl-12 pr-20 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition-all duration-200"
                    />
                    
                    {/* Clear and Filter Buttons */}
                    <div className="absolute right-3 flex items-center space-x-2">
                        {value && (
                            <button
                                onClick={clearSearch}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                                title="Clear search"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        )}
                        
                        {showFilters && filters.length > 0 && (
                            <button
                                onClick={() => setShowFilterPanel(!showFilterPanel)}
                                className={`p-2 rounded-lg transition-colors relative ${
                                    showFilterPanel ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                }`}
                                title="Filters"
                            >
                                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                                {activeFiltersCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Search Suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                    {filteredSuggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                            <div className="flex items-center space-x-3">
                                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                                <span>{suggestion}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Filter Panel */}
            {showFilterPanel && filters.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-40 p-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">Filters</h4>
                            {activeFiltersCount > 0 && (
                                <button
                                    onClick={() => setFilterValues({})}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filters.map((filter) => (
                                <div key={filter.key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {filter.label}
                                    </label>
                                    
                                    {filter.type === 'select' && filter.options && (
                                        <select
                                            value={filterValues[filter.key] || ''}
                                            onChange={(e) => updateFilter(filter.key, e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="">All</option>
                                            {filter.options.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    
                                    {filter.type === 'text' && (
                                        <input
                                            type="text"
                                            value={filterValues[filter.key] || ''}
                                            onChange={(e) => updateFilter(filter.key, e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                            placeholder={`Enter ${filter.label.toLowerCase()}`}
                                        />
                                    )}
                                    
                                    {filter.type === 'date' && (
                                        <input
                                            type="date"
                                            value={filterValues[filter.key] || ''}
                                            onChange={(e) => updateFilter(filter.key, e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
                            <button
                                onClick={() => setShowFilterPanel(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSearch}
                                className="interactive-button px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedSearch;