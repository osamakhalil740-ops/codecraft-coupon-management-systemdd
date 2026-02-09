import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { nanoid } from 'nanoid';
import { errorResponse, successResponse } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';


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

    // Always return success to prevent email enumeration
    if (!user) {
      return successResponse(
        { email },
        'If an account exists with this email, you will receive a password reset link'
      );
    }

    // Check if user has password (not OAuth-only user)
    if (!user.password) {
      return successResponse(
        { email },
        'If an account exists with this email, you will receive a password reset link'
      );
    }

    // Delete any existing password reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate password reset token
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.name || 'User', token);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }

    return successResponse(
      { email },
      'If an account exists with this email, you will receive a password reset link'
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse(error as Error);
  }
}
