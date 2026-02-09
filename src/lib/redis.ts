import { Redis } from '@upstash/redis';

// Lazy initialization to avoid build-time errors when env vars are not set
let redisInstance: Redis | null = null;

function getRedis(): Redis {
  if (!redisInstance) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!url || !token) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set');
    }
    
    redisInstance = new Redis({ url, token });
  }
  return redisInstance;
}

// Export getter for backwards compatibility
export const redis = new Proxy({} as Redis, {
  get: (target, prop) => {
    const client = getRedis();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

// Session cache keys
const SESSION_PREFIX = 'session:';
const USER_SESSION_PREFIX = 'user_sessions:';
const REFRESH_TOKEN_PREFIX = 'refresh_token:';

// Cache TTL (Time To Live)
const SESSION_TTL = 60 * 15; // 15 minutes (access token lifetime)
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30; // 30 days

export interface CachedSession {
  userId: string;
  email: string;
  role: string;
  name?: string;
  avatar?: string;
  emailVerified?: boolean;
  sessionId: string;
}

/**
 * Cache user session in Redis
 */
export async function cacheSession(
  sessionId: string,
  session: CachedSession
): Promise<void> {
  const key = `${SESSION_PREFIX}${sessionId}`;
  await redis.setex(key, SESSION_TTL, JSON.stringify(session));

  // Track user's active sessions
  const userSessionsKey = `${USER_SESSION_PREFIX}${session.userId}`;
  await redis.sadd(userSessionsKey, sessionId);
  await redis.expire(userSessionsKey, REFRESH_TOKEN_TTL);
}

/**
 * Get cached session from Redis
 */
export async function getSession(sessionId: string): Promise<CachedSession | null> {
  const key = `${SESSION_PREFIX}${sessionId}`;
  const data = await redis.get<string>(key);

  if (!data) return null;

  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return null;
  }
}

/**
 * Invalidate session from cache
 */
export async function invalidateSession(sessionId: string, userId?: string): Promise<void> {
  const key = `${SESSION_PREFIX}${sessionId}`;
  await redis.del(key);

  if (userId) {
    const userSessionsKey = `${USER_SESSION_PREFIX}${userId}`;
    await redis.srem(userSessionsKey, sessionId);
  }
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<string[]> {
  const userSessionsKey = `${USER_SESSION_PREFIX}${userId}`;
  const sessions = await redis.smembers<string>(userSessionsKey);
  return sessions || [];
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  const sessions = await getUserSessions(userId);

  // Delete all session keys
  if (sessions.length > 0) {
    const keys = sessions.map((sid) => `${SESSION_PREFIX}${sid}`);
    await redis.del(...keys);
  }

  // Delete user sessions set
  const userSessionsKey = `${USER_SESSION_PREFIX}${userId}`;
  await redis.del(userSessionsKey);
}

/**
 * Cache refresh token metadata
 */
export async function cacheRefreshToken(
  token: string,
  userId: string,
  expiresAt: Date
): Promise<void> {
  const key = `${REFRESH_TOKEN_PREFIX}${token}`;
  const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

  if (ttl > 0) {
    await redis.setex(
      key,
      ttl,
      JSON.stringify({
        userId,
        expiresAt: expiresAt.toISOString(),
      })
    );
  }
}

/**
 * Get cached refresh token metadata
 */
export async function getRefreshToken(
  token: string
): Promise<{ userId: string; expiresAt: string } | null> {
  const key = `${REFRESH_TOKEN_PREFIX}${token}`;
  const data = await redis.get<string>(key);

  if (!data) return null;

  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return null;
  }
}

/**
 * Invalidate refresh token
 */
export async function invalidateRefreshToken(token: string): Promise<void> {
  const key = `${REFRESH_TOKEN_PREFIX}${token}`;
  await redis.del(key);
}

/**
 * Extend session TTL (refresh access)
 */
export async function extendSession(sessionId: string): Promise<void> {
  const key = `${SESSION_PREFIX}${sessionId}`;
  await redis.expire(key, SESSION_TTL);
}

/**
 * Cache arbitrary data with TTL
 */
export async function cacheData(
  key: string,
  data: any,
  ttlSeconds: number
): Promise<void> {
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
}

/**
 * Get cached data
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  const data = await redis.get<string>(key);

  if (!data) return null;

  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return null;
  }
}

/**
 * Delete cached data
 */
export async function deleteCachedData(key: string): Promise<void> {
  await redis.del(key);
}
