import { NextRequest } from 'next/server';
import { withRole } from '@/lib/api-middleware';
import { errorResponse, successResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { Role, StoreStatus } from '@prisma/client';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/errors';
import { slugify } from '@/lib/utils/slugify';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/store-owner/stores - Get stores owned by current user
 * Requires STORE_OWNER role
 */
export async function GET(request: NextRequest) {
  try {
    const authenticatedRequest = await withRole(request, [Role.STORE_OWNER, Role.SUPER_ADMIN]);
    const userId = authenticatedRequest.user.id;

    const stores = await prisma.store.findMany({
      where: { ownerId: userId },
      include: {
        country: true,
        city: true,
        categories: {
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            coupons: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(stores);
  } catch (error) {
    console.error('Get stores error:', error);
    return errorResponse(error as Error);
  }
}

/**
 * POST /api/store-owner/stores - Create a new store
 * Requires STORE_OWNER role
 */
export async function POST(request: NextRequest) {
  try {
    const authenticatedRequest = await withRole(request, [Role.STORE_OWNER, Role.SUPER_ADMIN]);
    const userId = authenticatedRequest.user.id;

    const body = await request.json();
    const {
      name,
      description,
      email,
      phone,
      website,
      address,
      countryId,
      cityId,
      districtId,
      postalCode,
      latitude,
      longitude,
      categoryIds, // Array of category IDs
      logoUrl,
      coverImageUrl,
    } = body;

    // Validate required fields
    if (!name || !email || !countryId) {
      return errorResponse(new ValidationError('Name, email, and country are required'));
    }

    // Check subscription limits
    const { canCreateStore } = await import('@/lib/subscription-helpers');
    const canCreate = await canCreateStore(userId);
    if (!canCreate) {
      const { getUserLimits } = await import('@/lib/subscription-helpers');
      const limits = await getUserLimits(userId);
      return errorResponse(
        new ForbiddenError(
          `You have reached the maximum number of stores (${limits.limits.maxStores}) for your ${limits.plan} plan. Please upgrade to create more stores.`
        )
      );
    }

    // Verify location hierarchy exists
    const country = await prisma.country.findUnique({
      where: { id: countryId },
    });

    if (!country) {
      return errorResponse(new NotFoundError('Country not found'));
    }

    if (cityId) {
      const city = await prisma.city.findUnique({
        where: { id: cityId },
      });

      if (!city || city.countryId !== countryId) {
        return errorResponse(new ValidationError('Invalid city for selected country'));
      }
    }

    if (districtId) {
      const district = await prisma.district.findUnique({
        where: { id: districtId },
      });

      if (!district || (cityId && district.cityId !== cityId)) {
        return errorResponse(new ValidationError('Invalid district for selected city'));
      }
    }

    // Generate slug
    const slug = slugify(name);

    // Check if slug already exists
    const existingStore = await prisma.store.findUnique({
      where: { slug },
    });

    let finalSlug = slug;
    if (existingStore) {
      // Append random string to make unique
      finalSlug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
    }

    // Create store
    const store = await prisma.store.create({
      data: {
        name,
        slug: finalSlug,
        description,
        email,
        phone,
        website,
        address,
        countryId,
        cityId,
        districtId,
        postalCode,
        latitude,
        longitude,
        logoUrl,
        coverImageUrl,
        ownerId: userId,
        status: StoreStatus.PENDING, // Requires admin approval
        isActive: true,
        isVerified: false,
      },
    });

    // Assign categories if provided
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      await prisma.storeCategory.createMany({
        data: categoryIds.map((categoryId: string) => ({
          storeId: store.id,
          categoryId,
        })),
        skipDuplicates: true,
      });
    }

    // Fetch complete store with relations
    const completeStore = await prisma.store.findUnique({
      where: { id: store.id },
      include: {
        country: true,
        city: true,
        district: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    return successResponse(
      completeStore,
      'Store created successfully. Awaiting admin approval.',
      201
    );
  } catch (error) {
    console.error('Create store error:', error);
    return errorResponse(error as Error);
  }
}
