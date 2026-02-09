import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { sendEmailNotification } from '@/lib/notifications';
import { SendNotificationJob } from '@/lib/queue';

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
 * Notification Worker
 * Processes notification jobs (email sending)
 */
const notificationWorker = new Worker<SendNotificationJob>(
  'notifications',
  async (job: Job<SendNotificationJob>) => {
    console.log(`📧 Processing notification job ${job.id}`);
    
    const data = job.data;

    try {
      // Send email notification if requested
      if (data.sendEmail) {
        await sendEmailNotification({
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          actionUrl: data.actionUrl,
          actionText: data.actionText,
          couponId: data.couponId,
          storeId: data.storeId,
          affiliateId: data.affiliateId,
          metadata: data.metadata,
          emailLocale: data.metadata?.locale || 'en',
        });
      }

      console.log(`✅ Notification sent to user ${data.userId}`);
      
      return { success: true, userId: data.userId };
    } catch (error) {
      console.error('❌ Notification failed:', error);
      throw error;
    }
  },
  {
    connection: getConnection(),
    concurrency: 5, // Process 5 notifications concurrently
    limiter: {
      max: 100,
      duration: 1000, // Max 100 emails per second
    },
  }
);

// Worker event listeners
notificationWorker.on('completed', (job) => {
  console.log(`✅ Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`❌ Notification job ${job?.id} failed:`, err);
});

notificationWorker.on('error', (err) => {
  console.error('❌ Notification worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📴 Shutting down notification worker...');
  await notificationWorker.close();
  if (connection) await connection.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📴 Shutting down notification worker...');
  await notificationWorker.close();
  if (connection) await connection.quit();
  process.exit(0);
});

console.log('🚀 Notification worker started');

export default notificationWorker;
