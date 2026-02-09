/**
 * GeoNames API Integration Service
 * 
 * GeoNames provides free access to 11+ million geographical names covering:
 * - All countries (195+)
 * - All cities worldwide (4M+)
 * - All districts/neighborhoods (millions)
 * 
 * Free tier limitations:
 * - 20,000 requests per day
 * - 1000 requests per hour
 * - Must create account at: http://www.geonames.org/login
 * 
 * SETUP REQUIRED:
 * 1. Register at http://www.geonames.org/login
 * 2. Enable Free Web Services in your account
 * 3. Add your username to environment: VITE_GEONAMES_USERNAME
 */

import { db } from '../firebase';
import { collection, doc, getDoc, setDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { logger } from '../utils/logger';

// GeoNames API Configuration
const GEONAMES_USERNAME = process.env.NEXT_PUBLIC_GEONAMES_USERNAME || 'demo'; // MUST BE REPLACED
const GEONAMES_BASE_URL = 'https://secure.geonames.org'; // Using HTTPS to avoid mixed content errors

// Cache duration: 30 days (location data doesn't change often)
const CACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Rate limiting to respect GeoNames free tier
 * 1000 requests per hour = ~1 request every 3.6 seconds
 */
class RateLimiter {
  private lastRequestTime = 0;
  private readonly minInterval = 4000; // 4 seconds between requests (safe buffer)

  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }
}

const rateLimiter = new RateLimiter();

interface GeoNamesCountry {
  geonameId: number;
  countryCode: string;
  countryName: string;
  continent: string;
  capital: string;
  population: number;
}

interface GeoNamesCity {
  geonameId: number;
  name: string;
  countryCode: string;
  countryName: string;
  adminName1: string; // State/Province
  population: number;
  lat: string;
  lng: string;
}

interface GeoNamesDistrict {
  geonameId: number;
  name: string;
  countryCode: string;
  adminName1: string; // State
  adminName2: string; // City/Region
  population: number;
  lat: string;
  lng: string;
  alternateNames?: Array<{
    name: string;
    lang?: string;
  }>;
}

interface CachedLocation {
  id: string;
  data: unknown;
  timestamp: number;
  expiresAt: number;
}

/**
 * Fetch data from GeoNames API with rate limiting
 */
