import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWelcomeEmail } from '@/lib/email';
import { errorResponse, successResponse } from '@/lib/api-response';
import { NotFoundError, ValidationError } from '@/lib/errors';


// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return errorResponse(new ValidationError('Verification token is required'));
    }

    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      return errorResponse(new NotFoundError('Invalid or expired verification token'));
    }

    // Check if token is expired
    if (verificationToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });
      return errorResponse(new ValidationError('Verification token has expired'));
    }

    // Update user as verified
    const user = await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: new Date(),
      },
    });

    // Delete used token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name || 'User');
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    return successResponse(
      {
        email: user.email,
        verified: true,
      },
      'Email verified successfully'
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return errorResponse(error as Error);
  }
}
