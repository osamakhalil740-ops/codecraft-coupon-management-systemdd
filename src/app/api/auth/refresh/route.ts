import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRefreshToken, generateTokenPair } from '@/lib/jwt';
import { cacheSession, cacheRefreshToken } from '@/lib/redis';
import { errorResponse, successResponse } from '@/lib/api-response';
import { UnauthorizedError } from '@/lib/errors';
import { nanoid } from 'nanoid';


// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie or body
    const refreshToken =
      request.cookies.get('refresh_token')?.value ||
      (await request.json().then((body) => body.refreshToken));

    if (!refreshToken) {
      return errorResponse(new UnauthorizedError('Refresh token required'));
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return errorResponse(new UnauthorizedError('Invalid refresh token'));
    }

    // Check if token exists in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      // Clean up expired token
      if (tokenRecord) {
        await prisma.refreshToken.delete({
          where: { id: tokenRecord.id },
        });
      }
      return errorResponse(new UnauthorizedError('Refresh token expired'));
    }

    const user = tokenRecord.user;

    // Check if user is active
    if (!user.isActive) {
      return errorResponse(new UnauthorizedError('Account is disabled'));
    }

    // Generate new token pair
    const sessionId = nanoid(32);
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    });

    // Save new refresh token to database
    const newRefreshToken = await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(tokens.refreshTokenExpiry * 1000),
      },
    });

    // Cache session in Redis
    await cacheSession(sessionId, {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name || undefined,
      avatar: user.avatar || undefined,
      emailVerified: !!user.emailVerified,
      sessionId,
    });

    // Cache refresh token in Redis
    await cacheRefreshToken(
      tokens.refreshToken,
      user.id,
      new Date(tokens.refreshTokenExpiry * 1000)
    );

    // Delete old refresh token
    await prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    // Set refresh token in HttpOnly cookie
    const response = successResponse(
      {
        accessToken: tokens.accessToken,
        accessTokenExpiry: tokens.accessTokenExpiry,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          emailVerified: user.emailVerified,
        },
      },
      'Tokens refreshed successfully'
    );

    response.cookies.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    return errorResponse(error as Error);
  }
}
