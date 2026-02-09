import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Coupon } from '../types';
import CouponCard from '../components/CouponCard';
import { 
  MapPinIcon, 
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { logger } from '../utils/logger';

const LocationCouponsPage: React.FC = () => {
  const { country, city, area } = useParams<{ country?: string; city?: string; area?: string }>();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [includeGlobalCoupons, setIncludeGlobalCoupons] = useState(false);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        const allCoupons = await api.getAllCoupons();
        
        // STRICT FILTERING: Only show coupons explicitly assigned to this location
        const filtered = allCoupons.filter(coupon => {
          // Handle global coupons based on user toggle
          if (coupon.isGlobal === true) {
            return includeGlobalCoupons; // Only show if user enabled the toggle
          }
          
          // If filtering by area (most specific level)
          if (area) {
            // Coupon MUST have this exact area explicitly listed
            if (coupon.areas && coupon.areas.length > 0) {
              return coupon.areas.includes(area);
            }
            // If no areas specified on coupon, it doesn't match this area filter
            return false;
          }
          
          // If filtering by city (medium specificity)
          if (city) {
            // Coupon MUST have this exact city explicitly listed
            if (coupon.cities && coupon.cities.length > 0) {
              return coupon.cities.includes(city);
            }
            // If no cities specified on coupon, it doesn't match this city filter
            return false;
          }
          
          // If filtering by country only (least specific)
          if (country) {
            // Coupon MUST have this exact country explicitly listed
            if (coupon.countries && coupon.countries.length > 0) {
              return coupon.countries.includes(country);
            }
            // If no countries specified on coupon, it doesn't match this country filter
            return false;
          }
          
          // If no location filter is applied, show all coupons
          return true;
        });
        
        setCoupons(filtered);
        logger.debug(`Strict filtered coupons for location (country: ${country}, city: ${city}, area: ${area}, includeGlobal: ${includeGlobalCoupons}): ${filtered.length} results`);
      } catch (error) {
        logger.error('Error fetching coupons:', error);
        setCoupons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, [country, city, area, includeGlobalCoupons]);

  const filteredCoupons = coupons.filter(coupon =>
    coupon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coupon.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const breadcrumbs = [
    { label: 'All Locations', path: '/locations' },
    ...(country ? [{ label: country, path: `/locations/${encodeURIComponent(country)}` }] : []),
    ...(city ? [{ label: city, path: `/locations/${encodeURIComponent(country!)}/${encodeURIComponent(city)}` }] : []),
    ...(area ? [{ label: area, path: `/locations/${encodeURIComponent(country!)}/${encodeURIComponent(city!)}/${encodeURIComponent(area)}` }] : [])
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              {index > 0 && <span className="text-gray-400">/</span>}
              <Link
                to={crumb.path}
                className={`${
                  index === breadcrumbs.length - 1
                    ? 'text-purple-600 font-semibold'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </div>

        {/* Header */}
        <div className="glass-panel p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <MapPinIcon className="h-10 w-10 text-purple-500" />
            <div>
              <h1 className="text-4xl font-bold text-gray-800">
                {area || city || country || 'All Locations'}
              </h1>
              <p className="text-gray-600 mt-1">
                {loading ? 'Loading...' : `${filteredCoupons.length} deals available`}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-6">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals in this location..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
            />
          </div>
          
          {/* Global Coupons Toggle */}
          <div className="mt-4 flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 rounded-xl border-2 border-blue-200">
            <input
              id="global-toggle"
              type="checkbox"
              checked={includeGlobalCoupons}
              onChange={(e) => setIncludeGlobalCoupons(e.target.checked)}
              className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
            />
            <label htmlFor="global-toggle" className="flex items-center gap-2 cursor-pointer flex-1">
              <GlobeAltIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                Also show worldwide deals (valid globally)
              </span>
            </label>
            {includeGlobalCoupons && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                Active
              </span>
            )}
          </div>
        </div>

        {/* Coupons Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading deals...</p>
          </div>
        ) : filteredCoupons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoupons.map(coupon => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))}
          </div>
        ) : (
          <div className="glass-panel p-12 text-center">
            <MagnifyingGlassIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Deals Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'There are no deals available in this location yet'}
            </p>
            <Link to="/locations" className="btn-primary inline-flex items-center gap-2">
              <ArrowLeftIcon className="h-5 w-5" />
              Browse Other Locations
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationCouponsPage;
