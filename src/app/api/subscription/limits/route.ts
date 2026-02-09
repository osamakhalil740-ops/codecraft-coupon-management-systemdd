import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserLimits } from '@/lib/subscription-helpers';
import { apiResponse } from '@/lib/api-response';


// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiResponse.unauthorized('You must be logged in');
    }

    const limits = await getUserLimits(session.user.id);

    return apiResponse.success(limits);
  } catch (error) {
    console.error('Get limits error:', error);
    return apiResponse.error('Failed to get subscription limits', 500);
  }
}
