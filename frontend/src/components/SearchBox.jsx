import React, { useState, useEffect, useCallback } from 'react';
import { searchLocations } from '../services/api';
import { debounce } from '../utils/helpers';

function SearchBox({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery) => {
      if (searchQuery.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await searchLocations(searchQuery);
        if (response.success) {
          setResults(response.data);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleSelect = (location) => {
    setQuery(location.city || location.name);
    setIsOpen(false);
    onSelect(location);
  };

  const handleBlur = () => {
    // Delay closing to allow click on results
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={handleBlur}
          placeholder="Search city..."
          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pl-9 sm:pl-10 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-sm sm:text-base shadow-sm"
        />
        
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50 max-h-60 sm:max-h-80 overflow-y-auto">
          {results.map((location) => (
            <button
              key={location._id}
              onClick={() => handleSelect(location)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-slate-50 transition-colors flex items-center gap-2 sm:gap-3 border-b border-slate-100 last:border-0"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 font-medium text-sm sm:text-base truncate">{location.name}</p>
                <p className="text-slate-500 text-xs sm:text-sm truncate">
                  {location.city}, {location.country}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl p-3 sm:p-4 z-50">
          <p className="text-slate-500 text-center text-sm">No locations found</p>
        </div>
      )}
    </div>
  );
}

export default SearchBox;
