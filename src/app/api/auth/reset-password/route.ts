import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/utils/password';
import { sendPasswordChangedEmail } from '@/lib/email';
import { errorResponse, successResponse } from '@/lib/api-response';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { z } from 'zod';


// Force dynamic rendering
export const dynamic = 'force-dynamic';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = resetPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        new ValidationError(validationResult.error.errors[0]?.message || 'Invalid input')
      );
    }

    const { token, password } = validationResult.data;

    // Find password reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return errorResponse(new NotFoundError('Invalid or expired reset token'));
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      return errorResponse(new ValidationError('Reset token has expired'));
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password
    const user = await prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        password: hashedPassword,
      },
    });

    // Delete used token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    // Delete all other password reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Invalidate all existing sessions (user must log in again)
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    // Send password changed notification
    try {
      await sendPasswordChangedEmail(user.email, user.name || 'User');
    } catch (emailError) {
      console.error('Failed to send password changed email:', emailError);
    }

    return successResponse(
      { email: user.email },
      'Password reset successfully. Please log in with your new password.'
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(error as Error);
  }
}
