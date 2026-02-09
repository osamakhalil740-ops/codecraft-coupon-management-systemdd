import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { nanoid } from 'nanoid';
import { errorResponse, successResponse } from '@/lib/api-response';
import { NotFoundError, ValidationError } from '@/lib/errors';


// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return errorResponse(new ValidationError('Email is required'));
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return errorResponse(new NotFoundError('User not found'));
    }

    // Check if already verified
    if (user.emailVerified) {
      return errorResponse(new ValidationError('Email is already verified'));
    }

    // Delete any existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate new verification token
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        token,
        userId: user.id,
        email: user.email,
        expiresAt,
      },
    });

    // Send verification email
    await sendVerificationEmail(user.email, user.name || 'User', token);

    return successResponse(
      { email: user.email },
      'Verification email sent successfully'
    );
  } catch (error) {
    console.error('Resend verification error:', error);
    return errorResponse(error as Error);
  }
}
