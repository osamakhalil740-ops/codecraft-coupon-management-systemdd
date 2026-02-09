import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { searchStores } from '@/lib/search';
import { getPaginationParams } from '@/lib/utils/pagination';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/public/stores - Public store listing with search and filters
 */
export async function GET(request: NextRequest) {
  try {
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
      sortBy: (searchParams.get('sortBy') as any) || 'newest',
    };

    const result = await searchStores(filters, page, limit);

    return successResponse(result);
  } catch (error) {
    console.error('Get stores error:', error);
    return errorResponse(error as Error);
  }
}
