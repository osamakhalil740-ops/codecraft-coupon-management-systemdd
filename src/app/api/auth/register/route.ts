import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/utils/password';
import { registerSchema } from '@/lib/validations/auth';
import { sendVerificationEmail } from '@/lib/email';
import { nanoid } from 'nanoid';
import { errorResponse, successResponse } from '@/lib/api-response';
import { ConflictError, ValidationError } from '@/lib/errors';


// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        new ValidationError(validationResult.error.errors[0]?.message || 'Invalid input')
      );
    }

    const { name, email, password, role } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse(new ConflictError('User with this email already exists'));
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    // Generate verification token
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
    try {
      await sendVerificationEmail(user.email, user.name || 'User', token);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue even if email fails - user can request another verification
    }

    return successResponse(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      'Registration successful. Please check your email to verify your account.',
      201
    );
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse(error as Error);
  }
}
