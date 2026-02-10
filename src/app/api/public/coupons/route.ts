import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { searchCoupons } from '@/lib/search';
import { getPaginationParams } from '@/lib/utils/pagination';
import { getCacheOrSet } from '@/lib/cache';
import { withRateLimit } from '@/lib/api-middleware';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/public/coupons - Public coupon listing with search and filters
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    await withRateLimit(request, 100, 60);

    const { searchParams } = new URL(request.url);

    const { page, limit } = getPaginationParams(
      searchParams.get('page'),
      searchParams.get('limit')
    );

    const filters = {
      query: searchParams.get('q') || undefined,
      categoryId: searchParams.get('category') || undefined,
      countryId: searchParams.get('country') || undefined,
      cityId: searchParams.get('city') || undefined,
      districtId: searchParams.get('district') || undefined,
      minDiscount: searchParams.get('minDiscount')
        ? parseFloat(searchParams.get('minDiscount')!)
        : undefined,
      maxDiscount: searchParams.get('maxDiscount')
        ? parseFloat(searchParams.get('maxDiscount')!)
        : undefined,
      type: searchParams.get('type') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'newest',
    };

    // Generate cache key from filters
    const cacheKey = `coupons:${JSON.stringify(filters)}:${page}:${limit}`;

    // Use cache with 5 minute TTL
    const result = await getCacheOrSet(
      cacheKey,
      () => searchCoupons(filters, page, limit),
      { ttl: 300, namespace: 'api', tags: ['coupons', 'public'] }
    );

    return successResponse(result);
  } catch (error) {
    console.error('Get coupons error:', error);
    return errorResponse(error as Error);
  }
}
