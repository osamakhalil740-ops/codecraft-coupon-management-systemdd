import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';
import { invalidateAllUserSessions } from '@/lib/redis';
import { successResponse, errorResponse } from '@/lib/api-response';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * POST /api/auth/logout - Logout user and invalidate all sessions
 */
export async function POST(request: NextRequest) {
  try {
    const authenticatedRequest = await withAuth(request);
    const userId = authenticatedRequest.user.id;

    // Delete all sessions for this user
    await prisma.session.deleteMany({
      where: { userId },
    });

    // Delete all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Invalidate Redis cache
    await invalidateAllUserSessions(userId);

    const response = successResponse(null, 'Logged out successfully');

    // Clear cookies
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('next-auth.csrf-token');
    response.cookies.delete('refresh_token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse(error as Error);
  }
}
