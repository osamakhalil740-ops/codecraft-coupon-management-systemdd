import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@/lib/prisma';
import { 
  ANALYTICS_KEYS, 
  getCounter 
} from '@/lib/analytics-redis';
import { redis as upstashRedis } from '@/lib/redis';
import { AggregateAnalyticsJob } from '@/lib/queue';

// Lazy initialization for Redis connection
let connection: Redis | null = null;

function getConnection(): Redis {
  if (!connection) {
    connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

/**
 * Analytics Aggregation Worker
 * Runs periodically to aggregate Redis counters into PostgreSQL
 */
const analyticsWorker = new Worker<AggregateAnalyticsJob>(
  'analytics-aggregation',
  async (job: Job<AggregateAnalyticsJob>) => {
    console.log(`🔄 Processing analytics aggregation job ${job.id}`);
    
    const { couponIds, storeIds, date } = job.data;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    try {
      // If specific coupon IDs provided, aggregate those
      if (couponIds && couponIds.length > 0) {
        await aggregateCouponAnalytics(couponIds, targetDate);
      } else {
        // Aggregate all active coupons
        await aggregateAllCouponAnalytics(targetDate);
      }

      // If specific store IDs provided, aggregate those
      if (storeIds && storeIds.length > 0) {
        await aggregateStoreAnalytics(storeIds, targetDate);
      } else {
        // Aggregate all active stores
        await aggregateAllStoreAnalytics(targetDate);
      }

      // Update last aggregation timestamp
      await upstashRedis.set('analytics:last_aggregation', new Date().toISOString());

      console.log(`✅ Analytics aggregation completed for ${targetDate.toISOString()}`);
      
      return { success: true, date: targetDate.toISOString() };
    } catch (error) {
      console.error('❌ Analytics aggregation failed:', error);
      throw error;
    }
  },
  {
    connection: getConnection(),
    concurrency: 1, // Process one job at a time
    limiter: {
      max: 10,
      duration: 1000, // Max 10 jobs per second
    },
  }
);

/**
 * Aggregate analytics for specific coupons
 */
async function aggregateCouponAnalytics(couponIds: string[], date: Date) {
  console.log(`📊 Aggregating analytics for ${couponIds.length} coupons`);

  for (const couponId of couponIds) {
    try {
      // Get counts from Redis
      const [views, copies, clicks, uniqueViews, uniqueCopies, uniqueClicks] = await Promise.all([
        getCounter(ANALYTICS_KEYS.COUPON_VIEWS(couponId)),
        getCounter(ANALYTICS_KEYS.COUPON_COPIES(couponId)),
        getCounter(ANALYTICS_KEYS.COUPON_CLICKS(couponId)),
        getCounter(ANALYTICS_KEYS.COUPON_UNIQUE_VIEWS(couponId)),
        getCounter(ANALYTICS_KEYS.COUPON_UNIQUE_COPIES(couponId)),
        getCounter(ANALYTICS_KEYS.COUPON_UNIQUE_CLICKS(couponId)),
      ]);

      // Skip if no activity
      if (views === 0 && copies === 0 && clicks === 0) {
        continue;
      }

      // Upsert analytics record
      await prisma.couponAnalytics.upsert({
        where: {
          couponId_date: {
            couponId,
            date,
          },
        },
        create: {
          couponId,
          date,
          views,
          copies,
          clicks,
          uniqueViews,
          uniqueCopies,
          uniqueClicks,
        },
        update: {
          views: { increment: views },
          copies: { increment: copies },
          clicks: { increment: clicks },
          uniqueViews: { increment: uniqueViews },
          uniqueCopies: { increment: uniqueCopies },
          uniqueClicks: { increment: uniqueClicks },
        },
      });

      // Clear Redis counters after aggregation
      await clearCouponCounters(couponId);

      console.log(`✓ Aggregated analytics for coupon ${couponId}: ${views}v, ${copies}c, ${clicks}cl`);
    } catch (error) {
      console.error(`Failed to aggregate coupon ${couponId}:`, error);
    }
  }
}

/**
 * Aggregate analytics for all active coupons
 */
async function aggregateAllCouponAnalytics(date: Date) {
  // Get all active coupons
  const coupons = await prisma.coupon.findMany({
    where: {
      status: 'ACTIVE',
    },
    select: {
      id: true,
    },
  });

  if (coupons.length === 0) {
    console.log('No active coupons to aggregate');
    return;
  }

  const couponIds = coupons.map(c => c.id);
  await aggregateCouponAnalytics(couponIds, date);
}

/**
 * Aggregate analytics for specific stores
 */
async function aggregateStoreAnalytics(storeIds: string[], date: Date) {
  console.log(`📊 Aggregating analytics for ${storeIds.length} stores`);

  for (const storeId of storeIds) {
    try {
      // Get counts from Redis
      const [views, couponViews, couponCopies, couponClicks] = await Promise.all([
        getCounter(ANALYTICS_KEYS.STORE_VIEWS(storeId)),
        getCounter(ANALYTICS_KEYS.STORE_COUPON_VIEWS(storeId)),
        getCounter(ANALYTICS_KEYS.STORE_COUPON_COPIES(storeId)),
        getCounter(ANALYTICS_KEYS.STORE_COUPON_CLICKS(storeId)),
      ]);

      // Skip if no activity
      if (views === 0 && couponViews === 0 && couponCopies === 0 && couponClicks === 0) {
        continue;
      }

      // Upsert analytics record
      await prisma.storeAnalytics.upsert({
        where: {
          storeId_date: {
            storeId,
            date,
          },
        },
        create: {
          storeId,
          date,
          views,
          couponViews,
          couponCopies,
          couponClicks,
        },
        update: {
          views: { increment: views },
          couponViews: { increment: couponViews },
          couponCopies: { increment: couponCopies },
          couponClicks: { increment: couponClicks },
        },
      });

      // Clear Redis counters after aggregation
      await clearStoreCounters(storeId);

      console.log(`✓ Aggregated analytics for store ${storeId}`);
    } catch (error) {
      console.error(`Failed to aggregate store ${storeId}:`, error);
    }
  }
}

/**
 * Aggregate analytics for all active stores
 */
async function aggregateAllStoreAnalytics(date: Date) {
  // Get all active stores
  const stores = await prisma.store.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (stores.length === 0) {
    console.log('No active stores to aggregate');
    return;
  }

  const storeIds = stores.map(s => s.id);
  await aggregateStoreAnalytics(storeIds, date);
}

/**
 * Clear Redis counters for a coupon after aggregation
 */
async function clearCouponCounters(couponId: string) {
  const keys = [
    ANALYTICS_KEYS.COUPON_VIEWS(couponId),
    ANALYTICS_KEYS.COUPON_COPIES(couponId),
    ANALYTICS_KEYS.COUPON_CLICKS(couponId),
    ANALYTICS_KEYS.COUPON_UNIQUE_VIEWS(couponId),
    ANALYTICS_KEYS.COUPON_UNIQUE_COPIES(couponId),
    ANALYTICS_KEYS.COUPON_UNIQUE_CLICKS(couponId),
  ];

  for (const key of keys) {
    await upstashRedis.del(key);
  }
}

/**
 * Clear Redis counters for a store after aggregation
 */
async function clearStoreCounters(storeId: string) {
  const keys = [
    ANALYTICS_KEYS.STORE_VIEWS(storeId),
    ANALYTICS_KEYS.STORE_COUPON_VIEWS(storeId),
    ANALYTICS_KEYS.STORE_COUPON_COPIES(storeId),
    ANALYTICS_KEYS.STORE_COUPON_CLICKS(storeId),
  ];

  for (const key of keys) {
    await upstashRedis.del(key);
  }
}

// Worker event listeners
analyticsWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

analyticsWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});

analyticsWorker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📴 Shutting down analytics worker...');
  await analyticsWorker.close();
  if (connection) await connection.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📴 Shutting down analytics worker...');
  await analyticsWorker.close();
  if (connection) await connection.quit();
  process.exit(0);
});

console.log('🚀 Analytics worker started');

export default analyticsWorker;