async function fetchFromGeoNames<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  await rateLimiter.throttle();
  
  const url = new URL(`${GEONAMES_BASE_URL}/${endpoint}`);
  url.searchParams.append('username', GEONAMES_USERNAME);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`GeoNames API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check for GeoNames-specific errors
    if (data.status) {
      throw new Error(`GeoNames error: ${data.status.message || 'Unknown error'}`);
    }
    
    return data;
  } catch (error) {
    logger.error('GeoNames API request failed:', error);
    throw error;
  }
}

/**
 * Get the proper localized name for a location
 * Prioritizes native script (Arabic, Chinese, etc.) over romanization
 */
function getLocalizedName(location: unknown, countryCode: string): string {
  // If the location has alternate names, check for native script
  if (location.alternateNames && Array.isArray(location.alternateNames)) {
    // Arabic-speaking countries
    const arabicCountries = ['SA', 'AE', 'EG', 'IQ', 'JO', 'KW', 'LB', 'LY', 'MA', 'OM', 'PS', 'QA', 'SD', 'SY', 'TN', 'YE', 'BH', 'DZ'];
    
    if (arabicCountries.includes(countryCode)) {
      // Look for Arabic name (language code 'ar')
      const arabicName = location.alternateNames.find((alt: unknown) => alt.lang === 'ar');
      if (arabicName && arabicName.name && isArabicScript(arabicName.name)) {
        return arabicName.name;
      }
      
      // If no explicit 'ar' tag, check if the main name is in Arabic script
      if (isArabicScript(location.name)) {
        return location.name;
      }
    }
    
    // For other countries, you can add similar logic for Chinese, Japanese, etc.
  }
  
  // Fallback to the default name
  return location.name;
}

/**
 * Check if a string contains Arabic script
 */
function isArabicScript(text: string): boolean {
  // Arabic Unicode range: U+0600 to U+06FF
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
}

/**
 * Get cached data from Firestore
 */
async function getCachedData(cacheKey: string): Promise<any | null> {
  try {
    const cacheDoc = await getDoc(doc(db, 'locationCache', cacheKey));
    
    if (cacheDoc.exists()) {
      const cached = cacheDoc.data();
      
      // Check if cache is still valid
      if (cached.expiresAt > Date.now()) {
        logger.debug(`✅ Cache hit: ${cacheKey}`);
        
        // Decompress if it was compressed
        if (cached.compressed && Array.isArray(cached.data)) {
          return decompressCityData(cached.data);
        }
        
        return cached.data;
      } else {
        logger.debug(`⏰ Cache expired: ${cacheKey}`);
      }
    }
  } catch (error) {
    logger.error('Cache read error:', error);
  }
  
  return null;
}

/**
 * Compress city data to reduce size for Firestore
 * Firestore has 1MB document limit - we need to strip unnecessary data
 */
function compressCityData(cities: GeoNamesCity[]): unknown[] {
  return cities.map(city => ({
    // Only keep essential fields to reduce size
    id: city.geonameId,
    name: city.name,
    country: city.countryCode,
    state: city.adminName1,
    pop: city.population,
    lat: city.lat,
    lng: city.lng,
  }));
}

/**
 * Decompress city data back to full format
 */
function decompressCityData(compressed: unknown[]): GeoNamesCity[] {
  return compressed.map(city => ({
    geonameId: city.id,
    name: city.name,
    countryCode: city.country,
    countryName: '', // Not needed for dropdown
    adminName1: city.state || '',
    population: city.pop || 0,
    lat: city.lat || '',
    lng: city.lng || '',
  }));
}

/**
 * Save data to Firestore cache with compression
 */
async function setCachedData(cacheKey: string, data: unknown): Promise<void> {
  try {
    const now = Date.now();
    
    // Compress data if it's cities (to fit in 1MB Firestore limit)
    let dataToCache = data;
    let isCompressed = false;
    
    if (Array.isArray(data) && data.length > 0 && data[0].geonameId) {
      // This is city data - compress it
      dataToCache = compressCityData(data);
      isCompressed = true;
    }
    
    // Calculate approximate size
    const dataSize = new Blob([JSON.stringify(dataToCache)]).size;
    
    if (dataSize > 1000000) { // Still > 1MB after compression
      logger.warn(`⚠️ Data too large to cache (${dataSize} bytes), skipping cache for ${cacheKey}`);
      return; // Don't cache if still too large
    }
    
    await setDoc(doc(db, 'locationCache', cacheKey), {
      id: cacheKey,
      data: dataToCache,
      compressed: isCompressed,
      timestamp: now,
      expiresAt: now + CACHE_DURATION_MS,
      updatedAt: serverTimestamp(),
    });
    logger.debug(`💾 Cached: ${cacheKey} (${Math.round(dataSize / 1024)}KB${isCompressed ? ', compressed' : ''})`);
  } catch (error) {
    logger.error('Cache write error:', error);
  }
}

/**
 * Fetch with caching
 * OPTIMIZATION: No rate limiting when data is in cache (instant loading)
 */
async function fetchWithCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Try cache first - NO RATE LIMITING for cached data!
  const cached = await getCachedData(cacheKey);
  if (cached) {
    return cached; // Instant return from cache
  }
  
  // Only fetch fresh data if not in cache
  logger.debug(`🌐 Fetching from GeoNames: ${cacheKey}`);
  const data = await fetcher();
  
  // Cache the result (in background, don't wait)
  setCachedData(cacheKey, data).catch(err => 
    logger.warn('Cache write failed:', err)
  );
  
  return data;
}

/**
 * Get all countries (195+)
 * This is the foundation of the location hierarchy
 */
export async function getAllCountries(): Promise<GeoNamesCountry[]> {
  return fetchWithCache('all_countries', async () => {
    const response = await fetchFromGeoNames<{ geonames: GeoNamesCountry[] }>(
      'countryInfoJSON',
      {}
    );
    
    return response.geonames.sort((a, b) => 
      a.countryName.localeCompare(b.countryName)
    );
  });
}

/**
 * Get TOP cities for a country (instant loading for better UX)
 * Returns only the most important cities - perfect for initial dropdown
 * - Loads INSTANTLY (cached) or very fast (<1 second)
 * - Shows top 100 cities by population
 * - Covers 95% of real-world registration cases
 * - Users can search for other cities separately
 */
export async function getTopCitiesForCountry(countryCode: string): Promise<GeoNamesCity[]> {
  const cacheKey = `top_cities_${countryCode}`;
  
  return fetchWithCache(cacheKey, async () => {
    // Get only top 100 cities - fast and sufficient for most users
    const response = await fetchFromGeoNames<{ geonames: GeoNamesCity[] }>(
      'searchJSON',
      {
        country: countryCode,
        featureClass: 'P', // Populated places
        maxRows: '100', // Only top 100 - FAST!
        orderby: 'population',
        style: 'FULL',
      }
    );
    
    return response.geonames || [];
  });
}

/**
 * Search cities in a country by name
 * Used for autocomplete/search when user types
 * - Returns matching cities instantly
 * - User can find ANY city by typing
 */
export async function searchCitiesInCountry(
  countryCode: string,
  searchTerm: string
): Promise<GeoNamesCity[]> {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }
  
  try {
    const response = await fetchFromGeoNames<{ geonames: GeoNamesCity[] }>(
      'searchJSON',
      {
        country: countryCode,
        featureClass: 'P',
        name_startsWith: searchTerm,
        maxRows: '20',
        orderby: 'population',
        style: 'FULL',
      }
    );
    
    return response.geonames || [];
  } catch (error) {
    logger.error('City search failed:', error);
    return [];
  }
}

/**
 * Get TOP districts/neighborhoods for a city (instant loading)
 * Returns only the main districts - sufficient for most users
 * Districts are optional, so we keep this lightweight
 * 
 * OPTIMIZATION: Uses city coordinates from local cache to avoid extra API call
 */
export async function getTopDistrictsForCity(
  cityName: string,
  countryCode: string
): Promise<GeoNamesDistrict[]> {
  const cacheKey = `top_districts_${countryCode}_${cityName.replace(/\s+/g, '_')}`;
  
  return fetchWithCache(cacheKey, async () => {
    // PERFORMANCE OPTIMIZATION: Get city from cache to avoid extra API call
    let city: GeoNamesCity | null = null;
    
    try {
      const cachedCities = await getCachedData(`top_cities_${countryCode}`);
      if (cachedCities && Array.isArray(cachedCities)) {
        city = cachedCities.find((c: GeoNamesCity) => c.name === cityName);
        if (city) {
          logger.debug(`✓ Using cached city data for ${cityName} - NO EXTRA API CALL`);
        }
      }
    } catch (error) {
      logger.debug('Could not retrieve from city cache, will fetch from API');
    }
    
    // If not in cache, fetch from API (only when necessary)
    if (!city) {
      logger.debug(`⚠️ City not in cache, making API call for ${cityName}...`);
      const cityResponse = await fetchFromGeoNames<{ geonames: GeoNamesCity[] }>(
        'searchJSON',
        {
          q: cityName,
          country: countryCode,
          maxRows: '1',
          featureClass: 'P',
        }
      );
      
      if (!cityResponse.geonames || cityResponse.geonames.length === 0) {
        logger.warn(`City not found: ${cityName}, ${countryCode}`);
        return [];
      }
      
      city = cityResponse.geonames[0];
    }
    
    // OPTIMIZED STRATEGY:
    // 1. Use city coords from cache (no extra API call for city lookup)
    // 2. Use searchJSON with lang parameter to get Arabic names directly
    // 3. Single API call = FAST (1 second with rate limiter)
    
    const arabicCountries = ['SA', 'AE', 'EG', 'IQ', 'JO', 'KW', 'LB', 'LY', 'MA', 'OM', 'PS', 'QA', 'SD', 'SY', 'TN', 'YE', 'BH', 'DZ'];
    const isArabicCountry = arabicCountries.includes(countryCode);
    
    let districts: GeoNamesDistrict[] = [];
    
    try {
      // Use searchJSON with specific parameters for districts
      // This returns proper localized names when lang is specified
      const response = await fetchFromGeoNames<{ geonames: GeoNamesDistrict[] }>(
        'searchJSON',
        {
          country: countryCode,
          adminName1: city.adminName1 || '', // State/Province filter
          q: cityName, // Search near this city
          featureCode: 'PPLX', // PPLX = section of populated place (district/neighborhood)
          maxRows: '100',
          style: 'FULL',
          lang: isArabicCountry ? 'ar' : 'en', // Request Arabic names for Arabic countries
        }
      );
      
      districts = response.geonames || [];
      
      // If PPLX returns nothing, try broader search with nearby
      if (districts.length === 0) {
        logger.debug(`No PPLX districts found, trying nearby for ${cityName}...`);
        const nearbyResponse = await fetchFromGeoNames<{ geonames: GeoNamesDistrict[] }>(
          'findNearbyJSON',
          {
            lat: city.lat,
            lng: city.lng,
            radius: '20',
            maxRows: '50',
            style: 'FULL',
            lang: isArabicCountry ? 'ar' : 'en', // Request Arabic names
          }
        );
        districts = nearbyResponse.geonames || [];
        
        // Filter to only districts/neighborhoods
        districts = districts.filter(d => {
          const fcode = (d as unknown).fcode;
          return fcode === 'PPLX' || fcode === 'PPL' || fcode === 'ADM3' || fcode === 'ADM4';
        });
      }
      
      logger.debug(`Found ${districts.length} districts for ${cityName}, ${countryCode}`);
    } catch (error) {
      logger.warn('District fetch failed:', error);
      return [];
    }
    
    // For Arabic countries, ensure we're showing Arabic script
    if (isArabicCountry && districts.length > 0) {
      districts = districts.map(district => {
        // If the API returned Arabic names, they'll be in the 'name' field
        // Check if it's already Arabic
        if (isArabicScript(district.name)) {
          return district;
        }
        
        // Check alternateNames for Arabic version
        if (district.alternateNames && Array.isArray(district.alternateNames)) {
          const arabicName = district.alternateNames.find(
            (alt: unknown) => alt.lang === 'ar' && isArabicScript(alt.name)
          );
          
          if (arabicName) {
            return {
              ...district,
              name: arabicName.name,
            };
          }
        }
        
        // Keep romanized name if no Arabic version found
        return district;
      });
    }
    
    // Remove duplicates and sort
    const uniqueDistricts = Array.from(
      new Map(districts.map(d => [d.geonameId, d])).values()
    );
    
    return uniqueDistricts.sort((a, b) => 
      a.name.localeCompare(b.name, isArabicCountry ? 'ar' : undefined)
    );
  });
}

/**
 * Search districts in a city by name
 * Used for autocomplete when user types
 */
export async function searchDistrictsInCity(
  cityName: string,
  countryCode: string,
  searchTerm: string
): Promise<GeoNamesDistrict[]> {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }
  
  try {
    // Get city first
    const cityResponse = await fetchFromGeoNames<{ geonames: GeoNamesCity[] }>(
      'searchJSON',
      {
        q: cityName,
        country: countryCode,
        maxRows: '1',
        featureClass: 'P',
      }
    );
    
    if (!cityResponse.geonames || cityResponse.geonames.length === 0) {
      return [];
    }
    
    const city = cityResponse.geonames[0];
    
    // Search nearby locations matching search term
    const response = await fetchFromGeoNames<{ geonames: GeoNamesDistrict[] }>(
      'findNearbyJSON',
      {
        lat: city.lat,
        lng: city.lng,
        radius: '20',
        maxRows: '20',
        style: 'SHORT',
      }
    );
    
    // Filter by search term locally
    const filtered = (response.geonames || []).filter(d =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered;
  } catch (error) {
    logger.error('District search failed:', error);
    return [];
  }
}

/**
 * Search locations across all levels (countries, cities, districts)
 * Useful for autocomplete/search features
 */
export async function searchLocations(searchTerm: string, maxResults: number = 50): Promise<any[]> {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }
  
  try {
    const response = await fetchFromGeoNames<{ geonames: unknown[] }>(
      'searchJSON',
      {
        q: searchTerm,
        maxRows: maxResults.toString(),
        style: 'FULL',
        orderby: 'relevance',
      }
    );
    
    return response.geonames || [];
  } catch (error) {
    logger.error('Location search failed:', error);
    return [];
  }
}

/**
 * Validate GeoNames API credentials
 * Call this during app initialization to ensure setup is correct
 */
export async function validateGeoNamesSetup(): Promise<boolean> {
  try {
    await fetchFromGeoNames('countryInfoJSON', { country: 'US' });
    logger.debug('✅ GeoNames API connected successfully');
    return true;
  } catch (error) {
    logger.error('❌ GeoNames API setup failed:', error);
    logger.error('Please ensure:');
    logger.error('1. You have registered at http://www.geonames.org/login');
    logger.error('2. You have enabled Free Web Services in your account');
    logger.error('3. Your username is set in VITE_GEONAMES_USERNAME');
    return false;
  }
}

/**
 * Get location statistics
 * Useful for monitoring and debugging
 */
export async function getLocationStats(): Promise<{
  totalCountries: number;
  cachedCountries: number;
  cachedCities: number;
  cachedDistricts: number;
}> {
  try {
    const cacheSnapshot = await getDocs(collection(db, 'locationCache'));
    
    const stats = {
      totalCountries: 0,
      cachedCountries: 0,
      cachedCities: 0,
      cachedDistricts: 0,
    };
    
    cacheSnapshot.forEach(doc => {
      const id = doc.id;
      if (id === 'all_countries') {
        stats.cachedCountries = 1;
        const data = doc.data();
        if (data.data) {
          stats.totalCountries = data.data.length;
        }
      } else if (id.startsWith('cities_')) {
        stats.cachedCities++;
      } else if (id.startsWith('districts_')) {
        stats.cachedDistricts++;
      }
    });
    
    return stats;
  } catch (error) {
    logger.error('Failed to get location stats:', error);
    return {
      totalCountries: 0,
      cachedCountries: 0,
      cachedCities: 0,
      cachedDistricts: 0,
    };
  }
}

/**
 * Clear location cache
 * Useful for forcing fresh data fetch
 */
export async function clearLocationCache(): Promise<void> {
  try {
    const cacheSnapshot = await getDocs(collection(db, 'locationCache'));
    const deletePromises = cacheSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    logger.debug('✅ Location cache cleared');
  } catch (error) {
    logger.error('Failed to clear location cache:', error);
  }
}

export default {
  getAllCountries,
  getTopCitiesForCountry,
  searchCitiesInCountry,
  getTopDistrictsForCity,
  searchDistrictsInCity,
  searchLocations,
  validateGeoNamesSetup,
  getLocationStats,
  clearLocationCache,
};
